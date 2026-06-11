import { answerQuestion } from "../services/rag.service.js";

export async function handleChat(req, res, next) {
  try {
    const { message, sessionId } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "A non-empty 'message' string is required." });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: "Message too long (max 1000 characters)." });
    }
    const session = typeof sessionId === "string" && sessionId.length <= 64 ? sessionId : "anonymous";
    const result = await answerQuestion(session, message.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
}
