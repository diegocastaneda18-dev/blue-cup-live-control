export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-sky-500/25 bg-gradient-to-b from-slate-900/50 to-slate-950/90 px-6 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-500/80">Empty</p>
      <p className="mt-2 text-base font-semibold tracking-tight text-slate-100">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
