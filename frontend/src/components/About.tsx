import Section from "./Section";
import profile from "@/data/profile.json";
import experience from "@/data/experience.json";

export default function About() {
  return (
    <Section id="about" eyebrow="About" title={profile.headline}>
      <div className="grid gap-12 md:grid-cols-[2fr_1fr]">
        <div className="space-y-5 text-base leading-relaxed md:text-lg">
          {profile.summary.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <aside className="h-fit rounded-xl border border-line bg-mist p-6">
          <p className="eyebrow">Education</p>
          <p className="mt-3 font-display font-semibold text-ink">{experience.education.degree}</p>
          <p className="mt-1 text-sm">{experience.education.institution}</p>
          <p className="mt-1 text-sm text-steel/80">
            {experience.education.year} · {experience.education.detail}
          </p>
        </aside>
      </div>
    </Section>
  );
}
