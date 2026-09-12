import fs from 'fs';
import path from 'path';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

const TARGET = parseInt(process.env.MAX_WORDS || '2500', 10);
const CONCURRENCY = 8;
const SEED_BATCH = 40;
const OUT = path.join(process.cwd(), 'data', 'chinese_core.json');

const LIST_META = {
  id: 'chinese_core',
  name: '中文 2500 词（汉英版）',
  description: '常用中文核心词，配拼音与英文翻译，含双语例句。',
  icon: '🏮',
  color: '#FF6584',
};

interface ChineseWord {
  id: number;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  exampleCn: string;
  difficulty: 1 | 2 | 3;
}

function containsCJK(s: string): boolean {
  return /[\u4e00-\u9fff]/.test(s);
}

async function llmJson(system: string, user: string, maxRetries = 3, model = 'doubao-seed-2-0-mini-260215'): Promise<any> {
  const client = new LLMClient();
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await client.invoke(
        [
          { role: 'system' as const, content: system },
          { role: 'user' as const, content: user },
        ],
        { model, temperature: 0.7 }
      );
      const content = (res.content || '').trim();
      const match = content.match(/\[[\s\S]*\]|{[\s\S]*}/);
      if (!match) throw new Error('no JSON in response');
      return JSON.parse(match[0]);
    } catch (e) {
      console.error(`  llm retry ${i + 1}: ${(e as Error).message}`);
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  return null;
}

async function main() {
  const existing: ChineseWord[] = fs.existsSync(OUT)
    ? JSON.parse(fs.readFileSync(OUT, 'utf-8')).words || []
    : [];
  const done = new Set(existing.map((w) => w.word));
  const seedSet = new Set(existing.map((w) => w.word));
  console.log(`已有 ${existing.length} 词，目标 ${TARGET}`);

  // ── Stage A: 生成种子词表（主题轮换，降低与已有词的重复率） ──
  const TOPICS = [
    '饮食与饮品', '交通出行', '学校教育', '工作职场', '情感与心情', '天气与自然', '购物消费',
    '健康与身体', '科技与网络', '家庭与亲戚', '娱乐与运动', '时间与日程', '地点与建筑',
    '日常动作', '外貌与穿着', '动物与植物', '数字与金钱', '旅行与假期', '社交与沟通',
    '家居与物品', '性格与品质', '学习与思考', '城市与乡村', '媒体与音乐', '法律与规则',
    '节日与传统', '职业与技能', '医疗与药品', '环保与能源', '厨房与烹饪', '方向与位置',
    '兴趣与爱好', '沟通与表达', '成功与失败', '习惯与坚持', '服务与效率', '安全与风险',
    '质量与程度', '变化与趋势', '资源与分配', '目标与计划', '合作与竞争', '文化与艺术',
    '农业与食品', '航空与海运', '学术与研究', '心理与情绪', '社交软件与手机', '银行与投资',
    '简历与面试', '租房与搬家', '邮寄与快递', '美容与时尚', '健身与减肥', '宠物与养花',
  ];
  const seeds: { word: string; en: string }[] = [];
  let batchIndex = 0;
  while (seedSet.size < TARGET) {
    const need = Math.min(SEED_BATCH, TARGET - seedSet.size);
    const topic = TOPICS[batchIndex % TOPICS.length];
    batchIndex++;
    const avoid = Array.from(seedSet).slice(-800).join('、');
    const arr = await llmJson(
      '你是汉语词汇专家。只输出 JSON 数组，不要其他内容。',
      `围绕「${topic}」主题，列出 ${need} 个常用的中文词语（2-4 个汉字，不要成语，不要含英文字母的词）。每个词给出简短英文释义。\n${avoid ? `以下词语已经全部生成过，绝对禁止再输出其中的任何一个：${avoid}` : ''}\n返回 JSON 数组：[{"word":"词","en":"rough english gloss"}]`
    );
    if (!Array.isArray(arr)) {
      console.error('seed stage failed, retry loop');
      continue;
    }
    let added = 0;
    for (const s of arr) {
      if (s && typeof s.word === 'string' && !seedSet.has(s.word.trim()) && s.word.trim().length >= 2) {
        seedSet.add(s.word.trim());
        seeds.push({ word: s.word.trim(), en: String(s.en || '') });
        added++;
      }
    }
    console.log(`seed +${added}（共 ${seedSet.size}）`);
    if (added === 0) await new Promise((r) => setTimeout(r, 3000));
  }

  // ── Stage B: 逐词 enrich ──
  const words = [...existing];
  let nextId = words.length ? Math.max(...words.map((w) => w.id)) + 1 : 1;
  const queue = seeds.filter((s) => !done.has(s.word));
  console.log(`待 enrich ${queue.length} 词`);

  let idx = 0;
  let saved = 0;
  async function worker() {
    while (true) {
      const my = idx++;
      if (my >= queue.length) return;
      const seed = queue[my];
      let attempt = 0;
      let w: ChineseWord | null = null;
      while (attempt < 3) {
        attempt++;
        const correction =
          attempt >= 2
            ? `\n【纠正·上一轮失败原因】example 字段被写成了英文句子。重新生成：example 必须是纯中文句子（每个字都是汉字，可含标点），exampleEn 必须同时存在、内容为该中文句子的英文翻译。`
            : '';
        const data = await llmJson(
          '你是对外汉语教学专家。只输出 JSON 对象，不要其他内容。',
          `为中文词语「${seed.word}」生成学习卡片数据：
- pinyin：拼音，带声调符号（如 nǐ hǎo）
- pos：词性，用英文缩写（n. / v. / adj. / adv. / pron. / num. 等）
- meaning：英文释义，简洁，如有多个常见义项用 " ; " 分隔
- example：必须是【中文句子】，包含该词，8-16 个汉字，自然常用
- exampleEn：上面中文例句对应的【英文翻译】
- difficulty：1-3（1=初级, 2=中级, 3=中高级）

方向规则（必须严格遵守）：example 是中文、exampleEn 是英文，绝不能反过来。
正确示例：{"word":"天气","example":"今天天气很好，我们一起去公园吧","exampleEn":"The weather is nice today, let's go to the park together"}
错误示例（禁止）：{"example":"The weather is nice today"} —— 这是英文句子，绝对禁止放进 example

返回 JSON：{"pinyin":"...","pos":"...","meaning":"...","example":"...","exampleEn":"...","difficulty":1}${correction}`,
          3,
          attempt >= 2 ? 'doubao-seed-2-0-pro-260215' : 'doubao-seed-2-0-mini-260215'
        );
        if (!data || !data.pinyin || !data.meaning || !data.example || !data.exampleEn) {
          console.error(`  fields missing for ${seed.word}: ${JSON.stringify(data).slice(0, 200)}`);
          continue;
        }
        if (!containsCJK(String(data.example)) || containsCJK(String(data.exampleEn))) {
          console.error(`  direction wrong for ${seed.word}, retry`);
          continue;
        }
        w = {
          id: nextId++,
          word: seed.word,
          phonetic: String(data.pinyin),
          pos: String(data.pos || ''),
          meaning: String(data.meaning),
          example: String(data.example),
          exampleCn: String(data.exampleEn),
          difficulty: ([1, 2, 3].includes(data.difficulty) ? data.difficulty : 2) as 1 | 2 | 3,
        };
        break;
      }
      if (!w) {
        console.error(`  skip ${seed.word}: bad data after retries`);
        continue;
      }
      words.push(w);
      saved++;
      if (saved % 50 === 0) {
        save(words);
        console.log(`progress ${saved}/${queue.length}（checkpoint 已存）`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  save(words);
  console.log(`完成：共 ${words.length} 词 → ${OUT}`);
}

function save(words: ChineseWord[]) {
  fs.writeFileSync(OUT, JSON.stringify({ ...LIST_META, words }, null, 1), 'utf-8');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
