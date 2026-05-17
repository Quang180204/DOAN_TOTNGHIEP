'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/admin/common/ConfirmModal';
import ActionMenu from '@/components/admin/common/ActionMenu';

interface Order {
  order_id: number;
  oder_date: string;
  total: number;
  status: string;
  order_note: string | null;
  OrderAddress?: {
    orderUsername: string;
    orderPhonenumber: string;
  };
  account?: {
    Name: string;
    Phone: string;
    Avatar?: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [trashCount, setTrashCount] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders', {
        params: { page: currentPage, search },
      });
      if (res.data.success) {
        setOrders(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTrashCount(res.data.trashCount || 0);
      }
    } catch {
      toast.error('Không thể tải danh sách đơn hàng');
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

  const updateStatus = async () => {
    if (!selectedOrder) return;
    try {
      await api.put(`/admin/orders/update-status/${selectedOrder.order_id}`, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công');
      fetchOrders();
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    } finally {
      setShowStatusModal(false);
      setSelectedOrder(null);
    }
  };

  const cancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      await api.put(`/admin/orders/cancel/${selectedOrder.order_id}`);
      toast.success('Đã hủy đơn hàng');
      fetchOrders();
    } catch {
      toast.error('Hủy đơn hàng thất bại');
    } finally {
      setShowCancelModal(false);
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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case '1':
        return <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600"><span className="mr-2 h-1.5 w-1.5 rounded-full bg-amber-500"></span>Chờ xử lý</span>;
      case '2':
        return <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600"><span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></span>Đang xử lý</span>;
      case '3':
        return <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600"><span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>Hoàn thành</span>;
      case '4':
      case '0':
        return <span className="inline-flex items-center rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600"><span className="mr-2 h-1.5 w-1.5 rounded-full bg-rose-500"></span>Đã hủy</span>;
      default:
        return <span className="inline-flex items-center rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"><span className="mr-2 h-1.5 w-1.5 rounded-full bg-slate-500"></span>Không rõ</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 fade-in">
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-inner">
            <i className="bi bi-receipt text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Đơn hàng</h1>
            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
              <Link href="/admin" className="cursor-pointer transition-colors hover:text-blue-600">Bảng điều khiển</Link>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-700">Quản lý đặt hàng</span>
            </div>
          </div>
        </div>

        <Link href="/admin/orders/trash" className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100">
          <i className="bi bi-trash"></i>
          Đơn đã hủy <span className="ml-1 rounded-full bg-rose-200 px-2 py-0.5 text-xs text-rose-700">{trashCount}</span>
        </Link>
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
              className="block w-full rounded-xl border border-gray-200 bg-white p-2.5 pl-11 text-sm text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
              placeholder="Tìm kiếm theo mã đơn, tên khách hàng..."
            />
          </form>
        </div>

        <div className="min-h-[400px] overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-5 font-semibold">Order ID</th>
                <th className="px-6 py-5 font-semibold">Khách hàng</th>
                <th className="px-6 py-5 text-center font-semibold">Số điện thoại</th>
                <th className="px-6 py-5 text-center font-semibold">Ngày đặt</th>
                <th className="px-6 py-5 text-right font-semibold">Tổng tiền</th>
                <th className="px-6 py-5 text-center font-semibold">Trạng thái</th>
                <th className="px-6 py-5 text-center font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.order_id} className="group transition-colors hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <Link href={`/admin/orders/${order.order_id}`} className="font-bold text-gray-700 transition-colors hover:text-blue-600">
                      #{order.order_id}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-indigo-200 bg-gradient-to-tr from-indigo-100 to-blue-50">
                        <img
                          src={getMediaUrl(order.account?.Avatar, '/images/default.png')}
                          alt={order.OrderAddress?.orderUsername || order.account?.Name || 'Khách hàng'}
                          className="h-full w-full object-cover"
                          onError={(e: any) => {
                            e.currentTarget.src = '/images/default.png';
                          }}
                        />
                      </div>
                      <span className="font-semibold text-gray-800">{order.OrderAddress?.orderUsername || order.account?.Name || 'Khách vãng lai'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-600">
                    {order.OrderAddress?.orderPhonenumber || order.account?.Phone || '---'}
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-500">{formatDate(order.oder_date)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 font-bold text-gray-900">{formatCurrency(order.total)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">{renderStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 text-center">
                    <ActionMenu
                      items={[
                        {
                          label: 'Xem chi tiết',
                          onClick: () => {
                            window.location.href = `/admin/orders/${order.order_id}`;
                          },
                        },
                        ...(order.status === '1'
                          ? [
                              {
                                label: 'Chuyển sang Đang xử lý',
                                onClick: () => {
                                  setSelectedOrder(order);
                                  setNewStatus('2');
                                  setShowStatusModal(true);
                                },
                              },
                            ]
                          : []),
                        ...(order.status === '2'
                          ? [
                              {
                                label: 'Chuyển sang Hoàn thành',
                                onClick: () => {
                                  setSelectedOrder(order);
                                  setNewStatus('3');
                                  setShowStatusModal(true);
                                },
                              },
                            ]
                          : []),
                        ...(order.status !== '0'
                          ? [
                              {
                                label: 'Hủy đơn hàng',
                                tone: 'danger' as const,
                                onClick: () => {
                                  setSelectedOrder(order);
                                  setShowCancelModal(true);
                                },
                              },
                            ]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-gray-100 bg-gray-50">
                        <i className="bi bi-receipt text-2xl text-gray-300"></i>
                      </div>
                      <p className="text-lg font-medium text-gray-500">Chưa có đơn hàng nào</p>
                      <p className="mt-1 text-sm text-gray-400">Đơn hàng mới sẽ xuất hiện ở đây.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-4">
            <span className="text-sm font-medium text-gray-500">
              Trang <span className="font-bold text-gray-700">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-transparent text-gray-600 transition-colors hover:border-gray-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-gray-200 bg-transparent text-gray-600 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-transparent text-gray-600 transition-colors hover:border-gray-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showStatusModal}
        title="Chuyển trạng thái đơn hàng"
        message={`Bạn có chắc chắn muốn chuyển đơn hàng <strong>#${selectedOrder?.order_id}</strong> sang trạng thái <strong class="text-sky-600">${newStatus === '2' ? 'Đang xử lý' : 'Hoàn thành'}</strong>?`}
        type="warning"
        onConfirm={updateStatus}
        onCancel={() => setShowStatusModal(false)}
      />

      <ConfirmModal
        isOpen={showCancelModal}
        title="Hủy đơn hàng"
        message={`Bạn có chắc chắn muốn hủy đơn hàng <strong>#${selectedOrder?.order_id}</strong>? Khách hàng sẽ nhận được thông báo hủy đơn.`}
        type="danger"
        onConfirm={cancelOrder}
        onCancel={() => setShowCancelModal(false)}
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
