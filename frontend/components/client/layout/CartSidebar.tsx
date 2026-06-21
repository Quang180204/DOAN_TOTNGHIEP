'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';

interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  priceAfterDiscount: number;
  quantity: number;
  image: string;
  itemTotal: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCartUpdate: () => void;
}

export default function CartSidebar({ isOpen, onClose, onCartUpdate }: CartSidebarProps) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart/view');
      if (res.data.success) {
        const products = res.data.products || [];
        const formattedItems = products.map((item: any) => {
          const productData = item.product || item;
          return {
            product_id: item.product_id || productData.product_id,
            product_name: item.product_name || productData.product_name,
            price: Number(item.price || productData.price || 0),
            priceAfterDiscount: Number(
              item.priceAfterDiscount || productData.priceAfterDiscount || item.price || productData.price || 0
            ),
            quantity: Number(item.quantity || 1),
            image: item.image || productData.image || '/images/default.png',
            itemTotal: Number(item.itemTotal || 0)
          };
        });

        setCartItems(formattedItems);
        setSelectedIds((prev) => {
          const currentIds = formattedItems.map((item: CartItem) => item.product_id);
          const preserved = prev.filter((id) => currentIds.includes(id));
          return preserved.length > 0 ? preserved : currentIds;
        });
        setDiscount(Number(res.data.discount || 0));
        setTotal(Number(res.data.total || 0));
      }
    } catch (error) {
      console.error('CartSidebar fetchCart error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1) return;
    try {
      await api.put('/cart/update', { productId, quantity });
      await fetchCart();
      onCartUpdate();
    } catch (error) {
      console.error('CartSidebar updateQuantity error:', error);
    }
  };

  const removeItem = async (productId: number) => {
    try {
      await api.delete(`/cart/remove/${productId}`);
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
      await fetchCart();
      onCartUpdate();
    } catch (error) {
      console.error('CartSidebar removeItem error:', error);
    }
  };

  const toggleSelected = (productId: number) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const selectedItems = cartItems.filter((item) => selectedIds.includes(item.product_id));
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + item.itemTotal, 0);
  const selectedDiscount = selectedIds.length === cartItems.length ? discount : 0;
  const selectedTotal = selectedIds.length === cartItems.length ? total : selectedSubtotal;

  const formatPrice = (price: number | undefined | null): string => {
    if (!price && price !== 0) return '0đ';
    return `${price.toLocaleString('vi-VN')}đ`;
  };

  const handleCheckout = () => {
    if (selectedIds.length === 0) return;
    onClose();
    router.push(`/checkout?items=${selectedIds.join(',')}`);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Giỏ hàng ({cartItems.length})</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Đang tải...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-3">🛒</div>
              <p className="text-gray-500">Giỏ hàng trống</p>
              <button onClick={onClose} className="mt-4 text-blue-500 hover:text-blue-600 text-sm">
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={item.product_id || idx} className="flex gap-3 border-b pb-3">
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.product_id)}
                    onChange={() => toggleSelected(item.product_id)}
                    className="w-4 h-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <img
                  src={getMediaUrl(item.image, '/images/default.png')}
                  alt={item.product_name}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/default.png';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-sm line-clamp-2">{item.product_name}</h3>
                  <p className="text-red-600 font-bold text-sm mt-1">{formatPrice(item.priceAfterDiscount)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border rounded">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-gray-100 text-gray-600"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-sm min-w-[40px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-gray-100 text-gray-600"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t p-4 space-y-3 bg-gray-50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tạm tính:</span>
              <span className="font-semibold">{formatPrice(selectedSubtotal)}</span>
            </div>
            {selectedDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá:</span>
                <span>-{formatPrice(selectedDiscount)}</span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between text-base font-bold">
                <span>Tổng cộng:</span>
                <span className="text-red-600">{formatPrice(selectedTotal)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={selectedIds.length === 0}
              className="block w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center py-3 rounded-xl font-medium hover:shadow-lg transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thanh toán
            </button>
            <button onClick={onClose} className="block w-full text-center py-2 text-gray-500 hover:text-gray-700 text-sm">
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>
    </>
  );
}
