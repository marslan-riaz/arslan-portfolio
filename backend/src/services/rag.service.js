import { embedQuery, generateAnswer } from "./gemini.service.js";
import { searchSimilar } from "./qdrant.service.js";
import { config } from "../config.js";

// In-memory per-session history (swap for Redis in production if needed)
const sessions = new Map();

function getHistory(sessionId) {
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  return sessions.get(sessionId);
}

function buildSystemPrompt(contextChunks) {
  const context = contextChunks
    .map((c, i) => `[${i + 1}] (${c.source})\n${c.text}`)
    .join("\n\n");

  return `You are the AI assistant on Muhammad Arslan Riaz's portfolio website. You represent him professionally to recruiters, clients and visitors.

RULES:
- Answer ONLY using the CONTEXT below. It contains verified facts about Arslan's career, skills and projects.
- If the context doesn't contain the answer, say you don't have that information and suggest contacting Arslan at arslanriaz152@gmail.com. Never invent facts.
- Be warm, concise and professional. Prefer short paragraphs; use plain text, no markdown headers.
- When relevant, highlight Arslan's AI/RAG expertise and his most impressive work (TAMM government platform, fintech, this very chatbot).
- If asked how you work: you are a RAG system — an Express.js backend that embeds the question with Gemini, retrieves relevant chunks from a Qdrant vector database, and generates the answer with Gemini grounded in those chunks. Arslan built you.
- Politely decline questions unrelated to Arslan's professional profile.

CONTEXT:
${context || "(no relevant context found)"}`;
}

export async function answerQuestion(sessionId, message) {
  const queryVector = await embedQuery(message);
  const chunks = await searchSimilar(queryVector);

  const history = getHistory(sessionId);
  const systemPrompt = buildSystemPrompt(chunks);
  const answer = await generateAnswer(systemPrompt, history, message);

  // persist trimmed history
  history.push({ role: "user", text: message }, { role: "model", text: answer });
  const max = config.rag.maxHistoryTurns * 2;
  if (history.length > max) history.splice(0, history.length - max);

  return {
    answer,
    sources: [...new Set(chunks.map((c) => c.source))],
  };
}
