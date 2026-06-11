"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAT_OPEN_EVENT } from "@/lib/chatBus";
import site from "@/data/site.json";

type Message = { role: "user" | "assistant"; content: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const WELCOME: Message = {
  role: "assistant",
  content: `Hi! I'm ${site.shortName.split(" ")[0]}'s AI assistant — a RAG chatbot grounded in his real career data. Ask me about his projects, skills, AI work, or experience.`,
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2) + Date.now().toString(36));
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || loading) return;
      setInput("");
      setMessages((m) => [...m, { role: "user", content: question }]);
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question, sessionId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `The assistant is offline right now. You can reach Arslan directly at ${site.email}.`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, sessionId]
  );

  // Listen for open-chat events fired anywhere on the page
  useEffect(() => {
    const handler = (e: Event) => {
      setOpen(true);
      const q = (e as CustomEvent).detail?.question as string | undefined;
      if (q) send(q);
    };
    window.addEventListener(CHAT_OPEN_EVENT, handler);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handler);
  }, [send]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-dark"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
            <path d="M9 11h.01M13 11h.01M17 11h.01" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="AI assistant chat"
          className="fixed bottom-24 right-5 z-50 flex h-[min(34rem,75vh)] w-[min(24rem,calc(100vw-2.5rem))] animate-rise flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between bg-ink px-5 py-4">
            <div>
              <p className="font-display text-sm font-semibold text-white">Arslan&apos;s AI Assistant</p>
              <p className="font-mono text-[11px] text-white/60">RAG · Gemini + Qdrant + Express</p>
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden /> online
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`chat-bubble max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-brand text-white"
                      : "rounded-bl-sm bg-mist text-ink"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start" aria-live="polite" aria-label="Assistant is typing">
                <div className="flex gap-1.5 rounded-2xl rounded-bl-sm bg-mist px-4 py-3">
                  <span className="typing-dot h-2 w-2 rounded-full bg-steel" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-steel" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-steel" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-line px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Arslan's work…"
              aria-label="Your question"
              className="flex-1 rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-steel/50 focus:border-brand"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="rounded-lg bg-brand p-2.5 text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
