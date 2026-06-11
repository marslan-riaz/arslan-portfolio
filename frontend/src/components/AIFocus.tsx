"use client";

import Section from "./Section";
import profile from "@/data/profile.json";
import { openChat } from "@/lib/chatBus";

export default function AIFocus() {
  const ai = profile.aiFocus;
  return (
    <Section id="ai" eyebrow="Specialisation" title={ai.title} subtitle={ai.description} tinted>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ai.capabilities.map((c) => (
          <div key={c} className="rounded-lg border border-line bg-white p-5">
            <span className="font-mono text-xs text-brand">▸</span>
            <p className="mt-2 font-medium text-ink">{c}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-xl border border-brand/30 bg-brand-soft p-6 md:flex md:items-center md:justify-between">
        <p className="font-display text-lg font-semibold text-ink">
          The proof is on this page — the assistant below runs on my own RAG stack.
        </p>
        <button
          onClick={() => openChat("How does the RAG chatbot on this site work?")}
          className="mt-4 rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark md:mt-0"
        >
          Ask it how it works
        </button>
      </div>
    </Section>
  );
}
