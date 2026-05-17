// app/(admin)/admin/users/trash/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/admin/common/ConfirmModal';
import ActionMenu from '@/components/admin/common/ActionMenu';
import { getMediaUrl } from '@/lib/media';

interface TrashAccount {
  account_id: number;
  Name: string;
  email: string;
  Phone: string;
  Role: number;
  Avatar?: string;
  create_at: string;
}

export default function UsersTrashPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<TrashAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<TrashAccount | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/auth/trash', {
        params: { page: currentPage, search }
      });
      if (res.data.success) {
        setAccounts(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      toast.error('Không thể tải danh sách tài khoản đã khóa');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleRestore = async () => {
    if (!selectedAccount) return;
    try {
      await api.put(`/admin/auth/activate/${selectedAccount.account_id}`);
      toast.success('Đã khôi phục tài khoản thành công');
      fetchAccounts();
    } catch {
      toast.error('Khôi phục thất bại');
    } finally {
      setShowRestoreModal(false);
      setSelectedAccount(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedAccount) return;
    try {
      await api.delete(`/admin/auth/delete/${selectedAccount.account_id}`);
      toast.success('Đã xóa vĩnh viễn tài khoản');
      fetchAccounts();
    } catch {
      toast.error('Xóa thất bại');
    } finally {
      setShowDeleteModal(false);
      setSelectedAccount(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '---';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="px-4 py-6 w-full max-w-[1600px] mx-auto fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shadow-inner">
            <i className="bi bi-person-x text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Tài khoản đã khóa</h1>
            <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
              <span onClick={() => router.push('/admin/users')} className="cursor-pointer hover:text-blue-600 transition-colors">Tài khoản</span>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-700">Đã khóa</span>
            </div>
          </div>
        </div>
        <button onClick={() => router.push('/admin/users')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors">
          <i className="bi bi-arrow-left"></i> Quay lại
        </button>
      </div>

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
              className="pl-11 w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-red-500 focus:border-red-500 block p-2.5 transition-all shadow-sm"
              placeholder="Tìm kiếm tài khoản đã khóa..."
            />
          </form>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 font-medium px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
              <i className="bi bi-person-x text-red-500 mr-1.5"></i>
              <span className="font-bold text-red-600">{accounts.length}</span> tài khoản bị khóa
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-red-50/40 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-5 font-semibold text-gray-500">ID</th>
                <th className="px-6 py-5 font-semibold text-gray-500">Người dùng</th>
                <th className="px-6 py-5 font-semibold text-gray-500">Thông tin liên hệ</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-center">Ngày tham gia</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-center">Phân quyền</th>
                <th className="px-6 py-5 font-semibold text-gray-500 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map((account) => (
                <tr key={account.account_id} className="hover:bg-red-50/20 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-red-400">#{account.account_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold border border-red-200 overflow-hidden flex-shrink-0">
                        <img
                          src={getMediaUrl(account.Avatar, '/images/default.png')}
                          alt={account.Name || account.email || 'Tài khoản'}
                          className="h-full w-full object-cover opacity-60"
                          onError={(event) => {
                            event.currentTarget.src = '/images/default.png';
                          }}
                        />
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 line-clamp-1">{account.Name || 'Chưa cập nhật'}</span>
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase w-max block mt-1 border border-red-100">Đã khóa</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500 flex items-center gap-2"><i className="bi bi-envelope text-gray-400"></i>{account.email || '---'}</span>
                      <span className="text-gray-500 flex items-center gap-2"><i className="bi bi-telephone text-gray-400"></i>{account.Phone || '---'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-500">{formatDate(account.create_at)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                      {account.Role === 0 ? 'Quản trị viên' : 'Khách hàng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ActionMenu
                      items={[
                        {
                          label: 'Khôi phục tài khoản',
                          onClick: () => {
                            setSelectedAccount(account);
                            setShowRestoreModal(true);
                          }
                        },
                        {
                          label: 'Xóa vĩnh viễn',
                          tone: 'danger',
                          onClick: () => {
                            setSelectedAccount(account);
                            setShowDeleteModal(true);
                          }
                        }
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-green-50 rounded-full border border-green-100 flex items-center justify-center mb-3">
                        <i className="bi bi-person-check text-2xl text-green-400"></i>
                      </div>
                      <p className="text-gray-500 font-medium text-lg">Không có tài khoản nào bị khóa</p>
                      <p className="text-gray-400 text-sm mt-1">Tất cả tài khoản đang hoạt động bình thường.</p>
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
            <span className="text-sm text-gray-500 font-medium">Trang <span className="font-bold text-gray-700">{currentPage}</span> / {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-colors">
                <i className="bi bi-chevron-left"></i>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) { pageNum = currentPage - 2 + i; if (pageNum > totalPages) return null; }
                return pageNum ? (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 bg-transparent'}`}>
                    {pageNum}
                  </button>
                ) : null;
              })}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent transition-colors">
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showRestoreModal}
        title="Khôi phục tài khoản"
        message={`Bạn có chắc chắn muốn khôi phục tài khoản "<strong class="text-emerald-600">${selectedAccount?.Name || selectedAccount?.email}</strong>"? Tài khoản sẽ có thể đăng nhập lại.`}
        type="success"
        onConfirm={handleRestore}
        onCancel={() => setShowRestoreModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Xóa vĩnh viễn tài khoản"
        message={`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "<strong class="text-red-600">${selectedAccount?.Name || selectedAccount?.email}</strong>"? Hành động này KHÔNG THỂ hoàn tác.`}
        type="danger"
        onConfirm={handlePermanentDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
