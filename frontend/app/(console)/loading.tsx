export default function ConsoleLoading() {
  return (
    <div className="space-y-6 animate-pulse py-4">
      <div className="h-4 w-28 bg-white/10 rounded" />
      <div className="h-8 w-64 bg-white/10 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-panel bg-white/[.04] border border-white/[.06]" />
        ))}
      </div>
      <div className="h-64 rounded-panel bg-white/[.03] border border-white/[.06]" />
    </div>
  );
}
