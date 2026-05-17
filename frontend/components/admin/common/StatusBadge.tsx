// components/admin/common/StatusBadge.tsx
'use client';

interface StatusBadgeProps {
  status: string;
  type: 'order' | 'user' | 'product';
}

const orderStatusMap: Record<string, { text: string; className: string }> = {
  '1': { text: 'Chờ xử lý', className: 'badge-light-warning' },
  '2': { text: 'Đang xử lý', className: 'badge-light-info' },
  '3': { text: 'Hoàn thành', className: 'badge-light-success' },
  '4': { text: 'Đã hủy', className: 'badge-light-danger' },
  '0': { text: 'Đã hủy', className: 'badge-light-danger' },
};

const userStatusMap: Record<string, { text: string; className: string }> = {
  '1': { text: 'Đang hoạt động', className: 'badge-light-success' },
  '0': { text: 'Không hoạt động', className: 'badge-light-danger' },
};

const productStatusMap: Record<string, { text: string; className: string }> = {
  '1': { text: 'Đang hoạt động', className: 'badge-light-success' },
  '0': { text: 'Đã xóa', className: 'badge-light-danger' },
};

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  let config: { text: string; className: string };
  
  if (type === 'order') {
    config = orderStatusMap[status] || { text: 'Không xác định', className: 'badge-light-secondary' };
  } else if (type === 'user') {
    config = userStatusMap[status] || { text: 'Không xác định', className: 'badge-light-secondary' };
  } else {
    config = productStatusMap[status] || { text: 'Không xác định', className: 'badge-light-secondary' };
  }
  
  return (
    <span className={`badge py-3 px-4 fs-7 ${config.className}`}>
      {config.text}
    </span>
  );
}