export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 justify-center text-muted font-mono text-xs tracking-wider" role="status" aria-live="polite">
      <span className="w-2 h-2 rounded-full bg-orange animate-pulse" aria-hidden="true" />
      {label}…
    </div>
  );
}
