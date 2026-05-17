'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';
import { removeWishlistItem } from '@/lib/wishlist';

interface WishlistItem {
  wishlist_id: number;
  product_id: number;
  product_name: string;
  image: string;
  price: number;
  quantity: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/account/login?return=/wishlist');
      return;
    }

    api.get('/wishlist')
      .then((res) => {
        if (res.data.success) {
          setItems(res.data.data || []);
        }
      })
      .catch(() => toast.error('Không thể tải danh sách yêu thích'))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId: number) => {
    try {
      await removeWishlistItem(productId);
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
      toast.success('Đã xóa khỏi yêu thích');
    } catch {
      toast.error('Không thể xóa khỏi yêu thích');
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-center">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-yellow-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Yêu thích</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Sản phẩm yêu thích</h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <p className="text-gray-500 mb-4">Bạn chưa có sản phẩm yêu thích nào.</p>
          <Link href="/products/laptop" className="inline-flex px-5 py-2.5 rounded-xl bg-blue-600 text-white">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.wishlist_id} className="bg-white rounded-2xl shadow p-4 border border-gray-100">
              <Link href={`/products/${item.product_id}`}>
                <img src={getMediaUrl(item.image, '/images/default.png')} alt={item.product_name} className="w-full h-56 object-cover rounded-xl" />
              </Link>
              <div className="mt-4">
                <Link href={`/products/${item.product_id}`} className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600">
                  {item.product_name}
                </Link>
                <p className="text-red-600 font-bold mt-2">{Number(item.price || 0).toLocaleString('vi-VN')}đ</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500">{Number(item.quantity || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}</span>
                  <button onClick={() => handleRemove(item.product_id)} className="text-sm px-3 py-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100">
                    Bỏ yêu thích
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
