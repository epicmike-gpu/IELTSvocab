import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 9091;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ── IELTS Word Data ──────────────────────────────────────────────

interface Word {
  id: number;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  exampleCn: string;
  difficulty: 1 | 2 | 3;
}

const WORDS: Word[] = [
  { id: 1, word: "abandon", phonetic: "/əˈbændən/", pos: "v.", meaning: "放弃；遗弃", example: "He abandoned his wife and children.", exampleCn: "他抛弃了妻子和孩子。", difficulty: 1 },
  { id: 2, word: "abstract", phonetic: "/ˈæbstrækt/", pos: "adj.", meaning: "抽象的", example: "The concept is too abstract for young children.", exampleCn: "这个概念对小孩来说太抽象了。", difficulty: 2 },
  { id: 3, word: "accommodate", phonetic: "/əˈkɒmədeɪt/", pos: "v.", meaning: "容纳；适应", example: "The hotel can accommodate 500 guests.", exampleCn: "这家酒店能容纳500位客人。", difficulty: 2 },
  { id: 4, word: "accumulate", phonetic: "/əˈkjuːmjəleɪt/", pos: "v.", meaning: "积累；积聚", example: "Dust had accumulated on the shelves.", exampleCn: "灰尘在架子上积了起来。", difficulty: 2 },
  { id: 5, word: "adequate", phonetic: "/ˈædɪkwət/", pos: "adj.", meaning: "足够的；适当的", example: "We need adequate resources to complete the project.", exampleCn: "我们需要足够的资源来完成项目。", difficulty: 1 },
  { id: 6, word: "adjacent", phonetic: "/əˈdʒeɪsənt/", pos: "adj.", meaning: "邻近的；毗连的", example: "The hotel is adjacent to the beach.", exampleCn: "酒店毗邻海滩。", difficulty: 2 },
  { id: 7, word: "advocate", phonetic: "/ˈædvəkeɪt/", pos: "v.", meaning: "提倡；主张", example: "She advocates for environmental protection.", exampleCn: "她提倡环境保护。", difficulty: 2 },
  { id: 8, word: "aesthetic", phonetic: "/iːsˈθetɪk/", pos: "adj.", meaning: "美学的；审美的", example: "The building has great aesthetic appeal.", exampleCn: "这座建筑有很强的美学吸引力。", difficulty: 3 },
  { id: 9, word: "aggregate", phonetic: "/ˈæɡrɪɡət/", pos: "n.", meaning: "总计；合计", example: "The aggregate score determines the winner.", exampleCn: "总分决定获胜者。", difficulty: 3 },
  { id: 10, word: "alleviate", phonetic: "/əˈliːvieɪt/", pos: "v.", meaning: "减轻；缓和", example: "The medicine helped alleviate the pain.", exampleCn: "药物帮助减轻了疼痛。", difficulty: 3 },
  { id: 11, word: "ambiguous", phonetic: "/æmˈbɪɡjuəs/", pos: "adj.", meaning: "模棱两可的", example: "The instructions were ambiguous and confusing.", exampleCn: "指示模棱两可，令人困惑。", difficulty: 2 },
  { id: 12, word: "anticipate", phonetic: "/ænˈtɪsɪpeɪt/", pos: "v.", meaning: "预期；期望", example: "We anticipate a rise in temperature.", exampleCn: "我们预计温度会上升。", difficulty: 1 },
  { id: 13, word: "apparent", phonetic: "/əˈpærənt/", pos: "adj.", meaning: "明显的；表面的", example: "It was apparent that she was unhappy.", exampleCn: "很明显她不开心。", difficulty: 1 },
  { id: 14, word: "arbitrary", phonetic: "/ˈɑːbɪtrəri/", pos: "adj.", meaning: "任意的；武断的", example: "The decision seemed completely arbitrary.", exampleCn: "这个决定似乎完全是武断的。", difficulty: 3 },
  { id: 15, word: "authentic", phonetic: "/ɔːˈθentɪk/", pos: "adj.", meaning: "真实的；正宗的", example: "This is an authentic Italian restaurant.", exampleCn: "这是一家正宗的意大利餐厅。", difficulty: 2 },
  { id: 16, word: "beneficial", phonetic: "/ˌbenɪˈfɪʃəl/", pos: "adj.", meaning: "有益的；有利的", example: "Exercise is beneficial to health.", exampleCn: "运动对健康有益。", difficulty: 1 },
  { id: 17, word: "bias", phonetic: "/ˈbaɪəs/", pos: "n.", meaning: "偏见；偏差", example: "The survey may contain bias.", exampleCn: "这项调查可能有偏见。", difficulty: 2 },
  { id: 18, word: "catastrophe", phonetic: "/kəˈtæstrəfi/", pos: "n.", meaning: "灾难；大祸", example: "The flood was a major catastrophe.", exampleCn: "洪水是一场重大灾难。", difficulty: 2 },
  { id: 19, word: "coherent", phonetic: "/kəʊˈhɪərənt/", pos: "adj.", meaning: "连贯的；一致的", example: "He gave a coherent explanation.", exampleCn: "他给出了连贯的解释。", difficulty: 3 },
  { id: 20, word: "coincide", phonetic: "/ˌkəʊɪnˈsaɪd/", pos: "v.", meaning: "同时发生；一致", example: "Our holidays coincide this year.", exampleCn: "我们今年的假期赶在一起了。", difficulty: 2 },
  { id: 21, word: "compatible", phonetic: "/kəmˈpætəbl/", pos: "adj.", meaning: "兼容的；相容的", example: "The software is compatible with Windows.", exampleCn: "该软件与 Windows 兼容。", difficulty: 2 },
  { id: 22, word: "compensate", phonetic: "/ˈkɒmpenseɪt/", pos: "v.", meaning: "补偿；弥补", example: "Nothing can compensate for the loss of health.", exampleCn: "没有什么能弥补健康的损失。", difficulty: 2 },
  { id: 23, word: "comprehensive", phonetic: "/ˌkɒmprɪˈhensɪv/", pos: "adj.", meaning: "全面的；综合的", example: "We need a comprehensive review of the policy.", exampleCn: "我们需要对政策进行全面审查。", difficulty: 2 },
  { id: 24, word: "compulsory", phonetic: "/kəmˈpʌlsəri/", pos: "adj.", meaning: "强制的；必修的", example: "Education is compulsory until age 16.", exampleCn: "教育在16岁之前是强制性的。", difficulty: 2 },
  { id: 25, word: "conceive", phonetic: "/kənˈsiːv/", pos: "v.", meaning: "构想；设想", example: "I can't conceive of such a thing.", exampleCn: "我无法想象这样的事情。", difficulty: 3 },
  { id: 26, word: "concurrent", phonetic: "/kənˈkʌrənt/", pos: "adj.", meaning: "同时发生的", example: "The two events were concurrent.", exampleCn: "这两个事件同时发生。", difficulty: 3 },
  { id: 27, word: "confine", phonetic: "/kənˈfaɪn/", pos: "v.", meaning: "限制；局限于", example: "Please confine your remarks to the topic.", exampleCn: "请将你的发言限定在这个话题上。", difficulty: 2 },
  { id: 28, word: "conform", phonetic: "/kənˈfɔːm/", pos: "v.", meaning: "遵守；符合", example: "All products must conform to safety standards.", exampleCn: "所有产品必须符合安全标准。", difficulty: 2 },
  { id: 29, word: "consecutive", phonetic: "/kənˈsekjətɪv/", pos: "adj.", meaning: "连续的", example: "It rained for five consecutive days.", exampleCn: "连续下了五天雨。", difficulty: 2 },
  { id: 30, word: "consolidate", phonetic: "/kənˈsɒlɪdeɪt/", pos: "v.", meaning: "巩固；合并", example: "The company consolidated its position in the market.", exampleCn: "公司巩固了其市场地位。", difficulty: 3 },
  { id: 31, word: "contemporary", phonetic: "/kənˈtemprəri/", pos: "adj.", meaning: "当代的；同时代的", example: "She is a leading contemporary artist.", exampleCn: "她是一位领先的当代艺术家。", difficulty: 1 },
  { id: 32, word: "contradict", phonetic: "/ˌkɒntrəˈdɪkt/", pos: "v.", meaning: "反驳；与…矛盾", example: "The evidence contradicts his statement.", exampleCn: "证据与他的陈述相矛盾。", difficulty: 2 },
  { id: 33, word: "controversy", phonetic: "/ˈkɒntrəvɜːsi/", pos: "n.", meaning: "争议；争论", example: "The policy caused much controversy.", exampleCn: "这项政策引起了很多争议。", difficulty: 2 },
  { id: 34, word: "conventional", phonetic: "/kənˈvenʃənəl/", pos: "adj.", meaning: "传统的；惯例的", example: "He prefers conventional teaching methods.", exampleCn: "他更喜欢传统的教学方法。", difficulty: 1 },
  { id: 35, word: "crucial", phonetic: "/ˈkruːʃəl/", pos: "adj.", meaning: "至关重要的", example: "This is a crucial decision for our future.", exampleCn: "这是对我们未来至关重要的决定。", difficulty: 1 },
  { id: 36, word: "deduce", phonetic: "/dɪˈdjuːs/", pos: "v.", meaning: "推断；推论", example: "We can deduce from the data that...", exampleCn: "我们可以从数据中推断出……", difficulty: 3 },
  { id: 37, word: "deficient", phonetic: "/dɪˈfɪʃənt/", pos: "adj.", meaning: "不足的；缺乏的", example: "The diet is deficient in essential vitamins.", exampleCn: "这种饮食缺乏必需的维生素。", difficulty: 2 },
  { id: 38, word: "demonstrate", phonetic: "/ˈdemənstreɪt/", pos: "v.", meaning: "证明；演示", example: "The experiment demonstrates the theory.", exampleCn: "实验证明了这个理论。", difficulty: 1 },
  { id: 39, word: "diminish", phonetic: "/dɪˈmɪnɪʃ/", pos: "v.", meaning: "减少；缩小", example: "The supply has diminished significantly.", exampleCn: "供应大幅减少了。", difficulty: 2 },
  { id: 40, word: "distinct", phonetic: "/dɪˈstɪŋkt/", pos: "adj.", meaning: "不同的；明显的", example: "There is a distinct difference between the two.", exampleCn: "两者之间有明显的区别。", difficulty: 1 },
  { id: 41, word: "dominant", phonetic: "/ˈdɒmɪnənt/", pos: "adj.", meaning: "占主导地位的", example: "English is the dominant language in business.", exampleCn: "英语是商业中的主导语言。", difficulty: 2 },
  { id: 42, word: "elaborate", phonetic: "/ɪˈlæbərət/", pos: "adj.", meaning: "精心制作的；详尽的", example: "She gave an elaborate explanation.", exampleCn: "她给出了详尽的解释。", difficulty: 2 },
  { id: 43, word: "eliminate", phonetic: "/ɪˈlɪmɪneɪt/", pos: "v.", meaning: "消除；排除", example: "We need to eliminate all errors.", exampleCn: "我们需要消除所有错误。", difficulty: 1 },
  { id: 44, word: "emerge", phonetic: "/ɪˈmɜːdʒ/", pos: "v.", meaning: "出现；浮现", example: "New evidence has emerged.", exampleCn: "新的证据出现了。", difficulty: 2 },
  { id: 45, word: "empirical", phonetic: "/ɪmˈpɪrɪkəl/", pos: "adj.", meaning: "经验的；实证的", example: "The theory is based on empirical evidence.", exampleCn: "该理论基于实证证据。", difficulty: 3 },
  { id: 46, word: "enhance", phonetic: "/ɪnˈhɑːns/", pos: "v.", meaning: "增强；提高", example: "Technology can enhance learning outcomes.", exampleCn: "技术可以提高学习成果。", difficulty: 1 },
  { id: 47, word: "essential", phonetic: "/ɪˈsenʃəl/", pos: "adj.", meaning: "必要的；本质的", example: "Water is essential for life.", exampleCn: "水是生命所必需的。", difficulty: 1 },
  { id: 48, word: "exceed", phonetic: "/ɪkˈsiːd/", pos: "v.", meaning: "超过；超越", example: "Demand has exceeded supply.", exampleCn: "需求超过了供应。", difficulty: 1 },
  { id: 49, word: "explicit", phonetic: "/ɪkˈsplɪsɪt/", pos: "adj.", meaning: "明确的；清楚的", example: "He gave explicit instructions.", exampleCn: "他给出了明确的指示。", difficulty: 2 },
  { id: 50, word: "fluctuate", phonetic: "/ˈflʌktʃueɪt/", pos: "v.", meaning: "波动；起伏", example: "Prices fluctuate with demand.", exampleCn: "价格随需求波动。", difficulty: 2 },
  { id: 51, word: "fundamental", phonetic: "/ˌfʌndəˈmentəl/", pos: "adj.", meaning: "基本的；根本的", example: "This is a fundamental principle of science.", exampleCn: "这是科学的基本原理。", difficulty: 1 },
  { id: 52, word: "generate", phonetic: "/ˈdʒenəreɪt/", pos: "v.", meaning: "产生；生成", example: "The project will generate new jobs.", exampleCn: "这个项目将创造新的就业机会。", difficulty: 1 },
  { id: 53, word: "hypothesis", phonetic: "/haɪˈpɒθəsɪs/", pos: "n.", meaning: "假设；假说", example: "The hypothesis needs to be tested.", exampleCn: "这个假设需要验证。", difficulty: 2 },
  { id: 54, word: "implement", phonetic: "/ˈɪmplɪment/", pos: "v.", meaning: "实施；执行", example: "We need to implement the new policy.", exampleCn: "我们需要实施新政策。", difficulty: 1 },
  { id: 55, word: "imply", phonetic: "/ɪmˈplaɪ/", pos: "v.", meaning: "暗示；意味着", example: "Are you implying that I lied?", exampleCn: "你在暗示我说谎了吗？", difficulty: 2 },
  { id: 56, word: "inherent", phonetic: "/ɪnˈhɪərənt/", pos: "adj.", meaning: "固有的；内在的", example: "There are inherent risks in any investment.", exampleCn: "任何投资都有固有风险。", difficulty: 3 },
  { id: 57, word: "integrate", phonetic: "/ˈɪntɪɡreɪt/", pos: "v.", meaning: "整合；融合", example: "We need to integrate technology into teaching.", exampleCn: "我们需要将技术融入教学。", difficulty: 2 },
  { id: 58, word: "manipulate", phonetic: "/məˈnɪpjuleɪt/", pos: "v.", meaning: "操纵；操控", example: "He tried to manipulate the data.", exampleCn: "他试图操纵数据。", difficulty: 3 },
  { id: 59, word: "minimize", phonetic: "/ˈmɪnɪmaɪz/", pos: "v.", meaning: "最小化；减少", example: "We should minimize waste.", exampleCn: "我们应该减少浪费。", difficulty: 1 },
  { id: 60, word: "notion", phonetic: "/ˈnəʊʃən/", pos: "n.", meaning: "概念；观念", example: "She has a clear notion of what she wants.", exampleCn: "她对自己想要的有清晰的概念。", difficulty: 2 },
  { id: 61, word: "obstacle", phonetic: "/ˈɒbstəkl/", pos: "n.", meaning: "障碍；阻碍", example: "Lack of funding is a major obstacle.", exampleCn: "资金不足是一个主要障碍。", difficulty: 1 },
  { id: 62, word: "phenomenon", phonetic: "/fəˈnɒmɪnən/", pos: "n.", meaning: "现象", example: "Climate change is a global phenomenon.", exampleCn: "气候变化是一个全球性现象。", difficulty: 2 },
  { id: 63, word: "plausible", phonetic: "/ˈplɔːzəbl/", pos: "adj.", meaning: "似乎合理的", example: "That's a plausible explanation.", exampleCn: "那是一个似乎合理的解释。", difficulty: 3 },
  { id: 64, word: "predominant", phonetic: "/prɪˈdɒmɪnənt/", pos: "adj.", meaning: "主要的；占优势的", example: "Yellow is the predominant color.", exampleCn: "黄色是主要颜色。", difficulty: 2 },
  { id: 65, word: "profound", phonetic: "/prəˈfaʊnd/", pos: "adj.", meaning: "深刻的；深远的", example: "The book had a profound effect on me.", exampleCn: "这本书对我产生了深远的影响。", difficulty: 2 },
  { id: 66, word: "prohibit", phonetic: "/prəˈhɪbɪt/", pos: "v.", meaning: "禁止；阻止", example: "The law prohibits smoking in public places.", exampleCn: "法律禁止在公共场所吸烟。", difficulty: 1 },
  { id: 67, word: "prosperity", phonetic: "/prɒˈsperəti/", pos: "n.", meaning: "繁荣；兴旺", example: "The country enjoyed a period of prosperity.", exampleCn: "这个国家经历了一段繁荣时期。", difficulty: 2 },
  { id: 68, word: "reluctant", phonetic: "/rɪˈlʌktənt/", pos: "adj.", meaning: "不情愿的；勉强的", example: "She was reluctant to accept the offer.", exampleCn: "她不愿接受这个提议。", difficulty: 2 },
  { id: 69, word: "significant", phonetic: "/sɪɡˈnɪfɪkənt/", pos: "adj.", meaning: "重要的；显著的", example: "There has been a significant improvement.", exampleCn: "有了显著的改善。", difficulty: 1 },
  { id: 70, word: "sophisticated", phonetic: "/səˈfɪstɪkeɪtɪd/", pos: "adj.", meaning: "复杂的；精密的", example: "This is a sophisticated piece of equipment.", exampleCn: "这是一件精密的设备。", difficulty: 2 },
  { id: 71, word: "subsequent", phonetic: "/ˈsʌbsɪkwənt/", pos: "adj.", meaning: "随后的；后来的", example: "Subsequent events proved him right.", exampleCn: "后来的事件证明他是对的。", difficulty: 2 },
  { id: 72, word: "substantial", phonetic: "/səbˈstænʃəl/", pos: "adj.", meaning: "大量的；实质的", example: "We made substantial progress.", exampleCn: "我们取得了实质性进展。", difficulty: 2 },
  { id: 73, word: "sufficient", phonetic: "/səˈfɪʃənt/", pos: "adj.", meaning: "足够的；充分的", example: "We have sufficient evidence.", exampleCn: "我们有充分的证据。", difficulty: 1 },
  { id: 74, word: "supplement", phonetic: "/ˈsʌplɪment/", pos: "n.", meaning: "补充；增补", example: "He takes vitamin supplements daily.", exampleCn: "他每天服用维生素补充剂。", difficulty: 2 },
  { id: 75, word: "sustain", phonetic: "/səˈsteɪn/", pos: "v.", meaning: "维持；支撑", example: "We need to sustain economic growth.", exampleCn: "我们需要维持经济增长。", difficulty: 2 },
  { id: 76, word: "tentative", phonetic: "/ˈtentətɪv/", pos: "adj.", meaning: "暂定的；试探性的", example: "We've made a tentative plan.", exampleCn: "我们制定了一个暂定的计划。", difficulty: 3 },
  { id: 77, word: "thorough", phonetic: "/ˈθʌrə/", pos: "adj.", meaning: "彻底的；全面的", example: "The police conducted a thorough investigation.", exampleCn: "警方进行了彻底的调查。", difficulty: 2 },
  { id: 78, word: "trigger", phonetic: "/ˈtrɪɡə/", pos: "v.", meaning: "触发；引起", example: "The incident triggered a public debate.", exampleCn: "该事件引发了公众辩论。", difficulty: 1 },
  { id: 79, word: "undergo", phonetic: "/ˌʌndəˈɡəʊ/", pos: "v.", meaning: "经历；经受", example: "The building will undergo renovation.", exampleCn: "这座建筑将进行翻新。", difficulty: 2 },
  { id: 80, word: "utilize", phonetic: "/ˈjuːtəlaɪz/", pos: "v.", meaning: "利用；使用", example: "We should utilize all available resources.", exampleCn: "我们应该利用所有可用资源。", difficulty: 1 },
];

// ── In-memory state ──────────────────────────────────────────────

const knownWordIds = new Set<number>();
const reviewWords = new Map<number, { word: Word; reviewCount: number; lastReviewed: number }>();
const dailyStats = new Map<string, { learned: number; known: number; unknown: number }>();

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const getTodayStats = () => {
  const key = getTodayKey();
  if (!dailyStats.has(key)) {
    dailyStats.set(key, { learned: 0, known: 0, unknown: 0 });
  }
  return dailyStats.get(key)!;
};

// ── API: Get batch of words to learn ─────────────────────────────

app.get('/api/v1/words/batch', (req, res) => {
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 10;

  const available = WORDS.filter(w => !knownWordIds.has(w.id) && !reviewWords.has(w.id));
  const batch = available.slice(offset, offset + limit);

  res.json({
    words: batch,
    total: available.length,
    offset,
    limit,
  });
});

// ── API: Get all words ───────────────────────────────────────────

app.get('/api/v1/words', (req, res) => {
  res.json({
    words: WORDS,
    total: WORDS.length,
  });
});

// ── API: Mark word as known ──────────────────────────────────────

app.post('/api/v1/words/:id/known', (req, res) => {
  const id = parseInt(req.params.id);
  const word = WORDS.find(w => w.id === id);
  if (!word) {
    return res.status(404).json({ error: 'Word not found' });
  }

  knownWordIds.add(id);
  reviewWords.delete(id);

  const stats = getTodayStats();
  stats.learned++;
  stats.known++;

  res.json({ success: true, word });
});

// ── API: Mark word as unknown (add to review) ────────────────────

app.post('/api/v1/words/:id/unknown', (req, res) => {
  const id = parseInt(req.params.id);
  const word = WORDS.find(w => w.id === id);
  if (!word) {
    return res.status(404).json({ error: 'Word not found' });
  }

  const existing = reviewWords.get(id);
  reviewWords.set(id, {
    word,
    reviewCount: existing ? existing.reviewCount + 1 : 1,
    lastReviewed: Date.now(),
  });

  const stats = getTodayStats();
  stats.learned++;
  stats.unknown++;

  res.json({ success: true, word });
});

// ── API: Get review words ────────────────────────────────────────

app.get('/api/v1/review', (req, res) => {
  const list = Array.from(reviewWords.values()).sort((a, b) => b.lastReviewed - a.lastReviewed);
  res.json({
    words: list.map(item => ({
      ...item.word,
      reviewCount: item.reviewCount,
      lastReviewed: item.lastReviewed,
    })),
    total: list.length,
  });
});

// ── API: Mark review word as known (remove from review) ──────────

app.post('/api/v1/review/:id/known', (req, res) => {
  const id = parseInt(req.params.id);
  if (!reviewWords.has(id)) {
    return res.status(404).json({ error: 'Word not in review list' });
  }

  knownWordIds.add(id);
  reviewWords.delete(id);

  res.json({ success: true });
});

// ── API: Remove word from review ─────────────────────────────────

app.delete('/api/v1/review/:id', (req, res) => {
  const id = parseInt(req.params.id);
  reviewWords.delete(id);
  res.json({ success: true });
});

// ── API: Get learning stats ──────────────────────────────────────

app.get('/api/v1/stats', (req, res) => {
  const today = getTodayStats();
  const totalKnown = knownWordIds.size;
  const totalReview = reviewWords.size;

  const last7Days: { date: string; learned: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const s = dailyStats.get(key);
    last7Days.push({ date: key.slice(5), learned: s ? s.learned : 0 });
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const s = dailyStats.get(key);
    if (s && s.learned > 0) streak++;
    else if (i > 0) break;
  }

  res.json({
    todayLearned: today.learned,
    todayKnown: today.known,
    todayUnknown: today.unknown,
    totalKnown,
    totalReview,
    totalWords: WORDS.length,
    streak,
    last7Days,
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
