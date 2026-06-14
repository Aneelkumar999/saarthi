export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-saffron">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-navy md:text-5xl dark:text-dark-text">{title}</h1>
      <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-dark-muted">{description}</p>
    </div>
  );
}
