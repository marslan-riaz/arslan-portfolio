export default function Section({
  id,
  eyebrow,
  title,
  subtitle,
  tinted = false,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  tinted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`py-20 md:py-28 ${tinted ? "bg-mist" : "bg-white"}`}>
      <div className="mx-auto max-w-content px-6">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-4 max-w-2xl text-lg">{subtitle}</p>}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
