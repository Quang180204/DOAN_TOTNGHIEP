'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AccountSidebar from '@/components/client/account/Sidebar';
import { CheckCircleIcon, ClockIcon, EyeIcon, TruckIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Order {
  order_id: number;
  oder_date: string;
  total: number;
  status: string;
  statusText: string;
  order_note: string | null;
  isOrphan: boolean;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/account/login?return=/orders');
      return;
    }
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/orders?page=${page}&size=10`);
      if (res.data.success) {
        const formattedOrders = res.data.data.map((order: any) => ({
          ...order,
          statusText: getStatusText(order.status),
          oder_date: new Date(order.oder_date).toLocaleString('vi-VN')
        }));
        setOrders(formattedOrders);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      toast.error('Không thể tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case '1':
        return 'Đang xử lý';
      case '2':
        return 'Đang giao hàng';
      case '3':
        return 'Hoàn thành';
      case '0':
        return 'Đã hủy';
      default:
        return 'Chờ xử lý';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '1':
        return <ClockIcon className="h-5 w-5" />;
      case '2':
        return <TruckIcon className="h-5 w-5" />;
      case '3':
        return <CheckCircleIcon className="h-5 w-5" />;
      case '0':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case '1':
        return 'bg-amber-50 text-amber-700';
      case '2':
        return 'bg-blue-50 text-blue-700';
      case '3':
        return 'bg-emerald-50 text-emerald-700';
      case '0':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) {
    return <div className="container-custom py-24 text-center text-slate-500">Đang tải đơn hàng...</div>;
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Lịch sử đơn hàng</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
        <AccountSidebar />

        <section className="surface-card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5">
            <h1 className="text-2xl font-semibold text-slate-900">Lịch sử đơn hàng</h1>
            <p className="mt-2 text-sm text-slate-500">Theo dõi trạng thái, xem chi tiết và kiểm tra các đơn đã đặt.</p>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-xl font-semibold text-slate-900">Bạn chưa có đơn hàng nào</p>
              <p className="mt-3 text-sm text-slate-500">Mua sắm xong, lịch sử đơn sẽ hiện ở đây.</p>
              <Link href="/products/laptop" className="btn-primary mt-6">
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => (
                <div key={order.order_id} className="grid gap-5 px-6 py-6 xl:grid-cols-[1fr,auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${statusClass(order.status)}`}>
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">Đơn hàng #{order.order_id}</p>
                        <p className="text-sm text-slate-500">Ngày đặt: {order.oder_date}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
                        {order.statusText}
                      </span>
                      {order.isOrphan && <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">Thiếu dữ liệu chi tiết</span>}
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                      {order.order_note || 'Không có ghi chú cho đơn hàng này.'}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 xl:items-end">
                    <p className="text-2xl font-semibold text-slate-900">{Number(order.total || 0).toLocaleString('vi-VN')}đ</p>
                    <Link href={`/orders/${order.order_id}`} className="btn-secondary">
                      <EyeIcon className="mr-2 h-4 w-4" />
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-sm text-slate-600">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
