'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ProductCard from '@/components/client/common/ProductCard';

interface Product {
  product_id: number;
  product_name: string;
  price: string;
  priceAfterDiscount: string;
  image: string;
  quantity: string;
  avgRating?: number;
}

export default function AccessoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/accessories?page=${page}&sortOrder=${sortOrder}`);
        if (res.data.success) {
          setProducts(res.data.products || []);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch {
        toast.error('Không thể tải danh sách phụ kiện');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sortOrder, page]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-yellow-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Phụ kiện</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">
          Phụ kiện <span className="text-yellow-600">({total} sản phẩm)</span>
        </h1>

        <select
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <option value="">Mặc định</option>
          <option value="popular">Bán chạy</option>
          <option value="price_asc">Giá: Thấp → Cao</option>
          <option value="price_desc">Giá: Cao → Thấp</option>
          <option value="name_asc">Tên: A → Z</option>
          <option value="name_desc">Tên: Z → A</option>
          <option value="date_desc">Mới nhất</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Đang tải...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">Chưa có sản phẩm phụ kiện</h2>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                ← Trước
              </button>
              <span className="px-4 py-2">Trang {page} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
