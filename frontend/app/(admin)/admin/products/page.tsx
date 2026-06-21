// app/(admin)/admin/products/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/admin/common/ConfirmModal';
import ActionMenu from '@/components/admin/common/ActionMenu';
import { getMediaUrl } from '@/lib/media';

interface Product {
  product_id: number;
  product_name: string;
  price: number;
  quantity: string;
  status: string;
  image: string;
  view: number;
  brand?: { brand_name: string };
  genre?: { genre_name: string };
  discount?: { discount_price: number, discount_start: string, discount_end: string };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [trashCount, setTrashCount] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products', {
        params: { page: currentPage, search }
      });
      if (res.data.success) {
        setProducts(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTrashCount(res.data.trashCount || 0);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleDisable = async () => {
    if (!selectedProduct) return;
    try {
      await api.put(`/admin/products/disable/${selectedProduct.product_id}`);
      toast.success('Đã chuyển vào thùng rác');
      fetchProducts();
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setShowDisableModal(false);
      setSelectedProduct(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return (amount || 0).toLocaleString('vi-VN') + '₫';
  };

  const getFinalPrice = (product: Product) => {
    if (product.discount?.discount_start && product.discount?.discount_end) {
      const now = new Date();
      const start = new Date(product.discount.discount_start);
      const end = new Date(product.discount.discount_end);
      if (now >= start && now <= end && product.discount.discount_price) {
        return (
          <div className="flex flex-col">
            <span className="text-gray-400 line-through text-xs">{formatCurrency(product.price)}</span>
            <span className="text-blue-600 font-bold">{formatCurrency(product.price - product.discount.discount_price)}</span>
          </div>
        );
      }
    }
    return <span className="text-gray-900 font-bold">{formatCurrency(product.price)}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 w-full max-w-[1600px] mx-auto fade-in">
      {/* Breadcrumb / Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <i className="bi bi-box-seam text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sản phẩm</h1>
            <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
              <Link href="/admin" className="cursor-pointer hover:text-blue-600 transition-colors">Bảng điều khiển</Link>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-700">Danh sách sản phẩm</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/admin/products/trash" className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors">
            <i className="bi bi-trash"></i>
            Thùng rác <span className="bg-red-200 text-red-700 px-2 py-0.5 rounded-full text-xs ml-1">{trashCount}</span>
          </Link>
          <Link href="/admin/products/create" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-semibold shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5">
            <i className="bi bi-plus-lg"></i>
            Thêm mới
          </Link>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="bi bi-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-all shadow-sm"
              placeholder="Tìm kiếm sản phẩm (Tên, ID)..."
            />
          </form>
          <div className="flex items-center gap-2">
            {/* Removed Filter and Export buttons as requested */}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold rounded-tl-xl">ID</th>
                <th className="px-6 py-4 font-semibold">Sản phẩm</th>
                <th className="px-6 py-4 font-semibold">Thương hiệu</th>
                <th className="px-6 py-4 font-semibold">Danh mục</th>
                <th className="px-6 py-4 font-semibold text-center">Lượt xem</th>
                <th className="px-6 py-4 font-semibold text-right">Giá bán</th>
                <th className="px-6 py-4 font-semibold text-center rounded-tr-xl">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.product_id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-500">#{product.product_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl border border-gray-200 p-1 flex-shrink-0 bg-white group-hover:border-blue-300 transition-colors overflow-hidden">
                        <img
                          src={getMediaUrl(product.image)}
                          alt={product.product_name}
                          className="w-full h-full object-contain"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = '/images/default.png';
                          }}
                        />
                      </div>
                      <div>
                        <Link href={`/admin/products/${product.product_id}`} className="font-bold text-gray-800 hover:text-blue-600 line-clamp-2 transition-colors">
                          {product.product_name}
                        </Link>
                        <div className="text-xs text-gray-400 mt-1">Kho: <span className="font-medium text-gray-600">{product.quantity}</span></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {product.brand?.brand_name || '---'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {product.genre?.genre_name || '---'}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500 font-medium">
                    {product.view || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {getFinalPrice(product)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ActionMenu
                      items={[
                        {
                          label: 'Xem chi tiết',
                          onClick: () => {
                            window.location.href = `/admin/products/${product.product_id}`;
                          }
                        },
                        {
                          label: 'Chỉnh sửa',
                          onClick: () => {
                            window.location.href = `/admin/products/edit/${product.product_id}`;
                          }
                        },
                        {
                          label: 'Xóa sản phẩm',
                          tone: 'danger',
                          onClick: () => {
                            setSelectedProduct(product);
                            setShowDisableModal(true);
                          }
                        }
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <i className="bi bi-box-seam text-2xl text-gray-400"></i>
                      </div>
                      <p className="text-gray-500 font-medium text-lg">Không tìm thấy sản phẩm nào</p>
                      <p className="text-gray-400 text-sm mt-1">Thử thay đổi từ khóa tìm kiếm hoặc thêm sản phẩm mới.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500 font-medium">
              Trang {currentPage} / {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-colors"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                }
                return pageNum ? (
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
                ) : null;
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-colors"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDisableModal}
        title="Xác nhận xóa?"
        message={`Bạn có chắc chắn muốn chuyển sản phẩm <strong class="text-gray-900">${selectedProduct?.product_name}</strong> vào thùng rác?`}
        type="danger"
        onConfirm={handleDisable}
        onCancel={() => setShowDisableModal(false)}
      />
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
