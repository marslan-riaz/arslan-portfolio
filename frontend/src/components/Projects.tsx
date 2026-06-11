import Section from "./Section";
import projects from "@/data/projects.json";

function ProjectLink({ url, name }: { url: string; name: string }) {
  if (!url || url.startsWith("#"))
    return <span className="font-display text-lg font-semibold text-ink">{name}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-display text-lg font-semibold text-ink underline-offset-4 hover:text-brand hover:underline"
    >
      {name} ↗
    </a>
  );
}

export default function Projects() {
  return (
    <Section
      id="projects"
      eyebrow="Selected work"
      title="Projects"
      subtitle="From government platforms serving millions to the AI assistant running on this page."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {projects.featured.map((p) => (
          <article key={p.name} className="flex flex-col rounded-xl border border-line bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <ProjectLink url={p.url} name={p.name} />
              {p.tags?.includes("AI") && (
                <span className="rounded-full bg-brand px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
                  AI
                </span>
              )}
            </div>
            <p className="mt-1 text-xs uppercase tracking-wide text-steel/70">{p.org}</p>
            <p className="mt-3 flex-1 leading-relaxed">{p.description}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {p.tools.map((t) => (
                <li key={t} className="rounded bg-mist px-2.5 py-1 font-mono text-xs text-steel">
                  {t}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <h3 className="mt-16 font-display text-xl font-semibold text-ink">More projects</h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.more.map((p) => (
          <article key={p.name} className="rounded-lg border border-line bg-white p-5">
            <ProjectLink url={p.url} name={p.name} />
            <p className="mt-1 text-xs uppercase tracking-wide text-steel/70">{p.org}</p>
            <p className="mt-2 text-sm leading-relaxed">{p.description}</p>
            <p className="mt-3 font-mono text-xs text-steel/70">{p.tools.join(" · ")}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
