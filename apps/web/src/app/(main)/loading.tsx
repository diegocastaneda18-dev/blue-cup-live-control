export default function MainLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400/25 border-t-amber-400"
        aria-hidden
      />
      <p className="text-sm text-slate-400">Loading page…</p>
    </div>
  );
}
