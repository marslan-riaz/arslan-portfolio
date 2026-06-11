import { Router } from "express";
import rateLimit from "express-rate-limit";
import { handleChat } from "../controllers/chat.controller.js";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 questions per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down a little." },
});

router.post("/chat", chatLimiter, handleChat);

export default router;
