// app/(admin)/admin/genres/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/admin/common/ConfirmModal';
import ActionMenu from '@/components/admin/common/ActionMenu';

interface Genre {
  genre_id: number;
  genre_name: string;
  create_at: string;
  create_by: string;
  update_at: string;
  update_by: string;
}

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [genreName, setGenreName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchGenres = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/genres', {
        params: { page: currentPage, search }
      });
      if (res.data.success) {
        setGenres(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleSubmit = async () => {
    if (!genreName.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      if (editingGenre) {
        await api.put(`/admin/genres/edit/${editingGenre.genre_id}`, { genreName });
        toast.success('Cập nhật danh mục thành công');
      } else {
        await api.post('/admin/genres/create', { genreName });
        toast.success('Thêm danh mục thành công');
      }
      setShowModal(false);
      setEditingGenre(null);
      setGenreName('');
      fetchGenres();
    } catch {
      toast.error(editingGenre ? 'Cập nhật thất bại' : 'Thêm thất bại');
    }
  };

  const handleDelete = async () => {
    if (!selectedGenre) return;
    try {
      await api.delete(`/admin/genres/delete/${selectedGenre.genre_id}`);
      toast.success('Xóa danh mục thành công');
      fetchGenres();
    } catch {
      toast.error('Xóa thất bại');
    } finally {
      setShowDeleteModal(false);
      setSelectedGenre(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '---';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 w-full max-w-[1200px] mx-auto fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
            <i className="bi bi-grid text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Danh mục</h1>
            <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
              <Link href="/admin" className="cursor-pointer hover:text-blue-600 transition-colors">Bảng điều khiển</Link>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-700">Danh sách danh mục</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingGenre(null);
              setGenreName('');
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-semibold shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <i className="bi bi-plus-lg"></i>
            Thêm danh mục
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        {/* Toolbar */}
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
              placeholder="Tìm kiếm danh mục..."
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-5 font-semibold text-gray-500">ID</th>
                <th className="px-6 py-5 font-semibold text-gray-500">Tên danh mục</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-center">Người tạo</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-center">Ngày tạo</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {genres.map((genre) => (
                <tr key={genre.genre_id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-500">#{genre.genre_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-800 text-base">{genre.genre_name}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {genre.create_by || 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-500">
                    {formatDate(genre.create_at)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ActionMenu
                      items={[
                        {
                          label: 'Chỉnh sửa',
                          onClick: () => {
                            setEditingGenre(genre);
                            setGenreName(genre.genre_name);
                            setShowModal(true);
                          }
                        },
                        {
                          label: 'Xóa danh mục',
                          tone: 'danger',
                          onClick: () => {
                            setSelectedGenre(genre);
                            setShowDeleteModal(true);
                          }
                        }
                      ]}
                    />
                  </td>

                </tr>
              ))}
              {genres.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center mb-3">
                        <i className="bi bi-grid text-2xl text-gray-300"></i>
                      </div>
                      <p className="text-gray-500 font-medium text-lg">Không tìm thấy danh mục nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-2xl">
            <span className="text-sm text-gray-500 font-medium">
              Trang <span className="font-bold text-gray-700">{currentPage}</span> / {totalPages}
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

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-[modalIn_0.3s_ease-out]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingGenre ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 w-8 h-8 rounded-lg flex items-center justify-center transition-colors">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={genreName}
                  onChange={(e) => setGenreName(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm transition-colors"
                  placeholder="Nhập tên danh mục..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                Hủy bỏ
              </button>
              <button onClick={handleSubmit} className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all">
                {editingGenre ? 'Cập nhật' : 'Lưu danh mục'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xóa */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Xóa danh mục"
        message={`Bạn có chắc chắn muốn xóa danh mục "<strong class="text-red-600">${selectedGenre?.genre_name}</strong>"?`}
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
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
