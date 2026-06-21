'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getMediaUrl } from '@/lib/media';

interface Brand {
  brand_id: number;
  brand_name: string;
}

interface Genre {
  genre_id: number;
  genre_name: string;
}

interface Discount {
  disscount_id: number;
  discount_name: string;
}

interface Product {
  genre?: { genre_name: string };
  brand?: { brand_name: string };
  discount?: { discount_name: string; discount_price: number };
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    product_name: '',
    price: '',
    quantity: '',
    genre_id: '',
    brand_id: '',
    disscount_id: '1',
    Type: '1',
    specifications: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsRes, genresRes, discountsRes, productRes] = await Promise.all([
          api.get('/admin/brands?size=100'),
          api.get('/admin/genres?size=100'),
          api.get('/admin/discounts?size=100'),
          api.get(`/admin/products/${params.id}`)
        ]);

        if (brandsRes.data.success) setBrands(brandsRes.data.data);
        if (genresRes.data.success) setGenres(genresRes.data.data);
        if (discountsRes.data.success) setDiscounts(discountsRes.data.data);
        
        if (productRes.data.success) {
          const p = productRes.data.data;
          setFormData({
            product_name: p.product_name || '',
            price: p.price?.toString() || '',
            quantity: p.quantity?.toString() || '',
            genre_id: p.genre_id?.toString() || '',
            brand_id: p.brand_id?.toString() || '',
            disscount_id: p.disscount_id?.toString() || '1',
            Type: p.Type?.toString() || '1',
            specifications: p.specifications || '',
            description: p.description || '',
            image: p.image || ''
          });
          setImagePreview(p.image || '');
        }
      } catch (error) {
        toast.error('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setFormData({ ...formData, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = {
        ...formData,
        Type: parseInt(formData.Type),
        price: parseFloat(formData.price),
        quantity: formData.quantity,
        genre_id: parseInt(formData.genre_id),
        brand_id: parseInt(formData.brand_id),
        disscount_id: parseInt(formData.disscount_id)
      };
      
      const res = await api.put(`/admin/products/edit/${params.id}`, submitData);
      if (res.data.success) {
        toast.success('Cập nhật sản phẩm thành công!');
        router.push('/admin/products');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Chỉnh sửa sản phẩm</h1>
          <p className="text-gray-500 font-medium">Cập nhật thông tin cho sản phẩm #{params.id}</p>
        </div>
        <button onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all">
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Hình ảnh đại diện</h3>
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 mb-4 flex items-center justify-center relative group">
              {imagePreview ? (
                <img
                  src={getMediaUrl(imagePreview)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = '/images/default.png';
                  }}
                />
              ) : (
                <div className="text-center">
                  <i className="bi bi-image text-4xl text-gray-300"></i>
                  <p className="text-xs text-gray-400 mt-2 font-medium">Chưa có ảnh</p>
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-gray-900">Thay đổi ảnh</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-center text-gray-400 font-medium italic">Click vào ảnh để thay đổi. Tối đa 5MB.</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Phân loại & Giá</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Giá bán (VNĐ)</label>
                <input 
                  type="number" 
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Số lượng tồn kho</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.quantity}
                  onChange={(e) => {
                    const quantity = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    setFormData({ ...formData, quantity });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Info Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
            <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              <i className="bi bi-info-circle text-blue-500"></i> Thông tin cơ bản
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Tên sản phẩm</label>
                <input 
                  type="text" 
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none font-bold text-lg"
                  placeholder="Nhập tên sản phẩm..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Danh mục</label>
                  <select 
                    value={formData.genre_id} 
                    onChange={(e) => setFormData({ ...formData, genre_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none font-medium"
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {genres.map(g => <option key={g.genre_id} value={g.genre_id}>{g.genre_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Thương hiệu</label>
                  <select 
                    value={formData.brand_id} 
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none font-medium"
                    required
                  >
                    <option value="">-- Chọn thương hiệu --</option>
                    {brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Giảm giá</label>
                  <select 
                    value={formData.disscount_id} 
                    onChange={(e) => setFormData({ ...formData, disscount_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none font-medium"
                  >
                    {discounts.map(d => <option key={d.disscount_id} value={d.disscount_id}>{d.discount_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Loại sản phẩm</label>
                  <select 
                    value={formData.Type} 
                    onChange={(e) => setFormData({ ...formData, Type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none font-medium"
                  >
                    <option value="1">Laptop</option>
                    <option value="2">Phụ kiện</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Thông số kỹ thuật</label>
                <textarea 
                  rows={6}
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none font-medium"
                  placeholder="Nhập thông số kỹ thuật (mỗi thông số 1 dòng)..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Mô tả sản phẩm</label>
                <textarea 
                  rows={8}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none font-medium"
                  placeholder="Mô tả chi tiết sản phẩm..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => router.back()}
                className="px-8 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="px-10 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle text-lg"></i>
                    Cập nhật sản phẩm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
