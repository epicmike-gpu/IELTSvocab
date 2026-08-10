import { LLMClient, Config } from "coze-coding-dev-sdk";

const config = new Config();
const client = new LLMClient(config);

const SYSTEM_PROMPT = `You are an English vocabulary expert. For the given word, generate phonetic transcription, an example sentence with Chinese translation, and Chinese meaning. Respond ONLY in this exact JSON format:
{"phonetic":"/fəˈnetɪk/","example":"This is an example sentence.","exampleCn":"这是例句的中文翻译。","meaning":"释义"}`;

export interface EnrichResult {
  phonetic: string;
  example: string;
  exampleCn: string;
  meaning: string;
}

export async function enrichWord(word: string): Promise<EnrichResult> {
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: `Word: ${word}` },
  ];

  const response = await client.invoke(messages, {
    model: "doubao-seed-2-0-mini-260215",
    temperature: 0.3,
  });

  try {
    const result = JSON.parse(response.content);
    return {
      phonetic: result.phonetic || "",
      example: result.example || "",
      exampleCn: result.exampleCn || "",
      meaning: result.meaning || "",
    };
  } catch {
    console.error("Failed to parse LLM response:", response.content);
    throw new Error("LLM response parse failed");
  }
}
