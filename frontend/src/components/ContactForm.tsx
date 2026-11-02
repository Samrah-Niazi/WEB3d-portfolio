import { useRef, useState, type FormEvent } from "react";
import { track } from "../lib/analytics";

const API = import.meta.env.VITE_API_URL ?? "";

type Fields = { name: string; email: string; subject: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

// Same rules as the backend; the server re-checks everything.
function validate(v: Fields): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name.";
  else if (v.name.trim().length > 80) e.name = "Name is too long.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "Please enter a valid email address.";
  if (v.subject.trim().length < 3) e.subject = "Please enter a subject.";
  else if (v.subject.trim().length > 120) e.subject = "Subject is too long.";
  if (v.message.trim().length < 10) e.message = "Message must be at least 10 characters.";
  else if (v.message.trim().length > 2000) e.message = "Message is too long.";
  return e;
}

const inputClass = "w-full rounded-xl border-2 bg-bg/60 px-4 py-2.5";

export default function ContactForm() {
  const [values, setValues] = useState<Fields>({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const startedAt = useRef(Date.now());

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setStatus("error");
      setFeedback("Please fix the highlighted fields.");
      return;
    }
    setStatus("sending");
    setFeedback("");
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot, startedAt: startedAt.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }
      track("contact_sent");
      setStatus("sent");
      setFeedback("Thank you! Your message has been sent. I'll reply by email soon.");
      setValues({ name: "", email: "", subject: "", message: "" });
      startedAt.current = Date.now();
    } catch (err) {
      setStatus("error");
      setFeedback(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const field = (id: keyof Fields, label: string, props: { type?: string; autoComplete?: string; max: number }) => (
    <div>
      <label htmlFor={`c-${id}`} className="mb-1 block text-sm font-medium">{label}</label>
      <input
        id={`c-${id}`}
        type={props.type ?? "text"}
        autoComplete={props.autoComplete}
        maxLength={props.max}
        value={values[id]}
        onChange={set(id)}
        aria-invalid={!!errors[id]}
        aria-describedby={errors[id] ? `c-${id}-err` : undefined}
        className={`${inputClass} ${errors[id] ? "border-red-500" : "border-line"}`}
      />
      {errors[id] && <p id={`c-${id}-err`} className="mt-1 text-sm text-red-500">{errors[id]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Name", { autoComplete: "name", max: 80 })}
        {field("email", "Email", { type: "email", autoComplete: "email", max: 254 })}
      </div>
      {field("subject", "Subject", { max: 120 })}
      <div>
        <label htmlFor="c-message" className="mb-1 block text-sm font-medium">Message</label>
        <textarea
          id="c-message"
          rows={6}
          maxLength={2000}
          value={values.message}
          onChange={set("message")}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "c-message-err" : undefined}
          className={`${inputClass} ${errors.message ? "border-red-500" : "border-line"}`}
        />
        <div className="mt-1 flex justify-between text-sm">
          <span id="c-message-err" className="text-red-500">{errors.message}</span>
          <span className="text-muted">{values.message.length}/2000</span>
        </div>
      </div>

      {/* Honeypot: invisible to visitors and skipped by keyboard and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-3d"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>

      <p
        role={status === "error" ? "alert" : "status"}
        className={`text-sm ${status === "error" ? "text-red-500" : "text-accent"}`}
      >
        {feedback}
      </p>
    </form>
  );
}
