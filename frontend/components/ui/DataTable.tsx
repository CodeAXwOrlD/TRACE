import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({ columns, rows, onRowClick }: { columns: Column<T>[]; rows: T[]; onRowClick?: (row: T) => void }) {
  if (rows.length === 0) {
    return <div className="py-10 text-center text-muted text-sm font-mono">No records.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[.08]">
            {columns.map((c) => (
              <th key={c.header} className="text-left font-mono text-[10px] tracking-wider text-muted uppercase py-2 px-3">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              {...(onRowClick ? { onClick: () => onRowClick(row) } : {})}
              className={cn("border-b border-white/[.05] transition-colors", onRowClick && "cursor-pointer hover:bg-white/[.03]")}
            >
              {columns.map((c) => (
                <td key={c.header} className={cn("py-3 px-3 text-[#dfe4e8]", c.className)}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
