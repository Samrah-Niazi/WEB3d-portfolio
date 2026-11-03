import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { answer } from "./rag/answer.js";
import { handleContact } from "./contact.js";

const app = express();
// Behind Vercel's proxy, so rate limits see the visitor's IP instead of the proxy's.
app.set("trust proxy", 1);
const origins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173,http://localhost:5500,http://127.0.0.1:5500").split(",");

app.use(helmet());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: "20kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1000) }))
    .min(1)
    .max(12),
  lang: z.enum(["en", "ur", "ar", "hi", "es", "fr"]).optional(),
});
const chatLimiter = rateLimit({ windowMs: 60_000, limit: 40, standardHeaders: true, legacyHeaders: false });

app.post("/api/chat", chatLimiter, async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return res.status(400).json({ error: "Please send a message of 1 to 1000 characters." });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "The chatbot is not configured yet." });
  }
  try {
    res.json(await answer(parsed.data.messages, parsed.data.lang));
  } catch (err) {
    console.error("chat failed:", err);
    res.status(502).json({ error: "The assistant is unavailable right now. Please try again." });
  }
});

// Twenty messages per hour per IP: enough for a demo, still stops a spam loop.
const contactLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages from this connection. Please try again later." },
});
app.post("/api/contact", contactLimiter, handleContact);

export default app;
