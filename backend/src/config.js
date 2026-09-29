import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim()),

    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      // chatModel: process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash",
      chatModel: process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash",
      embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
      embeddingDim: 768, // gemini-embedding-001, truncated via outputDimensionality
      temperature: 0.4,
      maxOutputTokens: 800,
      maxHistoryTurns: 6, // chat turns kept per session
    },

  qdrant: {
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY || undefined,
    collection: process.env.QDRANT_COLLECTION || "portfolio_knowledge",
  },

  rag: {
    topK: 20,//5,            // chunks retrieved per question
    minScore: 0.35,     // similarity threshold
    maxHistoryTurns: 6, // chat turns kept per session
  },
};

export function assertConfig() {
  if (!config.gemini.apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Copy .env.example to .env and fill it in.");
  }
}
