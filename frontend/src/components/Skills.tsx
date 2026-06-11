import Section from "./Section";
import skills from "@/data/skills.json";

export default function Skills() {
  return (
    <Section id="skills" eyebrow="Capabilities" title="Skills & tooling">
      <div className="grid gap-6 md:grid-cols-2">
        {skills.groups.map((group) => (
          <div
            key={group.name}
            className={`rounded-xl border p-6 ${
              group.highlight ? "border-brand/40 bg-brand-soft/50" : "border-line bg-white"
            }`}
          >
            <h3 className="font-display font-semibold text-ink">
              {group.name}
              {group.highlight && (
                <span className="ml-2 rounded-full bg-brand px-2.5 py-0.5 align-middle font-mono text-[10px] uppercase tracking-wider text-white">
                  Focus
                </span>
              )}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {group.skills.map((s) => (
                <li
                  key={s}
                  className="rounded-md border border-line bg-white px-3 py-1.5 text-sm font-medium text-steel"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
