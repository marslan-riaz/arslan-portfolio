import Section from "./Section";
import experience from "@/data/experience.json";

export default function Experience() {
  return (
    <Section id="experience" eyebrow="Track record" title="Experience" tinted>
      <ol className="relative space-y-10 border-l border-line pl-8">
        {experience.items.map((job) => (
          <li key={job.company + job.period} className="relative">
            <span
              className={`absolute -left-[37px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                job.current ? "bg-brand" : "bg-steel/40"
              }`}
              aria-hidden
            />
            <p className="font-mono text-xs uppercase tracking-wider text-steel/70">
              {job.period} · {job.location}
            </p>
            <h3 className="mt-1 font-display text-xl font-semibold text-ink">
              {job.role} <span className="text-brand">@ {job.company}</span>
            </h3>
            <p className="mt-2 max-w-2xl leading-relaxed">{job.description}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {job.tags.map((t) => (
                <li key={t} className="rounded bg-white px-2.5 py-1 font-mono text-xs text-steel border border-line">
                  {t}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Section>
  );
}
