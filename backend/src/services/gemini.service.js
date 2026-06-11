import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";

let client;
function getClient() {
  if (!client) client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return client;
}
 
/** Embed a batch of texts. Returns number[][] (one vector per text). */
export async function embedTexts(texts) {
  const ai = getClient();
  const res = await withRetry(() =>
    ai.models.embedContent({
      model: config.gemini.embeddingModel,
      contents: texts,
      config: { outputDimensionality: config.gemini.embeddingDim },
    })
  );
  return res.embeddings.map((e) => e.values);
}

/** Embed a single query string. */
export async function embedQuery(text) {
  const [vector] = await embedTexts([text]);
  return vector;
}

/**
 * Generate a chat answer.
 * @param {string} systemPrompt grounding instructions + retrieved context
 * @param {{role:'user'|'model', text:string}[]} history previous turns
 * @param {string} userMessage current question
 */
export async function generateAnswer(systemPrompt, history, userMessage) {
  const ai = getClient();
  const contents = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: "user", parts: [{ text: userMessage }] },
  ];
  const res = await withRetry(() =>
    ai.models.generateContent({
      model: config.gemini.chatModel,
      contents,
      config: { systemInstruction: systemPrompt, temperature: 0.4, maxOutputTokens: 800 },
    })
  );
  return res.text;
}

async function withRetry(fn, { retries = 5, baseDelay = 1500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.code;
      const retryable = status === 429 || status === 503; // ← add 503
      if (!retryable || attempt === retries) throw err;
      const delay = baseDelay * 2 ** attempt + Math.random() * 500;
      console.warn(`Gemini ${status} — retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}