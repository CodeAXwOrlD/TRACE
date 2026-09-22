export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="py-14 text-center">
      <div className="text-[#cfd6dc] font-medium mb-1">{title}</div>
      {description && <div className="text-muted text-sm max-w-sm mx-auto">{description}</div>}
    </div>
  );
}
