'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  image: string | null;
  genre_id?: number;
  disscount_id?: number;
  hasFeedback?: boolean;
  feedback?: {
    feedback_id: number;
    rate_star: number;
    content: string;
  } | null;
}

interface OrderDetail {
  order_id: number;
  oder_date: string;
  total: number;
  status: string;
  order_note: string | null;
  paymentDisplayName: string;
  goodsSubtotal: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
  isOrphan: boolean;
  orderAddress?: {
    orderUsername: string;
    orderPhonenumber: string;
    content: string;
    province_name?: string;
    district_name?: string;
    ward_name?: string;
  };
  OrderDetails: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(`/account/login?return=/orders/${id}`);
      return;
    }
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch {
      toast.error('Không thể tải thông tin đơn hàng');
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

  const formatCurrency = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  const openReview = (productId: number) => {
    setReviewProductId(productId);
    setRating(5);
    setHoverRating(0);
    setComment('');
  };

  const submitReview = async (item: OrderItem) => {
    if (!comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post('/products/comment', {
        productId: item.product_id,
        rateStar: rating,
        commentContent: comment,
        genreId: item.genre_id,
        discountId: item.disscount_id
      });
      toast.success('Đánh giá thành công');
      setReviewProductId(null);
      setComment('');
      await fetchOrderDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không gửi được đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="container-custom py-24 text-center text-slate-500">Đang tải chi tiết đơn hàng...</div>;
  }

  if (!order) {
    return (
      <div className="container-custom py-24 text-center">
        <h1 className="text-2xl font-semibold text-red-600">Không tìm thấy đơn hàng</h1>
        <Link href="/orders" className="btn-primary mt-6">
          Về lịch sử đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link href="/orders" className="hover:text-slate-900">Lịch sử đơn hàng</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Đơn hàng #{order.order_id}</span>
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        <section className="surface-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Đơn hàng #{order.order_id}</h1>
              <p className="mt-2 text-sm text-slate-500">Ngày đặt: {new Date(order.oder_date).toLocaleString('vi-VN')}</p>
            </div>
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusClass(order.status)}`}>{getStatusText(order.status)}</span>
          </div>
        </section>

        {order.isOrphan ? (
          <section className="surface-card border-red-100 bg-red-50 p-6 text-sm leading-6 text-red-700">
            Đơn hàng này đang thiếu dữ liệu chi tiết sản phẩm. Trạng thái và tổng tiền vẫn còn, nhưng phần sản phẩm không còn đầy đủ.
          </section>
        ) : (
          <section className="surface-card p-6">
            <h2 className="text-lg font-semibold text-slate-900">Sản phẩm trong đơn</h2>
            <div className="mt-5 space-y-4">
              {order.OrderDetails.map((item) => (
                <div key={`${item.product_id}-${item.product_name}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="grid gap-4 md:grid-cols-[96px,1fr,120px] md:items-center">
                    <img
                      src={getMediaUrl(item.image, '/images/default.png')}
                      alt={item.product_name}
                      className="h-24 w-24 rounded-2xl object-cover bg-slate-100"
                    />
                    <div>
                      <p className="text-base font-semibold text-slate-900">{item.product_name}</p>
                      <p className="mt-2 text-sm text-slate-500">Số lượng: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Đơn giá</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(item.price)}</p>
                    </div>
                  </div>

                  {order.status === '3' && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      {item.hasFeedback ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-emerald-700">Đã đánh giá</span>
                            <div className="flex text-amber-400">
                              {[1, 2, 3, 4, 5].map((star) =>
                                star <= Number(item.feedback?.rate_star || 0) ? (
                                  <StarSolidIcon key={star} className="h-4 w-4" />
                                ) : (
                                  <StarIcon key={star} className="h-4 w-4" />
                                )
                              )}
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{item.feedback?.content}</p>
                        </div>
                      ) : reviewProductId === item.product_id ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center gap-1 text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="focus:outline-none"
                              >
                                {(hoverRating || rating) >= star ? <StarSolidIcon className="h-6 w-6" /> : <StarIcon className="h-6 w-6" />}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                            rows={4}
                            className="input-modern h-auto min-h-[120px] resize-none"
                          />
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button onClick={() => submitReview(item)} disabled={submittingReview} className="btn-primary">
                              {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                            <button onClick={() => setReviewProductId(null)} className="btn-secondary">
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => openReview(item.product_id)} className="btn-secondary">
                          Đánh giá
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="surface-card p-6">
            <h2 className="text-lg font-semibold text-slate-900">Thông tin đơn hàng</h2>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between text-slate-600"><span>Mã đơn hàng</span><span className="text-slate-900">#{order.order_id}</span></div>
              <div className="flex justify-between text-slate-600"><span>Phương thức thanh toán</span><span className="text-slate-900">{order.paymentDisplayName || '---'}</span></div>
              <div className="flex justify-between text-slate-600"><span>Đơn giá sản phẩm</span><span className="text-slate-900">{formatCurrency(order.goodsSubtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Phí vận chuyển</span><span className="text-slate-900">{formatCurrency(order.shippingFee)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Giảm giá</span><span className="text-emerald-700">-{formatCurrency(order.discountAmount)}</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-4 text-base font-semibold text-slate-900">
                <span>Tổng cộng</span>
                <span>{formatCurrency(order.grandTotal)}</span>
              </div>
              {order.order_note && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">Ghi chú</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{order.order_note}</p>
                </div>
              )}
            </div>
          </section>

          {order.orderAddress && (
            <section className="surface-card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Địa chỉ giao hàng</h2>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between text-slate-600"><span>Họ tên</span><span className="text-slate-900">{order.orderAddress.orderUsername}</span></div>
                <div className="flex justify-between text-slate-600"><span>Số điện thoại</span><span className="text-slate-900">{order.orderAddress.orderPhonenumber}</span></div>
                <div>
                  <p className="text-slate-500">Địa chỉ</p>
                  <p className="mt-2 leading-6 text-slate-700">
                    {[order.orderAddress.content, order.orderAddress.ward_name, order.orderAddress.district_name, order.orderAddress.province_name]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/orders" className="btn-secondary">Về lịch sử đơn hàng</Link>
          <Link href="/" className="btn-primary">Tiếp tục mua sắm</Link>
        </div>
      </div>
    </div>
  );
}
