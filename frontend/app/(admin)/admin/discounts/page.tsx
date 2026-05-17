'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/components/admin/common/ConfirmModal';

export default function DiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);

  const [formData, setFormData] = useState({
    discountPrice: '',
    discountCode: '',
    quantity: '',
    discountStart: '',
    discountEnd: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== '0') {
      router.push('/account/login');
      return;
    }
    fetchDiscounts();
  }, [currentPage, router]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/discounts?page=${currentPage}&size=10&search=${searchInput}`);
      if (res.data.success) {
        setDiscounts(res.data.data);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.error('fetchDiscounts error:', error);
      toast.error('Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDiscounts();
  };

  const handleSubmit = async (e: any) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.discountPrice || !formData.quantity || !formData.discountStart || !formData.discountEnd) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    const price = parseFloat(formData.discountPrice);
    const qty = parseInt(formData.quantity);

    if (isNaN(price) || price <= 0) {
      toast.error('Mức giảm phải là số dương');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      toast.error('Số lượng phải là số dương');
      return;
    }

    try {
      const payload = {
        discountPrice: price,
        discountCode: (formData.discountCode || '').trim() || null,
        quantity: qty,
        discountStart: formData.discountStart,
        discountEnd: formData.discountEnd
      };

      let response;
      if (editingDiscount) {
        response = await api.put(`/admin/discounts/edit/${editingDiscount.disscount_id}`, payload);
      } else {
        response = await api.post('/admin/discounts/create', payload);
      }

      if (response.data.success) {
        toast.success(editingDiscount ? 'Cập nhật thành công' : 'Tạo mã thành công');
        setShowModal(false);
        setEditingDiscount(null);
        setFormData({ discountPrice: '', discountCode: '', quantity: '', discountStart: '', discountEnd: '' });
        fetchDiscounts();
      } else {
        toast.error(response.data.message || 'Thao tác thất bại');
      }
    } catch (err: any) {
      console.error('handleSubmit error:', err);
      const msg = err?.response?.data?.message || 'Lỗi kết nối. Hãy chắc chắn Backend đang chạy ở cổng 5000.';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!selectedDiscount) return;
    try {
      const res = await api.delete(`/admin/discounts/delete/${selectedDiscount.disscount_id}`);
      if (res.data.success) {
        toast.success('Xóa thành công');
        fetchDiscounts();
      } else {
        toast.error(res.data.message || 'Xóa thất bại');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại');
    } finally {
      setShowDeleteModal(false);
      setSelectedDiscount(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return (amount || 0).toLocaleString('vi-VN') + '₫';
  };

  const formatDate = (date: string) => {
    if (!date) return '---';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';
    return d.toLocaleDateString('vi-VN');
  };

  if (loading && discounts.length === 0) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 w-full max-w-[1400px] mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-100">
            <i className="bi bi-ticket-perforated text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý khuyến mãi</h1>
            <p className="text-sm text-gray-500">Tạo và quản lý các mã giảm giá cho hệ thống</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingDiscount(null);
            setFormData({ discountPrice: '', discountCode: '', quantity: '', discountStart: '', discountEnd: '' });
            setShowModal(true);
          }}
          className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <i className="bi bi-plus-lg mr-2"></i>
          TẠO MÃ MỚI
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/30">
          <form onSubmit={handleSearch} className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="bi bi-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-11 w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-all"
              placeholder="Tìm kiếm mã giảm giá..."
            />
          </form>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 font-bold">Mã code</th>
                <th className="px-6 py-5 font-bold text-right">Mức giảm</th>
                <th className="px-6 py-5 font-bold text-center">Số lượng</th>
                <th className="px-6 py-5 font-bold text-center">Thời hạn</th>
                <th className="px-6 py-5 font-bold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {discounts.map((discount) => {
                const isExpired = new Date(discount.discount_end) < new Date();
                return (
                  <tr key={discount.disscount_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold tracking-wider ${isExpired ? 'bg-gray-200 text-gray-500' : 'bg-pink-100 text-pink-700'}`}>
                        {discount.discount_code || '---'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-bold text-gray-900 text-base">{formatCurrency(discount.discount_price)}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`font-bold ${discount.quantity === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {discount.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col text-[11px] text-gray-500">
                        <span>BĐ: {formatDate(discount.discount_star)}</span>
                        <span>KT: {formatDate(discount.discount_end)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingDiscount(discount);
                            setFormData({
                              discountPrice: discount.discount_price.toString(),
                              discountCode: discount.discount_code || '',
                              quantity: discount.quantity.toString(),
                              discountStart: new Date(discount.discount_star).toISOString().split('T')[0],
                              discountEnd: new Date(discount.discount_end).toISOString().split('T')[0]
                            });
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <i className="bi bi-pencil-square text-lg"></i>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDiscount(discount);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <i className="bi bi-trash3 text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500 font-medium">
              Trang <span className="font-bold text-gray-700">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-50"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                const pageNum = start + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border text-sm font-medium ${currentPage === pageNum
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-white'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-50"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingDiscount ? 'Cập nhật mã' : 'Tạo mã giảm giá mới'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mã code</label>
                <input
                  type="text"
                  value={formData.discountCode}
                  onChange={(e) => setFormData({ ...formData, discountCode: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500 font-bold uppercase"
                  placeholder="VD: GIAMGIA10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mức giảm (VNĐ) *</label>
                  <input
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Số lượng *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Từ ngày *</label>
                  <input
                    type="date"
                    value={formData.discountStart}
                    onChange={(e) => setFormData({ ...formData, discountStart: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Đến ngày *</label>
                  <input
                    type="date"
                    value={formData.discountEnd}
                    onChange={(e) => setFormData({ ...formData, discountEnd: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold">HỦY</button>
              <button onClick={handleSubmit} className="px-8 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold">
                {editingDiscount ? 'CẬP NHẬT' : 'TẠO MÃ'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa mã <b>${selectedDiscount?.discount_code || ''}</b> không?`}
        type="danger"
      />
    </div>
  );
}
