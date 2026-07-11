import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
};

export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
}) {
  if (rows.length === 0) {
    return <div className="p-6 text-center text-sm text-muted-foreground">{empty ?? "No records"}</div>;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {columns.map((c) => (
                <th key={c.key} className={cn("px-3 py-3", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/30 last:border-0 hover:bg-accent/30">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-3 py-3.5 align-middle", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl bg-muted/40 p-3">
            <dl className="grid gap-2 text-sm">
              {columns.filter((c) => !c.hideOnMobile).map((c) => (
                <div key={c.key} className="grid grid-cols-[minmax(0,90px)_minmax(0,1fr)] items-center gap-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{c.header}</dt>
                  <dd className="min-w-0">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
