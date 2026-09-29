import { Router } from "express";
import rateLimit from "express-rate-limit";
import { emails, inboxPayload, MODEL, present, THRESHOLDS, triage } from "../services/triage.service.js";

const router = Router();

const triageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 4,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many triage runs — please wait a few minutes and try again." },
});

function send(res, event, data) {
  if (res.writableEnded || res.destroyed) return false;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  return true;
}

router.get("/emails", (_req, res) => {
  res.json(inboxPayload());
});

router.post("/triage", triageLimiter, async (req, res) => {
  let clientGone = false;
  res.on("close", () => {
    clientGone = true;
  });

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  send(res, "start", {
    total: emails.length,
    model: MODEL,
    thresholds: THRESHOLDS,
  });

  let modelCalls = 0;
  let totalTokens = 0;
  let totalCost = 0;

  try {
    for (const email of emails) {
      if (clientGone) break;

      send(res, "status", { id: email.id, state: "classifying" });
      const started = Date.now();

      try {
        const result = await triage(email);
        const ms = Date.now() - started;
        totalCost += result.cost ?? 0;
        totalTokens += result.usage?.inputTokens ?? 0;
        if (result.by !== "prefilter") modelCalls += 1;

        console.log(
          `${result.decision.padEnd(7)} ${email.subject.slice(0, 52)}  ${result.by} · ${ms}ms`
        );

        if (!clientGone) {
          send(res, "result", {
            id: email.id,
            ...present(result, ms),
          });
        }
      } catch (err) {
        console.error(`[triage] ${email.id}:`, err?.message || err);
        if (!clientGone) {
          send(res, "error", {
            id: email.id,
            message: err instanceof Error ? err.message : "Triage failed",
          });
        }
      }
    }

    if (!clientGone) {
      send(res, "done", {
        modelCalls,
        total: emails.length,
        inputTokens: totalTokens,
        cost: totalCost,
      });
    }
  } finally {
    if (!res.writableEnded) res.end();
  }
});

export default router;
