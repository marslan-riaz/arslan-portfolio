import site from "@/data/site.json";

export default function Footer() {
  return (
    <footer className="bg-ink py-10 text-white/70">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-6 text-sm md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name} · {site.location}
        </p>
        <p className="font-mono text-xs">
          Next.js · Express · Gemini · Qdrant — including the AI assistant, built by me.
        </p>
      </div>
    </footer>
  );
}
