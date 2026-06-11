import express from "express";
import cors from "cors";
import { config, assertConfig } from "./config.js";
import chatRoutes from "./routes/chat.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

assertConfig();

const app = express();

app.use(
  cors({
    origin: config.corsOrigins,
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", chatRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`✓ RAG backend running on http://localhost:${config.port}`);
  console.log(`  Qdrant: ${config.qdrant.url} (collection: ${config.qdrant.collection})`);
  console.log(`  Models: ${config.gemini.chatModel} + ${config.gemini.embeddingModel}`);
});
