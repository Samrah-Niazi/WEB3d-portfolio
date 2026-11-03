import { useEffect, useRef, useState, type FormEvent } from "react";
import { track } from "../lib/analytics";

type Source = { title: string; section: string };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[] };

const API = import.meta.env.VITE_API_URL ?? "";

// `speech` is the BCP-47 tag for the browser's voice recognition and speech synthesis.
const LANGUAGES = [
  { code: "en", label: "English", speech: "en-US" },
  { code: "ur", label: "اردو", speech: "ur-PK" },
  { code: "ar", label: "العربية", speech: "ar-SA" },
  { code: "hi", label: "हिन्दी", speech: "hi-IN" },
  { code: "es", label: "Español", speech: "es-ES" },
  { code: "fr", label: "Français", speech: "fr-FR" },
] as const;

const SUGGESTIONS = [
  "What VR projects has Samrah built?",
  "Where did she intern?",
  "Did she win any awards?",
  "What is TALEEM360?",
];
const GREETING: Msg = {
  role: "assistant",
  content: "Hi! I can answer questions about Samrah's projects, skills, education, and experience.",
};

// Minimal typing for the Web Speech API, which is not in the standard TypeScript DOM types.
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;
const SpeechRecognitionImpl: RecognitionCtor | undefined =
  typeof window === "undefined"
    ? undefined
    : (window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition;
const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<(typeof LANGUAGES)[number]>(LANGUAGES[0]);
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState("");
  const [readAloud, setReadAloud] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => void (canSpeak && window.speechSynthesis.cancel()), []);

  function speak(text: string) {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang.speech;
    window.speechSynthesis.speak(u);
  }

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    track("chat_question", { lang: lang.code });
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The greeting is UI-only; the API expects the conversation to start with the visitor.
        body: JSON.stringify({ messages: next.slice(1).map(({ role, content }) => ({ role, content })), lang: lang.code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setMessages([...next, { role: "assistant", content: data.answer, sources: data.sources }]);
      if (readAloud) speak(data.answer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setMessages([...next, { role: "assistant", content: `Sorry, ${msg.charAt(0).toLowerCase()}${msg.slice(1)}` }]);
    } finally {
      setBusy(false);
    }
  }

  // Why the browser refused to listen, in words a visitor can act on.
  const MIC_ERRORS: Record<string, string> = {
    "not-allowed": "The microphone is blocked. Allow it for this site in your browser settings, then try again.",
    "service-not-allowed": "The microphone is blocked. Allow it for this site in your browser settings, then try again.",
    "no-speech": "I didn't hear anything. Tap Mic and try again.",
    "audio-capture": "No microphone was found.",
    network: "Voice typing needs an internet connection.",
    "language-not-supported": "This browser can't do voice typing in that language.",
  };

  // Words appear in the box while she speaks; when she stops, the question is sent.
  // Phones often cut the first attempt off before the person starts talking (the permission prompt, the keyboard,
  // the beep), so a silent first attempt is retried once on its own.
  function toggleMic() {
    if (!SpeechRecognitionImpl) return;
    if (listening) {
      rec.current?.stop();
      return;
    }
    inputRef.current?.blur(); // close the on-screen keyboard so it doesn't compete for the microphone
    setMicNote("");
    setInput("");
    setListening(true);

    const attempt = (retriesLeft: number) => {
      const r = new SpeechRecognitionImpl();
      let heard = "";
      let failed = "";
      r.lang = lang.speech;
      r.interimResults = true;
      r.continuous = false;
      r.onresult = (e) => {
        heard = Array.from(e.results).map((res) => res[0].transcript).join("").trim();
        setInput(heard);
      };
      r.onerror = (e) => {
        failed = e.error;
      };
      r.onend = () => {
        if (!heard && (failed === "no-speech" || failed === "") && retriesLeft > 0) {
          attempt(retriesLeft - 1);
          return;
        }
        setListening(false);
        if (heard) void send(heard);
        else if (failed) setMicNote(MIC_ERRORS[failed] ?? "Voice typing stopped. Please try again.");
        else setMicNote("I didn't catch that. Tap Mic, wait for \"Listening\", then speak.");
      };
      rec.current = r;
      try {
        r.start();
      } catch {
        setListening(false);
        setMicNote("Voice typing couldn't start. Please try again.");
      }
    };
    attempt(1);
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const toggleOpen = () => {
    if (!open) track("chat_open");
    setOpen(!open);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <section
          aria-label="Chat with Samrah's assistant"
          className="mb-3 flex h-[min(34rem,calc(100vh-6rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border-2 border-accent bg-bg shadow-2xl"
        >
          <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="font-semibold">Ask about Samrah</h2>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="chat-lang">Language</label>
              <select
                id="chat-lang"
                value={lang.code}
                onChange={(e) => setLang(LANGUAGES.find((l) => l.code === e.target.value) ?? LANGUAGES[0])}
                className="rounded border border-line bg-bg px-1.5 py-1 text-xs"
              >
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              {canSpeak && (
                <button
                  onClick={() => {
                    if (readAloud) window.speechSynthesis.cancel();
                    setReadAloud(!readAloud);
                  }}
                  aria-pressed={readAloud}
                  aria-label="Read answers aloud"
                  title="Read answers aloud"
                  className={`rounded border px-1.5 py-1 text-xs ${readAloud ? "border-accent text-accent" : "border-line text-muted"}`}
                >
                  Voice
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-muted hover:text-fg">✕</button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <p
                  dir="auto"
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-left text-sm ${
                    m.role === "user" ? "bubble-user font-medium" : "border border-line bg-bg"
                  }`}
                >
                  {m.content}
                </p>
                {m.sources && m.sources.length > 0 && (
                  <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Sources">
                    {m.sources.map((s) => (
                      <li key={s.title}>
                        <a
                          href={`#${s.section}`}
                          onClick={() => setOpen(false)}
                          className="rounded-full border border-line px-2 py-0.5 text-xs text-muted hover:border-accent hover:text-accent"
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {busy && <p className="text-sm text-muted">Thinking…</p>}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-accent hover:text-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottom} />
          </div>

          <form onSubmit={onSubmit} className="flex gap-2 border-t border-line p-3">
            <input
              ref={inputRef}
              dir="auto"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder={listening ? "Listening… speak now" : "Ask a question…"}
              aria-label="Your question"
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm"
            />
            {SpeechRecognitionImpl && (
              <button
                type="button"
                onClick={toggleMic}
                aria-pressed={listening}
                aria-label={listening ? "Stop listening" : "Speak your question"}
                className={`rounded-lg border px-3 text-sm ${listening ? "border-accent text-accent" : "border-line text-muted"}`}
              >
                Mic
              </button>
            )}
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="btn-3d !px-4 !py-2 text-sm"
            >
              Send
            </button>
          </form>
          {micNote && <p role="status" className="border-t border-line px-3 py-2 text-xs text-muted">{micNote}</p>}
        </section>
      )}
      <button
        onClick={toggleOpen}
        aria-expanded={open}
        className="btn-3d ml-auto block"
      >
        {open ? "Close" : "Ask AI"}
      </button>
    </div>
  );
}
