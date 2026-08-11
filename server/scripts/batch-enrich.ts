import fs from 'fs';
import path from 'path';
import { enrichWord } from '../src/llm';

const DATA_DIR = path.join(process.cwd(), 'data');
const LIST_FILES = [
  'ielts_sequential.json',
  'ielts_random.json',
  'ielts_frequency.json',
  'ielts_root.json',
];

const CONCURRENCY = 8;
const CHECKPOINT_EVERY = 100;
const MAX_WORDS = process.env.MAX_WORDS ? parseInt(process.env.MAX_WORDS) : Infinity;

interface Word {
  id: number;
  word: string;
  phonetic: string;
  example: string;
  exampleCn: string;
  meaning: string;
  [key: string]: unknown;
}

interface WordList {
  id: string;
  words: Word[];
  [key: string]: unknown;
}

interface Enrichment {
  phonetic: string;
  example: string;
  exampleCn: string;
  meaning: string;
}

const lists = LIST_FILES.map((f) => {
  const data: WordList = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
  return { file: f, data };
});

// 已有生成结果的单词直接复用，不重复调用 LLM
const enrichmentMap = new Map<string, Enrichment>();
for (const { data } of lists) {
  for (const w of data.words) {
    if (w.phonetic && w.example && !enrichmentMap.has(w.word)) {
      enrichmentMap.set(w.word, {
        phonetic: w.phonetic,
        example: w.example,
        exampleCn: w.exampleCn || '',
        meaning: w.meaning || '',
      });
    }
  }
}

const uniqueWords = new Set<string>();
for (const { data } of lists) {
  for (const w of data.words) uniqueWords.add(w.word);
}

const todo = [...uniqueWords].filter((w) => !enrichmentMap.has(w)).slice(0, MAX_WORDS);
console.log(`总唯一单词 ${uniqueWords.size}，已有结果 ${enrichmentMap.size}，待生成 ${todo.length}`);

function applyAndSave() {
  for (const { file, data } of lists) {
    let changed = false;
    for (const w of data.words) {
      const e = enrichmentMap.get(w.word);
      if (e && (!w.phonetic || !w.example)) {
        w.phonetic = w.phonetic || e.phonetic;
        w.example = w.example || e.example;
        w.exampleCn = w.exampleCn || e.exampleCn;
        w.meaning = w.meaning || e.meaning;
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
    }
  }
}

let done = 0;
let failed = 0;
const failedWords: string[] = [];
const startTime = Date.now();

async function worker(queue: string[]) {
  while (queue.length > 0) {
    const word = queue.shift()!;
    try {
      const result = await enrichWord(word);
      if (result && (result.phonetic || result.example)) {
        enrichmentMap.set(word, result);
      } else {
        failed++;
        failedWords.push(word);
      }
    } catch {
      failed++;
      failedWords.push(word);
    }
    done++;
    if (done % CHECKPOINT_EVERY === 0) {
      applyAndSave();
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = done / elapsed;
      const remain = Math.round((todo.length - done) / rate / 60);
      console.log(`进度 ${done}/${todo.length}（失败 ${failed}），预计剩余 ${remain} 分钟`);
    }
  }
}

const queue = [...todo];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
applyAndSave();

console.log(`完成：成功 ${done - failed}，失败 ${failed}`);
if (failedWords.length > 0) {
  fs.writeFileSync(path.join(DATA_DIR, 'enrich-failed.json'), JSON.stringify(failedWords, null, 2));
  console.log('失败单词已写入 data/enrich-failed.json');
}
