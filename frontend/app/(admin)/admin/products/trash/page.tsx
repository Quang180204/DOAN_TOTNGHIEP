'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/admin/common/ConfirmModal';
import ActionMenu from '@/components/admin/common/ActionMenu';

interface TrashProduct {
  product_id: number;
  product_name: string;
  price: number;
  image: string;
  brand?: { brand_name: string };
  genre?: { genre_name: string };
  discount_price?: number;
  discount_start?: string;
  discount_end?: string;
}

export default function ProductsTrashPage() {
  const router = useRouter();
  const [products, setProducts] = useState<TrashProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TrashProduct | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products/trash', {
        params: { page: currentPage, search }
      });
      if (res.data.success) {
        setProducts(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      toast.error('Không thể tải thùng rác');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleRestore = async () => {
    if (!selectedProduct) return;
    try {
      await api.put(`/admin/products/undo/${selectedProduct.product_id}`);
      toast.success('Đã khôi phục sản phẩm');
      fetchProducts();
    } catch {
      toast.error('Khôi phục thất bại');
    } finally {
      setShowRestoreModal(false);
      setSelectedProduct(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await api.delete(`/admin/products/delete/${selectedProduct.product_id}`);
      toast.success('Đã xóa vĩnh viễn');
      fetchProducts();
    } catch {
      toast.error('Xóa thất bại');
    } finally {
      setShowDeleteModal(false);
      setSelectedProduct(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('vi-VN') + '₫';
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Thùng rác sản phẩm</h1>
          <p className="text-gray-500 font-medium">Khôi phục hoặc xóa vĩnh viễn các sản phẩm đã vô hiệu hóa</p>
        </div>
        <button 
          onClick={() => router.push('/admin/products')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <i className="bi bi-arrow-left"></i> Quay lại
        </button>
      </div>

      {/* Main content card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-blue-900/5 border border-white overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <form onSubmit={handleSearch} className="relative w-full sm:w-96 group">
            <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"></i>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm trong thùng rác..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none font-medium"
            />
          </form>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
            Tổng cộng: <span className="text-blue-600">{products.length}</span> sản phẩm
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 text-[11px] text-gray-400 uppercase tracking-[0.15em] font-black">
              <tr>
                <th className="px-6 py-5">ID</th>
                <th className="px-6 py-5">Sản phẩm</th>
                <th className="px-6 py-5">Thương hiệu</th>
                <th className="px-6 py-5">Danh mục</th>
                <th className="px-6 py-5 text-right">Giá gốc</th>
                <th className="px-6 py-5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product.product_id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="font-black text-gray-400 text-xs">#{product.product_id}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm group-hover:scale-105 transition-transform">
                        <img src={product.image || '/default-product.png'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-gray-800 text-[15px]">{product.product_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-black uppercase">
                      {product.brand?.brand_name || '---'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-black uppercase">
                      {product.genre?.genre_name || '---'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-bold text-gray-500">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <ActionMenu
                      items={[
                        {
                          label: 'Khôi phục',
                          onClick: () => {
                            setSelectedProduct(product);
                            setShowRestoreModal(true);
                          }
                        },
                        {
                          label: 'Xóa vĩnh viễn',
                          tone: 'danger',
                          onClick: () => {
                            setSelectedProduct(product);
                            setShowDeleteModal(true);
                          }
                        }
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center grayscale opacity-30">
                      <i className="bi bi-trash text-6xl mb-4"></i>
                      <p className="text-xl font-black">Thùng rác trống</p>
                      <p className="text-sm font-medium">Không tìm thấy sản phẩm nào bị xóa.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">
              Trang <span className="text-blue-600">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent transition-all"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border text-sm font-black transition-all ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent transition-all"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal khôi phục */}
      <ConfirmModal
        isOpen={showRestoreModal}
        title="Xác nhận khôi phục?"
        message={`Bạn có chắc chắn muốn khôi phục sản phẩm <span class="font-black text-blue-600">${selectedProduct?.product_name}</span>? Sản phẩm sẽ quay lại danh sách kinh doanh.`}
        type="warning"
        confirmText="Khôi phục ngay"
        onConfirm={handleRestore}
        onCancel={() => setShowRestoreModal(false)}
      />

      {/* Modal xóa vĩnh viễn */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Xác nhận xóa vĩnh viễn?"
        message={`Hành động này sẽ xóa vĩnh viễn sản phẩm <span class="font-black text-red-600">${selectedProduct?.product_name}</span> và không thể hoàn tác. Bạn chắc chắn chứ?`}
        type="danger"
        confirmText="Xóa vĩnh viễn"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
