// components/admin/forms/ProductForm.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ProductFormData {
  product_name: string;
  price: string;
  quantity: string;
  genre_id: string;
  brand_id: string;
  disscount_id: string;
  Type: string;
  specifications: string;
  description: string;
  image: string;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  productId?: number;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const [brands, setBrands] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [formData, setFormData] = useState<ProductFormData>(
    initialData || {
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
    }
  );

  useEffect(() => {
    fetchBrands();
    fetchGenres();
    fetchDiscounts();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await api.get('/admin/brands');
      if (res.data.success) setBrands(res.data.data);
    } catch (error) {
      console.error('Lỗi tải thương hiệu:', error);
    }
  };

  const fetchGenres = async () => {
    try {
      const res = await api.get('/admin/genres');
      if (res.data.success) setGenres(res.data.data);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const res = await api.get('/admin/discounts');
      if (res.data.success) setDiscounts(res.data.data);
    } catch (error) {
      console.error('Lỗi tải giảm giá:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name || !formData.price || !formData.genre_id || !formData.brand_id) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card mb-5 mb-xl-10">
        <div className="card-body border-top p-9">
          <div className="mb-2">
            <span><i className="text-danger">Những mục đánh dấu (*) là bắt buộc</i></span>
          </div>

          <div className="row mb-6">
            <div className="col-lg-4">
              <label className="col-form-label fw-bold fs-6 required">Danh mục</label>
            </div>
            <div className="col-lg-8 fv-row">
              <select
                value={formData.genre_id}
                onChange={(e) => setFormData({ ...formData, genre_id: e.target.value })}
                className="form-select form-select-solid form-select-lg fw-bold"
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {genres.map((g) => (
                  <option key={g.genre_id} value={g.genre_id}>{g.genre_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="row mb-6">
            <div className="col-lg-4">
              <label className="col-form-label fw-bold fs-6 required">Thương hiệu</label>
            </div>
            <div className="col-lg-8 fv-row">
              <select
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                className="form-select form-select-solid form-select-lg fw-bold"
                required
              >
                <option value="">-- Chọn thương hiệu --</option>
                {brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="row mb-6">
            <div className="col-lg-4">
              <label className="col-form-label fw-bold fs-6">Chương trình giảm giá</label>
            </div>
            <div className="col-lg-8 fv-row">
              <select
                value={formData.disscount_id}
                onChange={(e) => setFormData({ ...formData, disscount_id: e.target.value })}
                className="form-select form-select-solid form-select-lg fw-bold"
              >
                {discounts.map((d) => (
                  <option key={d.disscount_id} value={d.disscount_id}>{d.discount_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="row mb-6">
            <div className="col-lg-4">
              <label className="col-form-label fw-bold fs-6 required">Loại sản phẩm</label>
            </div>
            <div className="col-lg-8 fv-row">
              <select
                value={formData.Type}
                onChange={(e) => setFormData({ ...formData, Type: e.target.value })}
                className="form-select form-select-solid form-select-lg fw-bold"
              >
                <option value="1">Laptop</option>
                <option value="2">Phụ kiện</option>
              </select>
            </div>
          </div>

          <div className="row mb-6">
            <div className="col-lg-4">
              <label className="col-form-label fw-bold fs-6 required">Tên sản phẩm</label>
            </div>
            <div className="col-lg-8 fv-row">
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="form-control form-control-lg form-control-solid"
                placeholder="Nhập tên sản phẩm"
                required
              />
            </div>
          </div>

          <div className="row mb-6">
            <div className="col-lg-4">
              <label className="col-form-label fw-bold fs-6 required">Giá bán</label>
            </div>
            <div className="col-lg-8 fv-row">
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="form-control form-control-lg form-control-solid"
                placeholder="Nhập giá sản phẩm"
                min="1"
                required
              />
            </div>
          </div>

          <div className="row mb-6">
            <div className="col-lg-4">
              <label className="col-form-label fw-bold fs-6 required">Số lượng</label>
            </div>
            <div className="col-lg-8 fv-row">
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="form-control form-control-lg form-control-solid"
                placeholder="Nhập số lượng"
                min="0"
              />
            </div>
          </div>

          <div className="row mb-6">
            <div className="col-lg-4">
              <label className="col-form-label fw-bold fs-6">Ảnh Thumbnail</label>
            </div>
            <div className="col-lg-8 fv-row">
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="form-control form-control-lg form-control-solid"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="row mb-6">
            <div className="col-lg-4">
              <label className="col-form-label fw-bold fs-6">Thông số kỹ thuật</label>
            </div>
            <div className="col-lg-8 fv-row">
              <textarea
                rows={5}
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                className="form-control form-control-lg form-control-solid"
                placeholder="Nhập thông số kỹ thuật..."
              />
            </div>
          </div>

          <div className="row mb-6">
            <div className="col-lg-4">
              <label className="col-form-label fw-bold fs-6">Mô tả sản phẩm</label>
            </div>
            <div className="col-lg-8 fv-row">
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-control form-control-lg form-control-solid"
                placeholder="Nhập mô tả sản phẩm..."
              />
            </div>
          </div>
        </div>

        <div className="card-footer d-flex justify-content-end py-6 px-9">
          <button type="reset" className="btn btn-light btn-active-light-primary me-2" onClick={() => window.history.back()}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </form>
  );
}