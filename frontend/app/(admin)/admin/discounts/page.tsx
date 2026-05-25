'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/components/admin/common/ConfirmModal';
import ActionMenu from '@/components/admin/common/ActionMenu';

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();

    if (!formData.discountPrice || !formData.quantity || !formData.discountStart || !formData.discountEnd) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    const price = parseFloat(formData.discountPrice);
    const qty = parseInt(formData.quantity, 10);

    if (Number.isNaN(price) || price <= 0) {
      toast.error('Mức giảm phải là số dương');
      return;
    }
    if (Number.isNaN(qty) || qty <= 0) {
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

      const response = editingDiscount
        ? await api.put(`/admin/discounts/edit/${editingDiscount.disscount_id}`, payload)
        : await api.post('/admin/discounts/create', payload);

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
      toast.error(err?.response?.data?.message || 'Lỗi kết nối. Hãy chắc chắn backend đang chạy.');
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

  const formatCurrency = (amount: number) => `${(amount || 0).toLocaleString('vi-VN')}đ`;

  const formatDate = (date: string) => {
    if (!date) return '---';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '---';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const openCreateModal = () => {
    setEditingDiscount(null);
    setFormData({ discountPrice: '', discountCode: '', quantity: '', discountStart: '', discountEnd: '' });
    setShowModal(true);
  };

  const openEditModal = (discount: any) => {
    setEditingDiscount(discount);
    setFormData({
      discountPrice: String(discount.discount_price || ''),
      discountCode: discount.discount_code || '',
      quantity: String(discount.quantity || ''),
      discountStart: new Date(discount.discount_star).toISOString().split('T')[0],
      discountEnd: new Date(discount.discount_end).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  if (loading && discounts.length === 0) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 w-full max-w-[1200px] mx-auto fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 shadow-inner">
            <i className="bi bi-ticket-perforated text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Khuyến mãi</h1>
            <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
              <Link href="/admin" className="cursor-pointer hover:text-blue-600 transition-colors">
                Bảng điều khiển
              </Link>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-700">Danh sách khuyến mãi</span>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-semibold shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
        >
          <i className="bi bi-plus-lg"></i>
          Thêm khuyến mãi
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50 rounded-t-2xl">
          <form onSubmit={handleSearch} className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="bi bi-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-11 w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-all shadow-sm"
              placeholder="Tìm kiếm mã giảm giá..."
            />
          </form>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-5 font-semibold text-gray-500">ID</th>
                <th className="px-6 py-5 font-semibold text-gray-500">Mã code</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-right">Mức giảm</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-center">Số lượng</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-center">Thời hạn</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {discounts.map((discount) => {
                const isExpired = new Date(discount.discount_end) < new Date();
                return (
                  <tr key={discount.disscount_id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-500">#{discount.disscount_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold tracking-wider ${
                          isExpired ? 'bg-gray-100 text-gray-500 border border-gray-200' : 'bg-pink-50 text-pink-700 border border-pink-100'
                        }`}
                      >
                        {discount.discount_code || 'KHÔNG CÓ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-gray-900 text-base">{formatCurrency(discount.discount_price)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                          Number(discount.quantity) === 0
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}
                      >
                        {discount.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col text-[11px] text-gray-500 leading-5">
                        <span>BĐ: {formatDate(discount.discount_star)}</span>
                        <span>KT: {formatDate(discount.discount_end)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ActionMenu
                        items={[
                          {
                            label: 'Chỉnh sửa',
                            onClick: () => openEditModal(discount)
                          },
                          {
                            label: 'Xóa khuyến mãi',
                            tone: 'danger',
                            onClick: () => {
                              setSelectedDiscount(discount);
                              setShowDeleteModal(true);
                            }
                          }
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
              {discounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center mb-3">
                        <i className="bi bi-ticket-perforated text-2xl text-gray-300"></i>
                      </div>
                      <p className="text-gray-500 font-medium text-lg">Không tìm thấy khuyến mãi nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-2xl">
            <span className="text-sm text-gray-500 font-medium">
              Trang <span className="font-bold text-gray-700">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-colors"
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
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 bg-transparent'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-colors"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-[modalIn_0.3s_ease-out]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingDiscount ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mã code</label>
                <input
                  type="text"
                  value={formData.discountCode}
                  onChange={(e) => setFormData({ ...formData, discountCode: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm transition-colors font-bold uppercase"
                  placeholder="VD: GIAMGIA10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mức giảm (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Từ ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.discountStart}
                    onChange={(e) => setFormData({ ...formData, discountStart: e.target.value })}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Đến ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.discountEnd}
                    onChange={(e) => setFormData({ ...formData, discountEnd: e.target.value })}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleSubmit()}
                className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
              >
                {editingDiscount ? 'Cập nhật' : 'Lưu khuyến mãi'}
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

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
