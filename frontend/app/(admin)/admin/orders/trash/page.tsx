'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/admin/common/ConfirmModal';
import ActionMenu from '@/components/admin/common/ActionMenu';
import { getMediaUrl } from '@/lib/media';

interface CancelledOrder {
  order_id: number;
  oder_date: string;
  total: number;
  status: string;
  order_note: string | null;
  OrderAddress?: { orderUsername: string; orderPhonenumber: string };
  account?: { Name: string; email: string; Avatar?: string };
}

export default function OrdersTrashPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<CancelledOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CancelledOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders/trash', { params: { page: currentPage, search } });
      if (res.data.success) {
        setOrders(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      toast.error('Không thể tải danh sách đơn hàng đã hủy');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    try {
      await api.delete(`/admin/orders/delete/${selectedOrder.order_id}`);
      toast.success('Đã xóa vĩnh viễn đơn hàng');
      fetchOrders();
    } catch {
      toast.error('Xóa đơn hàng thất bại');
    } finally {
      setShowDeleteModal(false);
      setSelectedOrder(null);
    }
  };

  const formatCurrency = (amount: number) => `${(amount || 0).toLocaleString('vi-VN')}đ`;
  const formatDate = (date: string) => {
    if (!date) return '---';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 fade-in">
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-inner">
            <i className="bi bi-x-circle text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Đơn đã hủy</h1>
            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
              <span onClick={() => router.push('/admin/orders')} className="cursor-pointer transition-colors hover:text-blue-600">Đơn hàng</span>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-700">Đã hủy</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/admin/orders')}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
        >
          <i className="bi bi-arrow-left"></i> Quay lại
        </button>
      </div>

      <div className="overflow-visible rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 rounded-t-2xl border-b border-gray-100 bg-gray-50/50 p-6 sm:flex-row">
          <form onSubmit={handleSearch} className="relative w-full sm:w-96">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <i className="bi bi-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 bg-white p-2.5 pl-11 text-sm text-gray-900 shadow-sm transition-all focus:border-rose-500 focus:ring-rose-500"
              placeholder="Tìm theo mã đơn hàng..."
            />
          </form>
          <span className="text-sm font-medium text-gray-500">
            Tổng cộng: <span className="font-bold text-gray-900">{orders.length}</span> đơn hàng đã hủy
          </span>
        </div>

        <div className="min-h-[400px] overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-rose-50/60 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-5 font-semibold">Mã đơn</th>
                <th className="px-6 py-5 font-semibold">Khách hàng</th>
                <th className="px-6 py-5 text-center font-semibold">Ngày hủy</th>
                <th className="px-6 py-5 text-right font-semibold">Tổng tiền</th>
                <th className="px-6 py-5 text-center font-semibold">Ghi chú</th>
                <th className="px-6 py-5 text-center font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.order_id} className="group transition-colors hover:bg-rose-50/20">
                  <td className="px-6 py-4">
                    <span className="font-bold text-rose-600">#{order.order_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-rose-200 bg-rose-100 shadow-sm">
                        <img
                          src={getMediaUrl(order.account?.Avatar, '/images/default.png')}
                          alt={order.OrderAddress?.orderUsername || order.account?.Name || 'Khách hàng'}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = '/images/default.png';
                          }}
                        />
                      </div>
                      <div>
                        <span className="block font-semibold text-gray-800">{order.OrderAddress?.orderUsername || order.account?.Name || 'Khách vãng lai'}</span>
                        {order.OrderAddress?.orderPhonenumber && <span className="text-xs text-gray-500">{order.OrderAddress.orderPhonenumber}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-500">{formatDate(order.oder_date)}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="px-6 py-4 text-center">
                    {order.order_note ? (
                      <span className="mx-auto line-clamp-1 max-w-[200px] text-xs italic text-gray-600" title={order.order_note}>
                        "{order.order_note}"
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ActionMenu
                      items={[
                        {
                          label: 'Xem chi tiết',
                          onClick: () => {
                            window.location.href = `/admin/orders/${order.order_id}`;
                          },
                        },
                        {
                          label: 'Xóa vĩnh viễn',
                          tone: 'danger',
                          onClick: () => {
                            setSelectedOrder(order);
                            setShowDeleteModal(true);
                          },
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-rose-100 bg-rose-50">
                        <i className="bi bi-check-circle text-2xl text-rose-300"></i>
                      </div>
                      <p className="text-lg font-medium text-gray-500">Không có đơn hàng nào bị hủy</p>
                      <p className="mt-1 text-sm text-gray-400">Tất cả đơn hàng đang hoạt động bình thường.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-4 rounded-b-2xl">
            <span className="text-sm font-medium text-gray-500">
              Trang <span className="font-bold text-gray-700">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-transparent text-gray-600 transition-colors hover:border-gray-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
                <i className="bi bi-chevron-left"></i>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                }
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${currentPage === pageNum ? 'border-rose-500 bg-rose-500 text-white shadow-sm' : 'border-gray-200 bg-transparent text-gray-600 hover:border-gray-300 hover:bg-white'}`}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-transparent text-gray-600 transition-colors hover:border-gray-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Xác nhận xóa vĩnh viễn?"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng <strong>#${selectedOrder?.order_id}</strong>? Hành động này không thể hoàn tác.`}
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
