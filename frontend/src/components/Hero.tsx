"use client";

import site from "@/data/site.json";
import profile from "@/data/profile.json";
import { openChat } from "@/lib/chatBus";

const starterQuestions = [
  "What AI projects has Arslan built?",
  "Tell me about his work on TAMM",
  "What's his experience with AWS?",
];

export default function Hero() {
  return (
    <section id="top" className="border-b border-line bg-mist">
      <div className="mx-auto grid max-w-content gap-12 px-6 py-20 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-28">
        <div className="animate-rise">
          <p className="eyebrow">{site.location}</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-ink md:text-5xl">
            {site.name}
          </h1>
          <p className="mt-2 font-display text-xl font-semibold text-brand md:text-2xl">{site.title}</p>
          <p className="mt-6 max-w-xl text-lg leading-relaxed">{site.tagline}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => openChat()}
              className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Ask my AI assistant
            </button>
            <a
              href="#projects"
              className="rounded-md border border-ink/20 bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              View projects
            </a>
            <a
              href={site.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-ink/20 bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              LinkedIn
            </a>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {profile.stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-3xl font-bold text-ink">{s.value}</dd>
                <dd className="mt-1 text-xs uppercase tracking-wide text-steel/80">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Signature element: live RAG console */}
        <div className="animate-rise rounded-xl border border-line bg-white shadow-sm" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="font-mono text-xs text-steel">arslan-ai · RAG over this portfolio</span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-brand">
              <span className="h-2 w-2 rounded-full bg-brand" aria-hidden /> live
            </span>
          </div>
          <div className="space-y-4 px-5 py-6">
            <p className="text-sm text-steel">
              This isn&apos;t a mock — it&apos;s a real retrieval-augmented chatbot I built.
              <span className="font-mono text-xs text-steel/70"> Express.js → Gemini embeddings → Qdrant → Gemini.</span>
            </p>
            <div className="space-y-2">
              {starterQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => openChat(q)}
                  className="block w-full rounded-lg border border-line bg-mist px-4 py-3 text-left text-sm font-medium text-ink transition-colors hover:border-brand hover:bg-brand-soft"
                >
                  &ldquo;{q}&rdquo;
                </button>
              ))}
            </div>
            <button onClick={() => openChat()} className="text-sm font-semibold text-brand hover:text-brand-dark">
              Or ask your own question →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
