'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getMediaUrl } from '@/lib/media';
import { ShoppingCartIcon, HeartIcon, EyeIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { isWishlisted, toggleWishlist } from '@/lib/wishlist';

interface ProductCardProps {
  product: {
    product_id: number;
    product_name: string;
    price: string;
    priceAfterDiscount: string;
    image: string;
    quantity: string;
    avgRating?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const price = Number(product.price || 0);
  const finalPrice = Number(product.priceAfterDiscount || product.price || 0);
  const isInStock = Number(product.quantity || 0) > 0;
  const discountPercent = price > 0 ? Math.round(((price - finalPrice) / price) * 100) : 0;

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isInStock) return;

    try {
      const res = await api.post('/cart/add', { productId: product.product_id, quantity: 1 });
      if (res.data.success) {
        toast.success('Đã thêm vào giỏ hàng');
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch {
      toast.error('Thêm vào giỏ hàng thất bại');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setWishlisted(false);
      return;
    }

    isWishlisted(product.product_id).then(setWishlisted);
  }, [product.product_id]);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!localStorage.getItem('token')) {
      toast.error('Vui lòng đăng nhập để thêm yêu thích');
      window.location.href = '/account/login?return=' + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      const result = await toggleWishlist(product.product_id);
      const added = result?.action === 'added';
      setWishlisted(added);
      toast.success(added ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật yêu thích');
    }
  };

  return (
    <div className="group surface-card overflow-hidden rounded-[26px]">
      <Link href={`/products/${product.product_id}`} className="block">
        <div className="relative aspect-[4/4.15] overflow-hidden bg-gradient-to-br from-slate-100 via-cyan-50 to-indigo-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.18),transparent_35%)]" />
          <img
            src={getMediaUrl(product.image, '/images/default.png')}
            alt={product.product_name}
            className="relative z-10 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = '/images/default.png';
            }}
          />

          <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
            {finalPrice < price ? (
              <span className="rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-1 text-xs font-semibold text-white shadow-[0_10px_20px_-10px_rgba(236,72,153,0.8)]">
                Giảm {discountPercent}%
              </span>
            ) : (
              <span />
            )}

            <button
              onClick={handleToggleWishlist}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/80 text-slate-700 shadow-sm backdrop-blur-xl transition hover:text-rose-500"
            >
              {wishlisted ? <HeartSolidIcon className="h-5 w-5 text-rose-500" /> : <HeartIcon className="h-5 w-5" />}
            </button>
          </div>

          {!isInStock && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/42 backdrop-blur-[2px]">
              <span className="rounded-full border border-white/70 bg-white/12 px-4 py-2 text-sm font-semibold text-white">
                Tạm hết hàng
              </span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 z-20 flex translate-y-4 items-center justify-between gap-2 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button onClick={addToCart} disabled={!isInStock} className="btn-primary h-11 flex-1 rounded-xl px-4 py-0">
              <ShoppingCartIcon className="mr-2 h-4 w-4" />
              Thêm vào giỏ
            </button>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/50 bg-white/82 text-slate-700 shadow-sm backdrop-blur-xl">
              <EyeIcon className="h-5 w-5" />
            </span>
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) =>
              star <= Math.round(product.avgRating || 0) ? (
                <StarSolidIcon key={star} className="h-4 w-4" />
              ) : (
                <StarIcon key={star} className="h-4 w-4" />
              )
            )}
            <span className="ml-2 text-xs font-medium text-slate-500">({product.avgRating || 0})</span>
          </div>

          <Link href={`/products/${product.product_id}`}>
            <h3 className="line-clamp-2 min-h-[48px] text-base font-semibold leading-6 text-slate-900 transition group-hover:text-sky-700">
              {product.product_name}
            </h3>
          </Link>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-lg font-semibold text-slate-900">{finalPrice.toLocaleString('vi-VN')}đ</p>
            {finalPrice < price && <p className="text-sm text-slate-400 line-through">{price.toLocaleString('vi-VN')}đ</p>}
          </div>

          <span className={`badge-muted ${isInStock ? 'text-cyan-700' : 'text-slate-500'}`}>
            {isInStock ? 'Sẵn hàng' : 'Hết hàng'}
          </span>
        </div>
      </div>
    </div>
  );
}
