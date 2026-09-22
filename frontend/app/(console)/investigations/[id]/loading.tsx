export default function InvestigationWorkspaceLoading() {
  return (
    <div className="space-y-6 animate-pulse py-2">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between border-b border-white/[.08] pb-4">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-white/10 rounded" />
          <div className="h-7 w-48 bg-white/10 rounded" />
        </div>
        <div className="h-6 w-24 bg-white/10 rounded-full" />
      </div>

      {/* 3-Column Workspace Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr_360px] gap-5">
        <div className="space-y-4">
          <div className="h-28 rounded-panel bg-white/[.03] border border-white/[.06]" />
          <div className="h-28 rounded-panel bg-white/[.03] border border-white/[.06]" />
          <div className="h-44 rounded-panel bg-white/[.03] border border-white/[.06]" />
        </div>

        <div className="h-[520px] rounded-panel bg-white/[.02] border border-white/[.06] flex items-center justify-center">
          <div className="font-mono text-xs text-muted">Initialising Sigma.js graph…</div>
        </div>

        <div className="h-[520px] rounded-panel bg-white/[.03] border border-white/[.06] p-4 space-y-4">
          <div className="h-5 w-40 bg-white/10 rounded" />
          <div className="h-20 rounded bg-white/[.02]" />
          <div className="h-20 rounded bg-white/[.02]" />
          <div className="h-20 rounded bg-white/[.02]" />
        </div>
      </div>

      {/* Timeline Skeleton */}
      <div className="h-32 rounded-panel bg-white/[.03] border border-white/[.06]" />
    </div>
  );
}
