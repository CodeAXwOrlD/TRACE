export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatPct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatTimestamp(iso: string): string {
  if (!iso) return "—";
  // Deterministic parsing to prevent SSR / Client hydration mismatches
  const match = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (match && match[2] && match[3] && match[4] && match[5]) {
    const m = match[2];
    const d = match[3];
    const hh = match[4];
    const mm = match[5];
    const monthIdx = parseInt(m, 10) - 1;
    const month = MONTHS[monthIdx] || m;
    return `${d} ${month}, ${hh}:${mm}`;
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = MONTHS[d.getUTCMonth()];
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const mins = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month}, ${hours}:${mins}`;
}

