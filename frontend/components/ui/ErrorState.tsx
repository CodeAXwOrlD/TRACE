export function ErrorState({ message = "Something went wrong.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="py-14 text-center" role="alert">
      <div className="text-red font-medium mb-2">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-mono text-blue underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}
