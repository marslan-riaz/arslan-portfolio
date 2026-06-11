import Section from "./Section";
import site from "@/data/site.json";

export default function Contact() {
  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Let's build something"
      subtitle="Open to senior full-stack and AI engineering roles, consulting, and interesting projects."
      tinted
    >
      <div className="flex flex-wrap gap-4">
        <a
          href={`mailto:${site.email}`}
          className="rounded-md bg-ink px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          {site.email}
        </a>
        <a
          href={`tel:${site.phone}`}
          className="rounded-md border border-ink/20 bg-white px-6 py-3 font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
        >
          {site.phone}
        </a>
        <a
          href={site.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-ink/20 bg-white px-6 py-3 font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
        >
          LinkedIn
        </a>
      </div>
    </Section>
  );
}
