import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 9091;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ── Types ────────────────────────────────────────────────────────

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

interface WordList {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  words: Word[];
}

// ── Load Word Lists from Files ───────────────────────────────────

function loadWordListFromFile(filePath: string): WordList | null {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error(`Failed to load word list from ${filePath}:`, e);
    return null;
  }
}

// Load IELTS 8000 word lists
const ieltsSequential = loadWordListFromFile(path.join(__dirname, '../data/ielts_sequential.json'));
const ieltsRandom = loadWordListFromFile(path.join(__dirname, '../data/ielts_random.json'));

// ── Word Lists Data ──────────────────────────────────────────────

const WORD_LISTS: WordList[] = [
  {
    id: "core",
    name: "核心词汇",
    description: "雅思高频核心 50 词，考试必背",
    icon: "star",
    color: "#6C63FF",
    words: [
      { id: 1001, word: "abandon", phonetic: "/əˈbændən/", pos: "v.", meaning: "放弃；遗弃", example: "He abandoned his wife and children.", exampleCn: "他抛弃了妻子和孩子。", difficulty: 1 },
      { id: 1002, word: "abstract", phonetic: "/ˈæbstrækt/", pos: "adj.", meaning: "抽象的", example: "The concept is too abstract for young children.", exampleCn: "这个概念对小孩来说太抽象了。", difficulty: 2 },
      { id: 1003, word: "accommodate", phonetic: "/əˈkɒmədeɪt/", pos: "v.", meaning: "容纳；适应", example: "The hotel can accommodate 500 guests.", exampleCn: "这家酒店能容纳500位客人。", difficulty: 2 },
      { id: 1004, word: "accumulate", phonetic: "/əˈkjuːmjəleɪt/", pos: "v.", meaning: "积累；积聚", example: "Dust had accumulated on the shelves.", exampleCn: "灰尘在架子上积了起来。", difficulty: 2 },
      { id: 1005, word: "adequate", phonetic: "/ˈædɪkwət/", pos: "adj.", meaning: "足够的；适当的", example: "We need adequate resources to complete the project.", exampleCn: "我们需要足够的资源来完成项目。", difficulty: 1 },
      { id: 1006, word: "adjacent", phonetic: "/əˈdʒeɪsənt/", pos: "adj.", meaning: "邻近的；毗连的", example: "The hotel is adjacent to the beach.", exampleCn: "酒店毗邻海滩。", difficulty: 2 },
      { id: 1007, word: "advocate", phonetic: "/ˈædvəkeɪt/", pos: "v.", meaning: "提倡；主张", example: "She advocates for environmental protection.", exampleCn: "她提倡环境保护。", difficulty: 2 },
      { id: 1008, word: "aesthetic", phonetic: "/iːsˈθetɪk/", pos: "adj.", meaning: "美学的；审美的", example: "The building has great aesthetic appeal.", exampleCn: "这座建筑有很强的美学吸引力。", difficulty: 3 },
      { id: 1009, word: "aggregate", phonetic: "/ˈæɡrɪɡət/", pos: "n.", meaning: "总计；合计", example: "The aggregate score determines the winner.", exampleCn: "总分决定获胜者。", difficulty: 3 },
      { id: 1010, word: "alleviate", phonetic: "/əˈliːvieɪt/", pos: "v.", meaning: "减轻；缓和", example: "The medicine helped alleviate the pain.", exampleCn: "药物帮助减轻了疼痛。", difficulty: 3 },
      { id: 1011, word: "ambiguous", phonetic: "/æmˈbɪɡjuəs/", pos: "adj.", meaning: "模棱两可的", example: "The instructions were ambiguous and confusing.", exampleCn: "指示模棱两可，令人困惑。", difficulty: 2 },
      { id: 1012, word: "anticipate", phonetic: "/ænˈtɪsɪpeɪt/", pos: "v.", meaning: "预期；期望", example: "We anticipate a rise in temperature.", exampleCn: "我们预计温度会上升。", difficulty: 1 },
      { id: 1013, word: "apparent", phonetic: "/əˈpærənt/", pos: "adj.", meaning: "明显的；表面的", example: "It was apparent that she was unhappy.", exampleCn: "很明显她不开心。", difficulty: 1 },
      { id: 1014, word: "arbitrary", phonetic: "/ˈɑːbɪtrəri/", pos: "adj.", meaning: "任意的；武断的", example: "The decision seemed completely arbitrary.", exampleCn: "这个决定似乎完全是武断的。", difficulty: 3 },
      { id: 1015, word: "authentic", phonetic: "/ɔːˈθentɪk/", pos: "adj.", meaning: "真实的；正宗的", example: "This is an authentic Italian restaurant.", exampleCn: "这是一家正宗的意大利餐厅。", difficulty: 2 },
      { id: 1016, word: "beneficial", phonetic: "/ˌbenɪˈfɪʃəl/", pos: "adj.", meaning: "有益的；有利的", example: "Exercise is beneficial to health.", exampleCn: "运动对健康有益。", difficulty: 1 },
      { id: 1017, word: "bias", phonetic: "/ˈbaɪəs/", pos: "n.", meaning: "偏见；偏差", example: "The survey may contain bias.", exampleCn: "这项调查可能有偏见。", difficulty: 2 },
      { id: 1018, word: "catastrophe", phonetic: "/kəˈtæstrəfi/", pos: "n.", meaning: "灾难；大祸", example: "The flood was a major catastrophe.", exampleCn: "洪水是一场重大灾难。", difficulty: 2 },
      { id: 1019, word: "coherent", phonetic: "/kəʊˈhɪərənt/", pos: "adj.", meaning: "连贯的；一致的", example: "He gave a coherent explanation.", exampleCn: "他给出了连贯的解释。", difficulty: 3 },
      { id: 1020, word: "coincide", phonetic: "/ˌkəʊɪnˈsaɪd/", pos: "v.", meaning: "同时发生；一致", example: "Our holidays coincide this year.", exampleCn: "我们今年的假期赶在一起了。", difficulty: 2 },
      { id: 1021, word: "compatible", phonetic: "/kəmˈpætəbl/", pos: "adj.", meaning: "兼容的；相容的", example: "The software is compatible with Windows.", exampleCn: "该软件与 Windows 兼容。", difficulty: 2 },
      { id: 1022, word: "compensate", phonetic: "/ˈkɒmpenseɪt/", pos: "v.", meaning: "补偿；弥补", example: "Nothing can compensate for the loss of health.", exampleCn: "没有什么能弥补健康的损失。", difficulty: 2 },
      { id: 1023, word: "comprehensive", phonetic: "/ˌkɒmprɪˈhensɪv/", pos: "adj.", meaning: "全面的；综合的", example: "We need a comprehensive review of the policy.", exampleCn: "我们需要对政策进行全面审查。", difficulty: 2 },
      { id: 1024, word: "compulsory", phonetic: "/kəmˈpʌlsəri/", pos: "adj.", meaning: "强制的；必修的", example: "Education is compulsory until age 16.", exampleCn: "教育在16岁之前是强制性的。", difficulty: 2 },
      { id: 1025, word: "conceive", phonetic: "/kənˈsiːv/", pos: "v.", meaning: "构想；设想", example: "I can't conceive of such a thing.", exampleCn: "我无法想象这样的事情。", difficulty: 3 },
      { id: 1026, word: "concurrent", phonetic: "/kənˈkʌrənt/", pos: "adj.", meaning: "同时发生的", example: "The two events were concurrent.", exampleCn: "这两个事件同时发生。", difficulty: 3 },
      { id: 1027, word: "confine", phonetic: "/kənˈfaɪn/", pos: "v.", meaning: "限制；局限于", example: "Please confine your remarks to the topic.", exampleCn: "请将你的发言限定在这个话题上。", difficulty: 2 },
      { id: 1028, word: "conform", phonetic: "/kənˈfɔːm/", pos: "v.", meaning: "遵守；符合", example: "All products must conform to safety standards.", exampleCn: "所有产品必须符合安全标准。", difficulty: 2 },
      { id: 1029, word: "consecutive", phonetic: "/kənˈsekjətɪv/", pos: "adj.", meaning: "连续的", example: "It rained for five consecutive days.", exampleCn: "连续下了五天雨。", difficulty: 2 },
      { id: 1030, word: "consolidate", phonetic: "/kənˈsɒlɪdeɪt/", pos: "v.", meaning: "巩固；合并", example: "The company consolidated its position in the market.", exampleCn: "公司巩固了其市场地位。", difficulty: 3 },
      { id: 1031, word: "contemporary", phonetic: "/kənˈtemprəri/", pos: "adj.", meaning: "当代的；同时代的", example: "She is a leading contemporary artist.", exampleCn: "她是一位领先的当代艺术家。", difficulty: 1 },
      { id: 1032, word: "contradict", phonetic: "/ˌkɒntrəˈdɪkt/", pos: "v.", meaning: "反驳；与…矛盾", example: "The evidence contradicts his statement.", exampleCn: "证据与他的陈述相矛盾。", difficulty: 2 },
      { id: 1033, word: "controversy", phonetic: "/ˈkɒntrəvɜːsi/", pos: "n.", meaning: "争议；争论", example: "The policy caused much controversy.", exampleCn: "这项政策引起了很多争议。", difficulty: 2 },
      { id: 1034, word: "conventional", phonetic: "/kənˈvenʃənəl/", pos: "adj.", meaning: "传统的；惯例的", example: "He prefers conventional teaching methods.", exampleCn: "他更喜欢传统的教学方法。", difficulty: 1 },
      { id: 1035, word: "crucial", phonetic: "/ˈkruːʃəl/", pos: "adj.", meaning: "至关重要的", example: "This is a crucial decision for our future.", exampleCn: "这是对我们未来至关重要的决定。", difficulty: 1 },
      { id: 1036, word: "deduce", phonetic: "/dɪˈdjuːs/", pos: "v.", meaning: "推断；推论", example: "We can deduce from the data that...", exampleCn: "我们可以从数据中推断出……", difficulty: 3 },
      { id: 1037, word: "deficient", phonetic: "/dɪˈfɪʃənt/", pos: "adj.", meaning: "不足的；缺乏的", example: "The diet is deficient in essential vitamins.", exampleCn: "这种饮食缺乏必需的维生素。", difficulty: 2 },
      { id: 1038, word: "demonstrate", phonetic: "/ˈdemənstreɪt/", pos: "v.", meaning: "证明；演示", example: "The experiment demonstrates the theory.", exampleCn: "实验证明了这个理论。", difficulty: 1 },
      { id: 1039, word: "diminish", phonetic: "/dɪˈmɪnɪʃ/", pos: "v.", meaning: "减少；缩小", example: "The supply has diminished significantly.", exampleCn: "供应大幅减少了。", difficulty: 2 },
      { id: 1040, word: "distinct", phonetic: "/dɪˈstɪŋkt/", pos: "adj.", meaning: "不同的；明显的", example: "There is a distinct difference between the two.", exampleCn: "两者之间有明显的区别。", difficulty: 1 },
      { id: 1041, word: "dominant", phonetic: "/ˈdɒmɪnənt/", pos: "adj.", meaning: "占主导地位的", example: "English is the dominant language in business.", exampleCn: "英语是商业中的主导语言。", difficulty: 2 },
      { id: 1042, word: "elaborate", phonetic: "/ɪˈlæbərət/", pos: "adj.", meaning: "精心制作的；详尽的", example: "She gave an elaborate explanation.", exampleCn: "她给出了详尽的解释。", difficulty: 2 },
      { id: 1043, word: "eliminate", phonetic: "/ɪˈlɪmɪneɪt/", pos: "v.", meaning: "消除；排除", example: "We need to eliminate all errors.", exampleCn: "我们需要消除所有错误。", difficulty: 1 },
      { id: 1044, word: "emerge", phonetic: "/ɪˈmɜːdʒ/", pos: "v.", meaning: "出现；浮现", example: "New evidence has emerged.", exampleCn: "新的证据出现了。", difficulty: 2 },
      { id: 1045, word: "empirical", phonetic: "/ɪmˈpɪrɪkəl/", pos: "adj.", meaning: "经验的；实证的", example: "The theory is based on empirical evidence.", exampleCn: "该理论基于实证证据。", difficulty: 3 },
      { id: 1046, word: "enhance", phonetic: "/ɪnˈhɑːns/", pos: "v.", meaning: "增强；提高", example: "Technology can enhance learning outcomes.", exampleCn: "技术可以提高学习成果。", difficulty: 1 },
      { id: 1047, word: "essential", phonetic: "/ɪˈsenʃəl/", pos: "adj.", meaning: "必要的；本质的", example: "Water is essential for life.", exampleCn: "水是生命所必需的。", difficulty: 1 },
      { id: 1048, word: "exceed", phonetic: "/ɪkˈsiːd/", pos: "v.", meaning: "超过；超越", example: "Demand has exceeded supply.", exampleCn: "需求超过了供应。", difficulty: 1 },
      { id: 1049, word: "explicit", phonetic: "/ɪkˈsplɪsɪt/", pos: "adj.", meaning: "明确的；清楚的", example: "He gave explicit instructions.", exampleCn: "他给出了明确的指示。", difficulty: 2 },
      { id: 1050, word: "fluctuate", phonetic: "/ˈflʌktʃueɪt/", pos: "v.", meaning: "波动；起伏", example: "Prices fluctuate with demand.", exampleCn: "价格随需求波动。", difficulty: 2 },
    ],
  },
  {
    id: "academic",
    name: "学术词汇",
    description: "雅思学术类 A 类高频词",
    icon: "graduation-cap",
    color: "#4ECDC4",
    words: [
      { id: 2001, word: "hypothesis", phonetic: "/haɪˈpɒθəsɪs/", pos: "n.", meaning: "假设；假说", example: "The hypothesis needs to be tested.", exampleCn: "这个假设需要验证。", difficulty: 2 },
      { id: 2002, word: "methodology", phonetic: "/ˌmeθəˈdɒlədʒi/", pos: "n.", meaning: "方法论", example: "The methodology used in this study is sound.", exampleCn: "本研究使用的方法是可靠的。", difficulty: 3 },
      { id: 2003, word: "paradigm", phonetic: "/ˈpærədaɪm/", pos: "n.", meaning: "范式；典范", example: "This represents a new paradigm in education.", exampleCn: "这代表了教育的新范式。", difficulty: 3 },
      { id: 2004, word: "empirical", phonetic: "/ɪmˈpɪrɪkəl/", pos: "adj.", meaning: "经验的；实证的", example: "The theory is based on empirical evidence.", exampleCn: "该理论基于实证证据。", difficulty: 3 },
      { id: 2005, word: "phenomenon", phonetic: "/fəˈnɒmɪnən/", pos: "n.", meaning: "现象", example: "Climate change is a global phenomenon.", exampleCn: "气候变化是一个全球性现象。", difficulty: 2 },
      { id: 2006, word: "correlation", phonetic: "/ˌkɒrəˈleɪʃən/", pos: "n.", meaning: "相关性", example: "There is a strong correlation between the two variables.", exampleCn: "两个变量之间有很强的相关性。", difficulty: 2 },
      { id: 2007, word: "variable", phonetic: "/ˈveəriəbl/", pos: "n.", meaning: "变量", example: "We need to control all variables.", exampleCn: "我们需要控制所有变量。", difficulty: 1 },
      { id: 2008, word: "criterion", phonetic: "/kraɪˈtɪəriən/", pos: "n.", meaning: "标准；准则", example: "What criteria are used for selection?", exampleCn: "选择使用什么标准？", difficulty: 2 },
      { id: 2009, word: "theory", phonetic: "/ˈθɪəri/", pos: "n.", meaning: "理论", example: "The theory has been widely accepted.", exampleCn: "这个理论已被广泛接受。", difficulty: 1 },
      { id: 2010, word: "concept", phonetic: "/ˈkɒnsept/", pos: "n.", meaning: "概念", example: "It's a difficult concept to understand.", exampleCn: "这是一个难以理解的概念。", difficulty: 1 },
      { id: 2011, word: "principle", phonetic: "/ˈprɪnsəpl/", pos: "n.", meaning: "原则；原理", example: "This is a fundamental principle of physics.", exampleCn: "这是物理学的基本原理。", difficulty: 1 },
      { id: 2012, word: "analysis", phonetic: "/əˈnæləsɪs/", pos: "n.", meaning: "分析", example: "The analysis reveals important patterns.", exampleCn: "分析揭示了重要的模式。", difficulty: 1 },
      { id: 2013, word: "research", phonetic: "/rɪˈsɜːtʃ/", pos: "n.", meaning: "研究", example: "More research is needed in this area.", exampleCn: "这个领域需要更多研究。", difficulty: 1 },
      { id: 2014, word: "evidence", phonetic: "/ˈevɪdəns/", pos: "n.", meaning: "证据", example: "The evidence supports this conclusion.", exampleCn: "证据支持这个结论。", difficulty: 1 },
      { id: 2015, word: "conclusion", phonetic: "/kənˈkluːʒən/", pos: "n.", meaning: "结论", example: "We reached the same conclusion.", exampleCn: "我们得出了相同的结论。", difficulty: 1 },
      { id: 2016, word: "significant", phonetic: "/sɪɡˈnɪfɪkənt/", pos: "adj.", meaning: "重要的；显著的", example: "There has been a significant improvement.", exampleCn: "有了显著的改善。", difficulty: 1 },
      { id: 2017, word: "relevant", phonetic: "/ˈreləvənt/", pos: "adj.", meaning: "相关的", example: "Please provide relevant information.", exampleCn: "请提供相关信息。", difficulty: 1 },
      { id: 2018, word: "specific", phonetic: "/spəˈsɪfɪk/", pos: "adj.", meaning: "具体的；特定的", example: "We need specific examples.", exampleCn: "我们需要具体的例子。", difficulty: 1 },
      { id: 2019, word: "sufficient", phonetic: "/səˈfɪʃənt/", pos: "adj.", meaning: "足够的；充分的", example: "We have sufficient evidence.", exampleCn: "我们有充分的证据。", difficulty: 1 },
      { id: 2020, word: "valid", phonetic: "/ˈvælɪd/", pos: "adj.", meaning: "有效的；合理的", example: "This is a valid argument.", exampleCn: "这是一个合理的论点。", difficulty: 2 },
      { id: 2021, word: "assumption", phonetic: "/əˈsʌmpʃən/", pos: "n.", meaning: "假设", example: "Your assumption is incorrect.", exampleCn: "你的假设是不正确的。", difficulty: 2 },
      { id: 2022, word: "implication", phonetic: "/ˌɪmplɪˈkeɪʃən/", pos: "n.", meaning: "含义；影响", example: "What are the implications of this policy?", exampleCn: "这项政策有什么影响？", difficulty: 2 },
      { id: 2023, word: "perspective", phonetic: "/pəˈspektɪv/", pos: "n.", meaning: "视角；观点", example: "Let's look at it from a different perspective.", exampleCn: "让我们从不同的角度来看。", difficulty: 2 },
      { id: 2024, word: "framework", phonetic: "/ˈfreɪmwɜːk/", pos: "n.", meaning: "框架", example: "We need a new framework for analysis.", exampleCn: "我们需要一个新的分析框架。", difficulty: 2 },
      { id: 2025, word: "factor", phonetic: "/ˈfæktə/", pos: "n.", meaning: "因素", example: "Many factors affect the outcome.", exampleCn: "很多因素影响结果。", difficulty: 1 },
      { id: 2026, word: "process", phonetic: "/ˈprəʊses/", pos: "n.", meaning: "过程", example: "Learning is a gradual process.", exampleCn: "学习是一个渐进的过程。", difficulty: 1 },
      { id: 2027, word: "structure", phonetic: "/ˈstrʌktʃə/", pos: "n.", meaning: "结构", example: "The structure of the essay is clear.", exampleCn: "文章的结构很清晰。", difficulty: 1 },
      { id: 2028, word: "source", phonetic: "/sɔːs/", pos: "n.", meaning: "来源", example: "What is the source of this data?", exampleCn: "这些数据的来源是什么？", difficulty: 1 },
      { id: 2029, word: "context", phonetic: "/ˈkɒntekst/", pos: "n.", meaning: "语境；背景", example: "You need to understand the context.", exampleCn: "你需要理解语境。", difficulty: 1 },
      { id: 2030, word: "approach", phonetic: "/əˈprəʊtʃ/", pos: "n.", meaning: "方法；途径", example: "We need a new approach to this problem.", exampleCn: "我们需要一种解决这个问题的新方法。", difficulty: 1 },
      { id: 2031, word: "establish", phonetic: "/ɪˈstæblɪʃ/", pos: "v.", meaning: "建立；确立", example: "The theory was established decades ago.", exampleCn: "这个理论几十年前就确立了。", difficulty: 1 },
      { id: 2032, word: "occur", phonetic: "/əˈkɜː/", pos: "v.", meaning: "发生", example: "When did the incident occur?", exampleCn: "事件是什么时候发生的？", difficulty: 1 },
      { id: 2033, word: "indicate", phonetic: "/ˈɪndɪkeɪt/", pos: "v.", meaning: "表明；指出", example: "The data indicates a clear trend.", exampleCn: "数据表明了一个明显的趋势。", difficulty: 1 },
      { id: 2034, word: "involve", phonetic: "/ɪnˈvɒlv/", pos: "v.", meaning: "涉及；包含", example: "The project involves many people.", exampleCn: "这个项目涉及很多人。", difficulty: 1 },
      { id: 2035, word: "require", phonetic: "/rɪˈkwaɪə/", pos: "v.", meaning: "需要；要求", example: "This task requires careful planning.", exampleCn: "这项任务需要仔细规划。", difficulty: 1 },
      { id: 2036, word: "achieve", phonetic: "/əˈtʃiːv/", pos: "v.", meaning: "实现；达到", example: "She achieved her goal.", exampleCn: "她实现了目标。", difficulty: 1 },
      { id: 2037, word: "maintain", phonetic: "/meɪnˈteɪn/", pos: "v.", meaning: "维持；保持", example: "We need to maintain high standards.", exampleCn: "我们需要保持高标准。", difficulty: 1 },
      { id: 2038, word: "assess", phonetic: "/əˈses/", pos: "v.", meaning: "评估", example: "We need to assess the risks.", exampleCn: "我们需要评估风险。", difficulty: 2 },
      { id: 2039, word: "derive", phonetic: "/dɪˈraɪv/", pos: "v.", meaning: "源自；获得", example: "The word derives from Latin.", exampleCn: "这个词源自拉丁语。", difficulty: 2 },
      { id: 2040, word: "contribute", phonetic: "/kənˈtrɪbjuːt/", pos: "v.", meaning: "贡献；促成", example: "Many factors contribute to this problem.", exampleCn: "很多因素促成了这个问题。", difficulty: 1 },
      { id: 2041, word: "distribute", phonetic: "/dɪˈstrɪbjuːt/", pos: "v.", meaning: "分配；分布", example: "The resources are distributed evenly.", exampleCn: "资源分配均匀。", difficulty: 2 },
      { id: 2042, word: "estimate", phonetic: "/ˈestɪmeɪt/", pos: "v.", meaning: "估计", example: "We estimate the cost at $1000.", exampleCn: "我们估计费用为1000美元。", difficulty: 1 },
      { id: 2043, word: "evaluate", phonetic: "/ɪˈvæljueɪt/", pos: "v.", meaning: "评估；评价", example: "We need to evaluate the results.", exampleCn: "我们需要评估结果。", difficulty: 2 },
      { id: 2044, word: "illustrate", phonetic: "/ˈɪləstreɪt/", pos: "v.", meaning: "说明；阐明", example: "This example illustrates the point.", exampleCn: "这个例子说明了这一点。", difficulty: 2 },
      { id: 2045, word: "interpret", phonetic: "/ɪnˈtɜːprɪt/", pos: "v.", meaning: "解释；理解", example: "How do you interpret this data?", exampleCn: "你如何理解这些数据？", difficulty: 2 },
      { id: 2046, word: "manipulate", phonetic: "/məˈnɪpjuleɪt/", pos: "v.", meaning: "操纵；操控", example: "He tried to manipulate the data.", exampleCn: "他试图操纵数据。", difficulty: 3 },
      { id: 2047, word: "perceive", phonetic: "/pəˈsiːv/", pos: "v.", meaning: "感知；察觉", example: "She perceived a change in his attitude.", exampleCn: "她察觉到他态度的变化。", difficulty: 2 },
      { id: 2048, word: "manipulate", phonetic: "/məˈnɪpjuleɪt/", pos: "v.", meaning: "操纵；操控", example: "He tried to manipulate the results.", exampleCn: "他试图操纵结果。", difficulty: 3 },
      { id: 2049, word: "inherent", phonetic: "/ɪnˈhɪərənt/", pos: "adj.", meaning: "固有的；内在的", example: "There are inherent risks in any investment.", exampleCn: "任何投资都有固有风险。", difficulty: 3 },
      { id: 2050, word: "subsequent", phonetic: "/ˈsʌbsɪkwənt/", pos: "adj.", meaning: "随后的；后来的", example: "Subsequent events proved him right.", exampleCn: "后来的事件证明他是对的。", difficulty: 2 },
    ],
  },
  {
    id: "advanced",
    name: "进阶词汇",
    description: "雅思 7+ 高分进阶词汇",
    icon: "rocket",
    color: "#FF6584",
    words: [
      { id: 3001, word: "ubiquitous", phonetic: "/juːˈbɪkwɪtəs/", pos: "adj.", meaning: "无处不在的", example: "Smartphones have become ubiquitous.", exampleCn: "智能手机已经无处不在。", difficulty: 3 },
      { id: 3002, word: "paradigm", phonetic: "/ˈpærədaɪm/", pos: "n.", meaning: "范式；典范", example: "This represents a paradigm shift.", exampleCn: "这代表了一种范式转变。", difficulty: 3 },
      { id: 3003, word: "pragmatic", phonetic: "/præɡˈmætɪk/", pos: "adj.", meaning: "务实的；实用的", example: "We need a pragmatic approach.", exampleCn: "我们需要一种务实的方法。", difficulty: 3 },
      { id: 3004, word: "unprecedented", phonetic: "/ʌnˈpresɪdentɪd/", pos: "adj.", meaning: "前所未有的", example: "This is an unprecedented situation.", exampleCn: "这是前所未有的情况。", difficulty: 3 },
      { id: 3005, word: "detrimental", phonetic: "/ˌdetrɪˈmentəl/", pos: "adj.", meaning: "有害的；不利的", example: "Smoking has a detrimental effect on health.", exampleCn: "吸烟对健康有害。", difficulty: 3 },
      { id: 3006, word: "exacerbate", phonetic: "/ɪɡˈzæsəbeɪt/", pos: "v.", meaning: "使恶化；加剧", example: "The drought exacerbated the food crisis.", exampleCn: "干旱加剧了粮食危机。", difficulty: 3 },
      { id: 3007, word: "juxtapose", phonetic: "/ˌdʒʌkstəˈpəʊz/", pos: "v.", meaning: "并列；对比", example: "The exhibition juxtaposes old and new art.", exampleCn: "展览将新旧艺术并列展示。", difficulty: 3 },
      { id: 3008, word: "meticulous", phonetic: "/məˈtɪkjələs/", pos: "adj.", meaning: "一丝不苟的", example: "She is meticulous in her work.", exampleCn: "她工作一丝不苟。", difficulty: 3 },
      { id: 3009, word: "proliferate", phonetic: "/prəˈlɪfəreɪt/", pos: "v.", meaning: "激增；扩散", example: "Social media platforms have proliferated.", exampleCn: "社交媒体平台激增。", difficulty: 3 },
      { id: 3010, word: "scrutinize", phonetic: "/ˈskruːtənaɪz/", pos: "v.", meaning: "仔细检查", example: "The report was scrutinized by experts.", exampleCn: "报告受到专家的仔细审查。", difficulty: 3 },
      { id: 3011, word: "tangible", phonetic: "/ˈtændʒəbl/", pos: "adj.", meaning: "有形的；切实的", example: "We need tangible results.", exampleCn: "我们需要切实的结果。", difficulty: 2 },
      { id: 3012, word: "volatile", phonetic: "/ˈvɒlətaɪl/", pos: "adj.", meaning: "不稳定的；易变的", example: "The market is highly volatile.", exampleCn: "市场高度不稳定。", difficulty: 3 },
      { id: 3013, word: "ambiguous", phonetic: "/æmˈbɪɡjuəs/", pos: "adj.", meaning: "模棱两可的", example: "The statement was deliberately ambiguous.", exampleCn: "该声明故意含糊不清。", difficulty: 2 },
      { id: 3014, word: "coherent", phonetic: "/kəʊˈhɪərənt/", pos: "adj.", meaning: "连贯的；一致的", example: "She presented a coherent argument.", exampleCn: "她提出了一个连贯的论点。", difficulty: 3 },
      { id: 3015, word: "discrepancy", phonetic: "/dɪˈskrepənsi/", pos: "n.", meaning: "差异；矛盾", example: "There is a discrepancy between the two reports.", exampleCn: "两份报告之间存在差异。", difficulty: 3 },
      { id: 3016, word: "indispensable", phonetic: "/ˌɪndɪˈspensəbl/", pos: "adj.", meaning: "不可或缺的", example: "Water is indispensable to life.", exampleCn: "水对生命不可或缺。", difficulty: 3 },
      { id: 3017, word: "intricate", phonetic: "/ˈɪntrɪkət/", pos: "adj.", meaning: "复杂的；精细的", example: "The watch has an intricate mechanism.", exampleCn: "这块表有精密的机械结构。", difficulty: 3 },
      { id: 3018, word: "notorious", phonetic: "/nəʊˈtɔːriəs/", pos: "adj.", meaning: "臭名昭著的", example: "He is notorious for his bad temper.", exampleCn: "他因坏脾气而臭名昭著。", difficulty: 2 },
      { id: 3019, word: "plausible", phonetic: "/ˈplɔːzəbl/", pos: "adj.", meaning: "似乎合理的", example: "That's a plausible explanation.", exampleCn: "那是一个似乎合理的解释。", difficulty: 3 },
      { id: 3020, word: "prevalent", phonetic: "/ˈprevələnt/", pos: "adj.", meaning: "流行的；普遍的", example: "The disease is prevalent in tropical regions.", exampleCn: "这种疾病在热带地区很普遍。", difficulty: 3 },
      { id: 3021, word: "redundant", phonetic: "/rɪˈdʌndənt/", pos: "adj.", meaning: "多余的；冗余的", example: "The old system is now redundant.", exampleCn: "旧系统现在已经多余了。", difficulty: 2 },
      { id: 3022, word: "scrutiny", phonetic: "/ˈskruːtəni/", pos: "n.", meaning: "审查；细查", example: "The plan is under scrutiny.", exampleCn: "该计划正在接受审查。", difficulty: 3 },
      { id: 3023, word: "spontaneous", phonetic: "/spɒnˈteɪniəs/", pos: "adj.", meaning: "自发的；自然的", example: "The crowd broke into spontaneous applause.", exampleCn: "人群自发地鼓起掌来。", difficulty: 2 },
      { id: 3024, word: "stringent", phonetic: "/ˈstrɪndʒənt/", pos: "adj.", meaning: "严格的；严厉的", example: "The company has stringent safety rules.", exampleCn: "公司有严格的安全规则。", difficulty: 3 },
      { id: 3025, word: "subordinate", phonetic: "/səˈbɔːdɪnət/", pos: "adj.", meaning: "下级的；次要的", example: "He treats his subordinate staff well.", exampleCn: "他对待下属员工很好。", difficulty: 2 },
      { id: 3026, word: "substantiate", phonetic: "/səbˈstænʃieɪt/", pos: "v.", meaning: "证实；证明", example: "Can you substantiate your claim?", exampleCn: "你能证实你的说法吗？", difficulty: 3 },
      { id: 3027, word: "superfluous", phonetic: "/suːˈpɜːfluəs/", pos: "adj.", meaning: "多余的；过剩的", example: "Remove all superfluous details.", exampleCn: "删除所有多余的细节。", difficulty: 3 },
      { id: 3028, word: "synthesize", phonetic: "/ˈsɪnθəsaɪz/", pos: "v.", meaning: "综合；合成", example: "We need to synthesize the data.", exampleCn: "我们需要综合这些数据。", difficulty: 3 },
      { id: 3029, word: "tentative", phonetic: "/ˈtentətɪv/", pos: "adj.", meaning: "暂定的；试探性的", example: "We've made a tentative plan.", exampleCn: "我们制定了一个暂定的计划。", difficulty: 3 },
      { id: 3030, word: "trivial", phonetic: "/ˈtrɪviəl/", pos: "adj.", meaning: "琐碎的；微不足道的", example: "Don't worry about trivial details.", exampleCn: "不要担心琐碎的细节。", difficulty: 2 },
      { id: 3031, word: "undermine", phonetic: "/ˌʌndəˈmaɪn/", pos: "v.", meaning: "破坏；削弱", example: "This could undermine public confidence.", exampleCn: "这可能会破坏公众信心。", difficulty: 3 },
      { id: 3032, word: "viable", phonetic: "/ˈvaɪəbl/", pos: "adj.", meaning: "可行的", example: "Is this a viable solution?", exampleCn: "这是一个可行的解决方案吗？", difficulty: 2 },
      { id: 3033, word: "vigorous", phonetic: "/ˈvɪɡərəs/", pos: "adj.", meaning: "有力的；精力充沛的", example: "He made a vigorous defense.", exampleCn: "他进行了有力的辩护。", difficulty: 2 },
      { id: 3034, word: "profound", phonetic: "/prəˈfaʊnd/", pos: "adj.", meaning: "深刻的；深远的", example: "The book had a profound effect on me.", exampleCn: "这本书对我产生了深远的影响。", difficulty: 2 },
      { id: 3035, word: "reluctant", phonetic: "/rɪˈlʌktənt/", pos: "adj.", meaning: "不情愿的；勉强的", example: "She was reluctant to accept the offer.", exampleCn: "她不愿接受这个提议。", difficulty: 2 },
      { id: 3036, word: "sophisticated", phonetic: "/səˈfɪstɪkeɪtɪd/", pos: "adj.", meaning: "复杂的；精密的", example: "This is a sophisticated piece of equipment.", exampleCn: "这是一件精密的设备。", difficulty: 2 },
      { id: 3037, word: "substantial", phonetic: "/səbˈstænʃəl/", pos: "adj.", meaning: "大量的；实质的", example: "We made substantial progress.", exampleCn: "我们取得了实质性进展。", difficulty: 2 },
      { id: 3038, word: "sustain", phonetic: "/səˈsteɪn/", pos: "v.", meaning: "维持；支撑", example: "We need to sustain economic growth.", exampleCn: "我们需要维持经济增长。", difficulty: 2 },
      { id: 3039, word: "thorough", phonetic: "/ˈθʌrə/", pos: "adj.", meaning: "彻底的；全面的", example: "The police conducted a thorough investigation.", exampleCn: "警方进行了彻底的调查。", difficulty: 2 },
      { id: 3040, word: "consolidate", phonetic: "/kənˈsɒlɪdeɪt/", pos: "v.", meaning: "巩固；合并", example: "The company consolidated its market position.", exampleCn: "公司巩固了其市场地位。", difficulty: 3 },
      { id: 3041, word: "conceive", phonetic: "/kənˈsiːv/", pos: "v.", meaning: "构想；设想", example: "I can't conceive of such a thing.", exampleCn: "我无法想象这样的事情。", difficulty: 3 },
      { id: 3042, word: "deduce", phonetic: "/dɪˈdjuːs/", pos: "v.", meaning: "推断；推论", example: "We can deduce from the data that...", exampleCn: "我们可以从数据中推断出……", difficulty: 3 },
      { id: 3043, word: "aggregate", phonetic: "/ˈæɡrɪɡət/", pos: "n.", meaning: "总计；合计", example: "The aggregate score determines the winner.", exampleCn: "总分决定获胜者。", difficulty: 3 },
      { id: 3044, word: "arbitrary", phonetic: "/ˈɑːbɪtrəri/", pos: "adj.", meaning: "任意的；武断的", example: "The decision seemed completely arbitrary.", exampleCn: "这个决定似乎完全是武断的。", difficulty: 3 },
      { id: 3045, word: "alleviate", phonetic: "/əˈliːvieɪt/", pos: "v.", meaning: "减轻；缓和", example: "The medicine helped alleviate the pain.", exampleCn: "药物帮助减轻了疼痛。", difficulty: 3 },
      { id: 3046, word: "aesthetic", phonetic: "/iːsˈθetɪk/", pos: "adj.", meaning: "美学的；审美的", example: "The building has great aesthetic appeal.", exampleCn: "这座建筑有很强的美学吸引力。", difficulty: 3 },
      { id: 3047, word: "concurrent", phonetic: "/kənˈkʌrənt/", pos: "adj.", meaning: "同时发生的", example: "The two events were concurrent.", exampleCn: "这两个事件同时发生。", difficulty: 3 },
      { id: 3048, word: "compensate", phonetic: "/ˈkɒmpenseɪt/", pos: "v.", meaning: "补偿；弥补", example: "Nothing can compensate for the loss of health.", exampleCn: "没有什么能弥补健康的损失。", difficulty: 2 },
      { id: 3049, word: "catastrophe", phonetic: "/kəˈtæstrəfi/", pos: "n.", meaning: "灾难；大祸", example: "The flood was a major catastrophe.", exampleCn: "洪水是一场重大灾难。", difficulty: 2 },
      { id: 3050, word: "prosperity", phonetic: "/prɒˈsperəti/", pos: "n.", meaning: "繁荣；兴旺", example: "The country enjoyed a period of prosperity.", exampleCn: "这个国家经历了一段繁荣时期。", difficulty: 2 },
    ],
  },
];

// Add IELTS 8000 word lists if loaded
if (ieltsSequential) {
  WORD_LISTS.push(ieltsSequential);
}
if (ieltsRandom) {
  WORD_LISTS.push(ieltsRandom);
}

// ── In-memory state (per list) ───────────────────────────────────

const listState = new Map<string, {
  knownWordIds: Set<number>;
  reviewWords: Map<number, { word: Word; reviewCount: number; lastReviewed: number }>;
}>();

const dailyStats = new Map<string, { learned: number; known: number; unknown: number }>();

const getListState = (listId: string) => {
  if (!listState.has(listId)) {
    listState.set(listId, {
      knownWordIds: new Set(),
      reviewWords: new Map(),
    });
  }
  return listState.get(listId)!;
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const getTodayStats = () => {
  const key = getTodayKey();
  if (!dailyStats.has(key)) {
    dailyStats.set(key, { learned: 0, known: 0, unknown: 0 });
  }
  return dailyStats.get(key)!;
};

const getWordList = (listId: string): WordList | undefined => {
  return WORD_LISTS.find(l => l.id === listId);
};

// ── API: Get word lists ──────────────────────────────────────────

app.get('/api/v1/word-lists', (req, res) => {
  const lists = WORD_LISTS.map(l => {
    const state = getListState(l.id);
    return {
      id: l.id,
      name: l.name,
      description: l.description,
      icon: l.icon,
      color: l.color,
      totalWords: l.words.length,
      knownCount: state.knownWordIds.size,
      reviewCount: state.reviewWords.size,
    };
  });
  res.json({ lists });
});

// ── API: Get batch of words to learn ─────────────────────────────

app.get('/api/v1/words/batch', (req, res) => {
  const listId = (req.query.listId as string) || 'core';
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 10;

  const wordList = getWordList(listId);
  if (!wordList) {
    return res.status(404).json({ error: 'Word list not found' });
  }

  const state = getListState(listId);
  const available = wordList.words.filter(w => !state.knownWordIds.has(w.id) && !state.reviewWords.has(w.id));
  const batch = available.slice(offset, offset + limit);

  res.json({
    words: batch,
    total: available.length,
    offset,
    limit,
  });
});

// ── API: Get all words in a list ─────────────────────────────────

app.get('/api/v1/words', (req, res) => {
  const listId = (req.query.listId as string) || 'core';
  const wordList = getWordList(listId);
  if (!wordList) {
    return res.status(404).json({ error: 'Word list not found' });
  }
  res.json({
    words: wordList.words,
    total: wordList.words.length,
  });
});

// ── API: Mark word as known ──────────────────────────────────────

app.post('/api/v1/words/:id/known', (req, res) => {
  const id = parseInt(req.params.id);
  const listId = (req.body.listId as string) || 'core';

  const wordList = getWordList(listId);
  if (!wordList) {
    return res.status(404).json({ error: 'Word list not found' });
  }

  const word = wordList.words.find(w => w.id === id);
  if (!word) {
    return res.status(404).json({ error: 'Word not found' });
  }

  const state = getListState(listId);
  state.knownWordIds.add(id);
  state.reviewWords.delete(id);

  const stats = getTodayStats();
  stats.learned++;
  stats.known++;

  res.json({ success: true, word });
});

// ── API: Mark word as unknown (add to review) ────────────────────

app.post('/api/v1/words/:id/unknown', (req, res) => {
  const id = parseInt(req.params.id);
  const listId = (req.body.listId as string) || 'core';

  const wordList = getWordList(listId);
  if (!wordList) {
    return res.status(404).json({ error: 'Word list not found' });
  }

  const word = wordList.words.find(w => w.id === id);
  if (!word) {
    return res.status(404).json({ error: 'Word not found' });
  }

  const state = getListState(listId);
  const existing = state.reviewWords.get(id);
  state.reviewWords.set(id, {
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
  const listId = (req.query.listId as string) || 'core';
  const state = getListState(listId);
  const list = Array.from(state.reviewWords.values()).sort((a, b) => b.lastReviewed - a.lastReviewed);
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
  const listId = (req.body.listId as string) || 'core';
  const state = getListState(listId);

  if (!state.reviewWords.has(id)) {
    return res.status(404).json({ error: 'Word not in review list' });
  }

  state.knownWordIds.add(id);
  state.reviewWords.delete(id);

  res.json({ success: true });
});

// ── API: Remove word from review ─────────────────────────────────

app.delete('/api/v1/review/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const listId = (req.query.listId as string) || 'core';
  const state = getListState(listId);
  state.reviewWords.delete(id);
  res.json({ success: true });
});

// ── API: Get learning stats ──────────────────────────────────────

app.get('/api/v1/stats', (req, res) => {
  const listId = (req.query.listId as string) || 'core';
  const wordList = getWordList(listId);
  if (!wordList) {
    return res.status(404).json({ error: 'Word list not found' });
  }

  const state = getListState(listId);
  const today = getTodayStats();
  const totalKnown = state.knownWordIds.size;
  const totalReview = state.reviewWords.size;

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
    totalWords: wordList.words.length,
    streak,
    last7Days,
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
