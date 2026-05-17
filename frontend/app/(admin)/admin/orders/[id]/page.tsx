'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  BanknotesIcon,
  TruckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import StatusBadge from '@/components/admin/common/StatusBadge';
import ConfirmModal from '@/components/admin/common/ConfirmModal';
import { getMediaUrl } from '@/lib/media';

interface OrderDetail {
  order_id: number;
  oder_date: string;
  total: number;
  status: string;
  order_note: string | null;
  paymentDisplayName: string;
  paymentCode: string;
  goodsSubtotal: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
  isOrphan: boolean;
  delivery?: { delivery_name: string };
  account?: { Name: string; email: string; Phone: string; Avatar?: string };
  OrderAddress?: {
    orderUsername: string;
    orderPhonenumber: string;
    content: string;
    Wards?: { type: string; ward_name: string };
    Districts?: { type: string; district_name: string };
    Provinces?: { province_name: string };
  };
  OrderDetails: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    image: string | null;
  }>;
}

const infoRowClass = 'flex items-start justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-b-0';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('2');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/admin/orders/${params.id}`);
        if (res.data.success) {
          setOrder(res.data.data);
        } else {
          toast.error('Không tìm thấy đơn hàng');
        }
      } catch {
        toast.error('Không thể tải chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  const refreshOrder = async (orderId: number) => {
    const res = await api.get(`/admin/orders/${orderId}`);
    if (res.data.success) {
      setOrder(res.data.data);
    }
  };

  const updateStatus = async () => {
    if (!order) return;

    try {
      await api.put(`/admin/orders/update-status/${order.order_id}`, { status: newStatus });
      await refreshOrder(order.order_id);
      toast.success('Cập nhật trạng thái thành công');
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    } finally {
      setShowStatusModal(false);
    }
  };

  const cancelOrder = async () => {
    if (!order) return;

    try {
      await api.put(`/admin/orders/cancel/${order.order_id}`);
      toast.success('Đã hủy đơn hàng');
      router.push('/admin/orders');
    } catch {
      toast.error('Hủy đơn hàng thất bại');
    } finally {
      setShowCancelModal(false);
    }
  };

  const formatCurrency = (amount: number) => `${(amount || 0).toLocaleString('vi-VN')}đ`;
  const formatDate = (date: string) => new Date(date).toLocaleString('vi-VN');

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600" />
      </div>
    );
  }

  if (!order) return null;

  const fullAddress = [
    order.OrderAddress?.content,
    order.OrderAddress?.Wards ? `${order.OrderAddress.Wards.type} ${order.OrderAddress.Wards.ward_name}` : '',
    order.OrderAddress?.Districts ? `${order.OrderAddress.Districts.type} ${order.OrderAddress.Districts.district_name}` : '',
    order.OrderAddress?.Provinces?.province_name,
  ]
    .filter(Boolean)
    .join(', ');

  const customerAvatar = getMediaUrl(order.account?.Avatar, '/images/default.png');

  return (
    <div className="space-y-6">
      <div className="admin-shell flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-slate-500">
            <Link href="/admin" className="hover:text-sky-700">
              Bảng điều khiển
            </Link>
            <span className="mx-2">/</span>
            <Link href="/admin/orders" className="hover:text-sky-700">
              Đơn hàng
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900">#{order.order_id}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Chi tiết đơn hàng #{order.order_id}</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái, thông tin khách hàng và toàn bộ sản phẩm trong đơn.</p>
        </div>

        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-sky-200 hover:text-sky-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Quay lại
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className="admin-shell p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <BanknotesIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Thông tin đơn hàng</h2>
              <p className="text-sm text-slate-500">Tổng quan giao dịch và vận chuyển.</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className={infoRowClass}>
              <span className="text-slate-500">Ngày đặt</span>
              <span className="text-right font-medium text-slate-900">{formatDate(order.oder_date)}</span>
            </div>
            <div className={infoRowClass}>
              <span className="text-slate-500">Phương thức thanh toán</span>
              <span className="text-right font-medium text-slate-900">{order.paymentDisplayName || '---'}</span>
            </div>
            <div className={infoRowClass}>
              <span className="text-slate-500">Đơn vị vận chuyển</span>
              <span className="text-right font-medium text-slate-900">{order.delivery?.delivery_name || '---'}</span>
            </div>
            <div className={infoRowClass}>
              <span className="text-slate-500">Trạng thái</span>
              <div className="shrink-0">
                <StatusBadge status={order.status} type="order" />
              </div>
            </div>
            {order.order_note && (
              <div className={infoRowClass}>
                <span className="text-slate-500">Ghi chú</span>
                <span className="max-w-[70%] text-right font-medium text-slate-900">{order.order_note}</span>
              </div>
            )}
          </div>
        </section>

        <section className="admin-shell p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <UserCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Thông tin khách hàng</h2>
              <p className="text-sm text-slate-500">Ảnh đại diện, liên hệ và địa chỉ nhận hàng.</p>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-4 rounded-3xl bg-slate-50 px-4 py-4">
            <img
              src={customerAvatar}
              alt={order.OrderAddress?.orderUsername || order.account?.Name || 'Khách hàng'}
              className="h-16 w-16 rounded-2xl object-cover"
              onError={(event) => {
                event.currentTarget.src = '/images/default.png';
              }}
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900">{order.OrderAddress?.orderUsername || order.account?.Name || '---'}</p>
              <p className="truncate text-sm text-slate-500">{order.account?.email || '---'}</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className={infoRowClass}>
              <span className="text-slate-500">Số điện thoại</span>
              <span className="text-right font-medium text-slate-900">{order.OrderAddress?.orderPhonenumber || order.account?.Phone || '---'}</span>
            </div>
            <div className={infoRowClass}>
              <span className="text-slate-500">Địa chỉ</span>
              <span className="max-w-[70%] text-right font-medium text-slate-900">{fullAddress || '---'}</span>
            </div>
          </div>
        </section>
      </div>

      <section className="admin-shell overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <TruckIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Sản phẩm trong đơn</h2>
              <p className="text-sm text-slate-500">Danh sách hàng hóa và tổng hợp chi phí cuối đơn.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {order.isOrphan ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              Đơn hàng này đang thiếu chi tiết sản phẩm trong bảng <code>oder_detail</code>. Dữ liệu đầu đơn vẫn còn nhưng các dòng sản phẩm không đầy đủ.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                      <th className="pb-4 font-semibold">Sản phẩm</th>
                      <th className="pb-4 text-right font-semibold">Số lượng</th>
                      <th className="pb-4 text-right font-semibold">Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.OrderDetails.map((item) => (
                      <tr key={`${item.product_id}-${item.product_name}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={getMediaUrl(item.image, '/images/default.png')}
                              alt={item.product_name}
                              className="h-14 w-14 rounded-2xl object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">{item.product_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right font-medium text-slate-700">x{item.quantity}</td>
                        <td className="py-4 text-right font-medium text-slate-900">{formatCurrency(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-3xl bg-slate-50 px-5 py-5">
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-500">Đơn giá sản phẩm</span>
                  <span className="font-medium text-slate-900">{formatCurrency(order.goodsSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-500">Phí vận chuyển</span>
                  <span className="font-medium text-slate-900">{formatCurrency(order.shippingFee)}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-500">Giảm giá</span>
                  <span className="font-medium text-emerald-600">-{formatCurrency(order.discountAmount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-base font-semibold text-slate-900">Tổng cộng</span>
                  <span className="text-xl font-semibold text-rose-600">{formatCurrency(order.grandTotal)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {order.status !== '0' && order.status !== '4' && (
        <section className="admin-shell p-6">
          <h2 className="text-lg font-semibold text-slate-900">Cập nhật trạng thái</h2>
          <p className="mt-1 text-sm text-slate-500">Trạng thái sau khi đổi sẽ đồng bộ ngay sang tài khoản khách hàng.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {order.status === '1' && (
              <button
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={() => {
                  setNewStatus('2');
                  setShowStatusModal(true);
                }}
              >
                Chuyển sang Đang xử lý
              </button>
            )}
            {order.status === '2' && (
              <button
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                onClick={() => {
                  setNewStatus('3');
                  setShowStatusModal(true);
                }}
              >
                Chuyển sang Hoàn thành
              </button>
            )}
            <button
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700"
              onClick={() => setShowCancelModal(true)}
            >
              Hủy đơn hàng
            </button>
          </div>
        </section>
      )}

      <ConfirmModal
        isOpen={showStatusModal}
        title="Xác nhận chuyển trạng thái?"
        message={`Chuyển đơn hàng #${order.order_id} sang <span class="text-primary">${newStatus === '2' ? 'Đang xử lý' : 'Hoàn thành'}</span>?`}
        type="warning"
        onConfirm={updateStatus}
        onCancel={() => setShowStatusModal(false)}
      />

      <ConfirmModal
        isOpen={showCancelModal}
        title="Xác nhận hủy đơn hàng?"
        message={`Hủy đơn hàng #${order.order_id}? Hành động này không thể hoàn tác.`}
        type="danger"
        onConfirm={cancelOrder}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
