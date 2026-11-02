import nodemailer from "nodemailer";
import { z } from "zod";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Request, Response } from "express";

const LOG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../logs");
// Forms submitted faster than a person could fill them in are bots.
const MIN_FILL_MS = 3000;

// No line breaks in fields that end up in email headers (prevents header injection).
const noBreaks = (v: string) => !/[\r\n]/.test(v);
// Strip control characters except tab and newline.
const stripControl = (v: string) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80, "Name is too long.").refine(noBreaks, "Invalid name."),
  email: z.string().trim().max(254, "Email is too long.").email("Please enter a valid email address."),
  subject: z
    .string()
    .trim()
    .min(3, "Please enter a subject.")
    .max(120, "Subject is too long.")
    .refine(noBreaks, "Invalid subject."),
  message: z.string().trim().min(10, "Message must be at least 10 characters.").max(2000, "Message is too long."),
  // Honeypot: hidden from people, so only bots fill it in.
  website: z.string().max(200).optional(),
  startedAt: z.number().optional(),
});

function transport() {
  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;
  const port = Number(process.env.SMTP_PORT ?? 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS.replace(/\s+/g, "") }, // Google shows app passwords in groups of four
  });
}

async function logDelivery(line: string) {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(path.join(LOG_DIR, "contact.log"), `${new Date().toISOString()} ${line}\n`);
  } catch (err) {
    console.error("could not write contact log:", err);
  }
}

export async function handleContact(req: Request, res: Response) {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return res.status(400).json({ error: "Please fix the highlighted fields.", fields });
  }
  const { name, email, subject, website, startedAt } = parsed.data;
  const message = stripControl(parsed.data.message);

  // Pretend success to bots so they get no signal to adapt to.
  const tooFast = typeof startedAt === "number" && Date.now() - startedAt < MIN_FILL_MS;
  if (website || tooFast) {
    console.warn(`contact: blocked likely bot (${website ? "honeypot" : "too fast"})`);
    return res.json({ ok: true });
  }

  // Resend (HTTPS) is used when RESEND_API_KEY is set, for hosts that block SMTP; otherwise Gmail SMTP.
  const resendKey = process.env.RESEND_API_KEY;
  const mailer = resendKey ? null : transport();
  const to = process.env.CONTACT_TO || process.env.SMTP_USER;
  if ((!mailer && !resendKey) || !to) return res.status(503).json({ error: "The contact form is not configured yet." });

  try {
    // Plain-text body only: visitor input is never interpreted as HTML.
    const text = `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}\n`;
    let id: string;
    if (resendKey) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Portfolio contact form <onboarding@resend.dev>",
          to: [to],
          reply_to: email,
          subject: `[Portfolio] ${subject}`,
          text,
        }),
      });
      const body = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!r.ok) throw new Error(body.message ?? `Resend responded ${r.status}`);
      id = body.id ?? "resend";
    } else {
      const info = await mailer!.sendMail({
        from: { name: "Portfolio contact form", address: process.env.SMTP_USER! },
        to,
        replyTo: { name, address: email },
        subject: `[Portfolio] ${subject}`,
        text,
      });
      id = info.messageId;
    }
    console.log(`contact: delivered ${id}`);
    await logDelivery(`delivered messageId=${id} from=${email} to=${to}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("contact: send failed:", err);
    await logDelivery(`FAILED from=${email} error=${err instanceof Error ? err.message : "unknown"}`);
    res.status(502).json({ error: "Your message could not be sent. Please try again later or email me directly." });
  }
}
