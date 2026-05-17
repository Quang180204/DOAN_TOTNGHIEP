'use client';

interface Column {
  key: string;
  header: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  actions?: (row: any) => React.ReactNode;
  onRowClick?: (row: any) => void;
}

export default function DataTable({ columns, data, actions, onRowClick }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {columns.map((col) => (
                <th key={col.key} className="px-5 py-4" style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-5 py-4 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.map((row, idx) => (
              <tr
                key={idx}
                className={`transition ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4 align-middle">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-5 py-4 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
