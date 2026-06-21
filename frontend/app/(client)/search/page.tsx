'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Product {
  product_id: number;
  product_name: string;
  price: string;
  priceAfterDiscount: string;
  image: string;
  quantity: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('s') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    }
  }, [query, sortOrder, page]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/search?s=${encodeURIComponent(query)}&page=${page}&sortOrder=${sortOrder}`);
      if (res.data.success) {
        setProducts(res.data.products || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Lỗi tìm kiếm:', error);
      toast.error('Không thể tìm kiếm sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: number) => {
    if (!localStorage.getItem('token')) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      const returnUrl = window.location.pathname + window.location.search;
      sessionStorage.setItem('postAuthReturnUrl', returnUrl);
      window.location.href = '/account/login?return=' + encodeURIComponent(returnUrl);
      return;
    }

    try {
      const res = await api.post('/cart/add', { productId, quantity: 1 });
      if (res.data.success) {
        toast.success('Đã thêm vào giỏ hàng!');
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      toast.error('Thêm vào giỏ hàng thất bại');
    }
  };

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl mb-4">Vui lòng nhập từ khóa tìm kiếm</h1>
        <Link href="/" className="text-yellow-600 hover:underline">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-yellow-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Tìm kiếm: "{query}"</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">
          Kết quả tìm kiếm: <span className="text-yellow-600">{total}</span> sản phẩm
        </h1>

        {/* Sắp xếp */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <option value="">Mặc định</option>
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
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl text-gray-600 mb-4">Không tìm thấy sản phẩm nào</h2>
          <p className="text-gray-500 mb-6">Thử tìm kiếm với từ khóa khác nhé!</p>
          <Link href="/" className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">
            Về trang chủ
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const price = parseInt(product.price);
              const finalPrice = parseInt(product.priceAfterDiscount);
              const isInStock = parseInt(product.quantity) > 0;

              return (
                <div key={product.product_id} className="border rounded-lg p-4 hover:shadow-lg transition bg-white">
                  <Link href={`/products/${product.product_id}`}>
                    <img
                      src={product.image || '/images/default.png'}
                      alt={product.product_name}
                      className="w-full h-48 object-cover mb-4 rounded"
                    />
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {product.product_name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {finalPrice < price ? (
                        <>
                          <span className="text-red-600 font-bold text-xl">
                            {finalPrice.toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-gray-400 line-through text-sm">
                            {price.toLocaleString('vi-VN')}đ
                          </span>
                        </>
                      ) : (
                        <span className="text-red-600 font-bold text-xl">
                          {price.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                    {!isInStock && (
                      <span className="text-red-500 text-sm">Hết hàng</span>
                    )}
                  </Link>
                  {isInStock && (
                    <button
                      onClick={() => addToCart(product.product_id)}
                      className="mt-4 w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition"
                    >
                      Thêm vào giỏ
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                ← Trước
              </button>
              <span className="px-4 py-2">
                Trang {page} / {totalPages}
              </span>
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  );
}
