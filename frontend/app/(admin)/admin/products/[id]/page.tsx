'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ProductDetail {
  product_id: number;
  product_name: string;
  price: number;
  quantity: string;
  image: string;
  specifications: string;
  description: string;
  view: number;
  buyturn: number;
  status: string;
  create_at: string;
  genre: { genre_name: string };
  brand: { brand_name: string };
  discount: { discount_name: string; discount_price: number };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/admin/products/${params.id}`);
        if (res.data.success) {
          setProduct(res.data.data);
        } else {
          toast.error('Không tìm thấy sản phẩm');
        }
      } catch (error) {
        toast.error('Không thể tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.id]);

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('vi-VN') + '₫';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Chi tiết sản phẩm</h1>
          <p className="text-gray-500 font-medium">Xem toàn bộ thông tin về sản phẩm #{product.product_id}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
            <i className="bi bi-arrow-left"></i> Quay lại
          </button>
          <Link href={`/admin/products/edit/${product.product_id}`} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
            <i className="bi bi-pencil"></i> Chỉnh sửa
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-gray-200/50">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mb-6">
              <img src={product.image || '/default-product.png'} alt={product.product_name} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 block">Tên sản phẩm</span>
                <h2 className="text-xl font-bold text-gray-900">{product.product_name}</h2>
              </div>
              <div className="flex justify-between py-3 border-y border-gray-50">
                <span className="text-gray-500 font-medium">Giá bán</span>
                <span className="text-blue-600 font-black text-lg">{formatCurrency(product.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Tồn kho</span>
                <span className="text-gray-900 font-bold">{product.quantity} sản phẩm</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="bi bi-graph-up text-blue-500"></i> Thống kê
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                <span className="text-xs font-bold text-blue-600 uppercase block mb-1">Lượt xem</span>
                <span className="text-2xl font-black text-blue-700">{product.view || 0}</span>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                <span className="text-xs font-bold text-indigo-600 uppercase block mb-1">Lượt mua</span>
                <span className="text-2xl font-black text-indigo-700">{product.buyturn || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-xl shadow-gray-200/50">
            <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Thông tin chi tiết</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 block">Danh mục</span>
                <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm">{product.genre?.genre_name || '---'}</span>
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 block">Thương hiệu</span>
                <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm">{product.brand?.brand_name || '---'}</span>
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 block">Giảm giá áp dụng</span>
                <span className="text-gray-900 font-bold">{product.discount?.discount_name || 'Không có'}</span>
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 block">Trạng thái</span>
                <span className={`px-3 py-1 rounded-lg font-bold text-sm ${product.status === '1' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {product.status === '1' ? 'Đang kinh doanh' : 'Đã ngừng bán'}
                </span>
              </div>
            </div>

            <div className="mt-8">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Thông số kỹ thuật</span>
              <div className="bg-gray-50 rounded-2xl p-6 text-gray-700 whitespace-pre-line leading-relaxed border border-gray-100">
                {product.specifications || 'Chưa có thông số kỹ thuật.'}
              </div>
            </div>

            <div className="mt-8">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Mô tả sản phẩm</span>
              <div className="text-gray-600 leading-relaxed">
                {product.description || 'Chưa có mô tả cho sản phẩm này.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
