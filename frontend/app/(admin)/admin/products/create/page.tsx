'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CubeIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import api from '@/lib/api';

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

export default function CreateProductPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
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
    image: '',
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [brandsRes, genresRes, discountsRes] = await Promise.all([
          api.get('/admin/brands?size=100'),
          api.get('/admin/genres?size=100'),
          api.get('/admin/discounts?size=100'),
        ]);

        if (brandsRes.data.success) setBrands(brandsRes.data.data);
        if (genresRes.data.success) setGenres(genresRes.data.data);
        if (discountsRes.data.success) setDiscounts(discountsRes.data.data);
      } catch (error) {
        console.error('Lỗi tải dữ liệu form sản phẩm:', error);
        toast.error('Không thể tải dữ liệu danh mục sản phẩm');
      }
    };

    fetchOptions();
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateQuantity = (value: string) => {
    const normalizedValue = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    updateField('quantity', normalizedValue);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn đúng tệp hình ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    setImageFile(file);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_name || !formData.price || !formData.genre_id || !formData.brand_id) {
      toast.error('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'image') payload.append(key, value);
      });
      if (imageFile) payload.append('image', imageFile);

      const res = await api.post('/admin/products/create', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Thêm sản phẩm thành công');
        router.push('/admin/products');
      } else {
        toast.error(res.data.message || 'Thêm sản phẩm thất bại');
      }
    } catch (error: any) {
      console.error('create product error:', error);
      toast.error(error.response?.data?.message || 'Thêm sản phẩm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100';

  return (
    <div className="space-y-6">
      <div className="admin-shell flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-[0_18px_32px_-18px_rgba(37,99,235,0.82)]">
            <CubeIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500">
              <Link href="/admin" className="hover:text-sky-700">
                Bảng điều khiển
              </Link>
              <span className="mx-2">/</span>
              <Link href="/admin/products" className="hover:text-sky-700">
                Sản phẩm
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">Thêm sản phẩm</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Tạo sản phẩm mới</h1>
            <p className="mt-1 text-sm text-slate-500">Nhập đầy đủ thông tin, hình ảnh và mô tả để sản phẩm hiển thị đúng ở cả client và admin.</p>
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-sky-200 hover:text-sky-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
        <div className="space-y-6">
          <section className="admin-shell p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Thông tin cơ bản</h2>
              <p className="mt-1 text-sm text-slate-500">Các trường có dấu * là bắt buộc.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Danh mục *</label>
                <select
                  value={formData.genre_id}
                  onChange={(e) => updateField('genre_id', e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {genres.map((genre) => (
                    <option key={genre.genre_id} value={genre.genre_id}>
                      {genre.genre_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Thương hiệu *</label>
                <select
                  value={formData.brand_id}
                  onChange={(e) => updateField('brand_id', e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Chọn thương hiệu</option>
                  {brands.map((brand) => (
                    <option key={brand.brand_id} value={brand.brand_id}>
                      {brand.brand_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Loại sản phẩm *</label>
                <select value={formData.Type} onChange={(e) => updateField('Type', e.target.value)} className={inputClass}>
                  <option value="1">Laptop</option>
                  <option value="2">Phụ kiện</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Khuyến mãi</label>
                <select
                  value={formData.disscount_id}
                  onChange={(e) => updateField('disscount_id', e.target.value)}
                  className={inputClass}
                >
                  {discounts.map((discount) => (
                    <option key={discount.disscount_id} value={discount.disscount_id}>
                      {discount.discount_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => updateField('product_name', e.target.value)}
                  className={inputClass}
                  placeholder="Ví dụ: Laptop Asus Vivobook 14 OLED"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Giá bán *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  className={inputClass}
                  placeholder="Nhập giá bán"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Số lượng</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.quantity}
                  onChange={(e) => updateQuantity(e.target.value)}
                  className={inputClass}
                  placeholder="Nhập số lượng tồn kho"
                />
              </div>
            </div>
          </section>

          <section className="admin-shell p-6">
            <h2 className="text-lg font-semibold text-slate-900">Thông số kỹ thuật</h2>
            <p className="mt-1 text-sm text-slate-500">Nên nhập dạng từng dòng hoặc theo nhóm dễ đọc.</p>
            <textarea
              rows={8}
              value={formData.specifications}
              onChange={(e) => updateField('specifications', e.target.value)}
              className={`${inputClass} mt-5 resize-none`}
              placeholder="CPU: Intel Core i5&#10;RAM: 16GB DDR4&#10;SSD: 512GB NVMe..."
            />
          </section>

          <section className="admin-shell p-6">
            <h2 className="text-lg font-semibold text-slate-900">Mô tả sản phẩm</h2>
            <p className="mt-1 text-sm text-slate-500">Phần này hiển thị cho khách hàng ở trang chi tiết.</p>
            <textarea
              rows={8}
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              className={`${inputClass} mt-5 resize-none`}
              placeholder="Mô tả điểm nổi bật, đối tượng phù hợp, ưu điểm chính của sản phẩm..."
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="admin-shell p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <PhotoIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Ảnh đại diện</h2>
                <p className="text-sm text-slate-500">Ảnh vuông hoặc ngang đều được, tối đa 5MB.</p>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-sky-200 bg-sky-50/60 px-4 py-8 text-center hover:border-sky-300 hover:bg-sky-50">
              {imagePreview ? (
                <img src={imagePreview} alt="Xem trước ảnh sản phẩm" className="h-56 w-full rounded-2xl object-cover" />
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                    <PhotoIcon className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-700">Bấm để tải ảnh từ máy tính</p>
                  <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </section>

          <section className="admin-shell p-6">
            <h2 className="text-lg font-semibold text-slate-900">Kiểm tra trước khi lưu</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="rounded-2xl bg-slate-50 px-4 py-3">Tên sản phẩm rõ ràng và đúng model.</li>
              <li className="rounded-2xl bg-slate-50 px-4 py-3">Giá và số lượng đã được kiểm tra.</li>
              <li className="rounded-2xl bg-slate-50 px-4 py-3">Thông số và mô tả đủ để khách hàng ra quyết định.</li>
            </ul>

            <div className="mt-6 flex flex-col gap-3">
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 disabled:opacity-70">
                {loading ? 'Đang lưu sản phẩm...' : 'Lưu sản phẩm'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-slate-300"
              >
                Hủy
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
