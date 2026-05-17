'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  color?: string;
  isCurrency?: boolean;
  percentage?: number;
  percentageType?: 'increase' | 'decrease';
}

export default function StatsCard({
  title,
  value,
  isCurrency = false,
  percentage,
  percentageType = 'increase'
}: StatsCardProps) {
  const displayValue = isCurrency ? `${Number(value).toLocaleString('vi-VN')}đ` : value;

  return (
    <div className="admin-shell p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{displayValue}</p>
        </div>

        {percentage !== undefined && (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              percentageType === 'increase' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
}
