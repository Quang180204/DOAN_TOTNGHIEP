'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { TrashIcon } from '@heroicons/react/24/outline';
import { getMediaUrl } from '@/lib/media';

interface CartItem {
  product: {
    product_id: number;
    product_name: string;
    price: string;
    priceAfterDiscount: number;
    image: string;
    discount: any;
  };
  quantity: number;
  itemTotal: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const shippingFee = 30000;

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart/view');
      if (res.data.success) {
        const items = res.data.products || [];
        setCartItems(items);
        setSelectedIds(items.map((item: CartItem) => item.product.product_id));
      }
    } catch {
      toast.error('Không thể tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await api.put('/cart/update', { productId, quantity: newQuantity });
      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch {
      toast.error('Cập nhật số lượng thất bại');
    }
  };

  const removeItem = async (productId: number) => {
    try {
      await api.delete(`/cart/remove/${productId}`);
      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Đã xóa sản phẩm khỏi giỏ');
    } catch {
      toast.error('Xóa sản phẩm thất bại');
    }
  };

  const toggleSelected = (productId: number) => {
    setSelectedIds((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(cartItems.map((item) => item.product.product_id));
  };

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedIds.includes(item.product.product_id)),
    [cartItems, selectedIds]
  );

  const subtotal = selectedItems.reduce((sum, item) => sum + item.itemTotal, 0);
  const finalTotal = subtotal > 0 ? subtotal + shippingFee : 0;

  if (loading) {
    return <div className="container-custom py-24 text-center text-slate-500">Đang tải giỏ hàng...</div>;
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Giỏ hàng</span>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-heading">Giỏ hàng của bạn</h1>
          <p className="section-copy">Chọn đúng sản phẩm cần thanh toán, phần còn lại vẫn giữ nguyên trong giỏ.</p>
        </div>
        <span className="badge-muted">{cartItems.length} sản phẩm</span>
      </div>

      {cartItems.length === 0 ? (
        <div className="surface-card px-6 py-16 text-center">
          <p className="text-2xl font-semibold text-slate-900">Giỏ hàng đang trống</p>
          <p className="mt-3 text-sm text-slate-500">Thêm sản phẩm trước khi sang bước thanh toán.</p>
          <Link href="/" className="btn-primary mt-6">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1.45fr,0.75fr]">
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedIds.length === cartItems.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Chọn tất cả
              </label>
              <p className="text-sm text-slate-500">Chỉ các sản phẩm được chọn mới sang bước thanh toán</p>
            </div>

            <div className="divide-y divide-slate-100">
              {cartItems.map((item) => {
                const productId = item.product.product_id;
                const originalPrice = parseInt(item.product.price || '0', 10);
                const finalPrice = Number(item.product.priceAfterDiscount || 0);
                const selected = selectedIds.includes(productId);

                return (
                  <div key={productId} className="grid gap-4 px-5 py-5 md:grid-cols-[auto,120px,1fr,160px,110px,40px] md:items-center">
                    <label className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelected(productId)}
                        className="h-5 w-5 rounded-full border-slate-300 text-slate-900"
                      />
                    </label>

                    <img
                      src={getMediaUrl(item.product.image, '/images/default.png')}
                      alt={item.product.product_name}
                      className="h-24 w-24 rounded-2xl object-cover bg-slate-100"
                    />

                    <div className="min-w-0">
                      <Link href={`/products/${productId}`} className="line-clamp-2 text-base font-semibold text-slate-900 hover:text-slate-700">
                        {item.product.product_name}
                      </Link>
                      <div className="mt-3 flex items-center gap-3 text-sm">
                        <span className="font-semibold text-slate-900">{finalPrice.toLocaleString('vi-VN')}đ</span>
                        {originalPrice > finalPrice && <span className="text-slate-400 line-through">{originalPrice.toLocaleString('vi-VN')}đ</span>}
                      </div>
                    </div>

                    <div className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-2">
                      <button onClick={() => updateQuantity(productId, item.quantity - 1)} className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100">
                        -
                      </button>
                      <span className="text-sm font-medium text-slate-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(productId, item.quantity + 1)} className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100">
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-500">Thành tiền</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{item.itemTotal.toLocaleString('vi-VN')}đ</p>
                    </div>

                    <button onClick={() => removeItem(productId)} className="text-slate-400 transition hover:text-red-500">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="surface-card h-fit p-6">
            <h2 className="text-lg font-semibold text-slate-900">Tóm tắt thanh toán</h2>
            <div className="mt-5 space-y-3 border-b border-slate-100 pb-5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Sản phẩm đã chọn</span>
                <span>{selectedItems.length}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Đơn giá sản phẩm</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span>{selectedItems.length > 0 ? shippingFee.toLocaleString('vi-VN') : 0}đ</span>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-sm text-slate-500">Tổng cộng</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{finalTotal.toLocaleString('vi-VN')}đ</p>
              </div>
              <span className="badge-muted">{selectedIds.length} đã chọn</span>
            </div>

            <Link
              href={selectedIds.length > 0 ? `/checkout?items=${selectedIds.join(',')}` : '#'}
              onClick={(e) => {
                if (selectedIds.length === 0) {
                  e.preventDefault();
                  toast.error('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
                }
              }}
              className="btn-primary mt-6 flex w-full"
            >
              Tiến hành thanh toán
            </Link>
            <Link href="/" className="btn-secondary mt-3 flex w-full">
              Tiếp tục mua sắm
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
