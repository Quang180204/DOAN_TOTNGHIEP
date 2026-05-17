// app/(admin)/admin/users/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/admin/common/ConfirmModal';
import ActionMenu from '@/components/admin/common/ActionMenu';

interface Account {
  account_id: number;
  Name: string;
  email: string;
  Phone: string;
  Role: number;
  status: string;
  create_at: string;
  Avatar?: string;
}

export default function UsersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [trashCount, setTrashCount] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(0);
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

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/auth', {
        params: { page: currentPage, search }
      });
      if (res.data.success) {
        setAccounts(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTrashCount(res.data.trashCount || 0);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleChangeRole = async () => {
    if (!selectedAccount) return;
    try {
      await api.put('/admin/auth/change-role', {
        accountId: selectedAccount.account_id,
        roleId: selectedRole
      });
      toast.success('Đổi quyền thành công');
      fetchAccounts();
    } catch {
      toast.error('Đổi quyền thất bại');
    } finally {
      setShowRoleModal(false);
      setSelectedAccount(null);
    }
  };

  const handleDisable = async () => {
    if (!selectedAccount) return;
    try {
      await api.put(`/admin/auth/disable/${selectedAccount.account_id}`);
      toast.success('Đã vô hiệu hóa tài khoản');
      fetchAccounts();
    } catch {
      toast.error('Vô hiệu hóa thất bại');
    } finally {
      setShowDisableModal(false);
      setSelectedAccount(null);
    }
  };

  const getRoleLabel = (role: number) => {
    switch (role) {
      case 0: return 'Quản trị viên';
      default: return 'Khách hàng';
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
    <div className="px-4 py-6 w-full max-w-[1600px] mx-auto fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shadow-inner">
            <i className="bi bi-people text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Tài khoản</h1>
            <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
              <Link href="/admin" className="cursor-pointer hover:text-blue-600 transition-colors">Bảng điều khiển</Link>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-700">Người dùng</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/admin/users/trash" className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors">
            <i className="bi bi-person-x"></i>
            Đã khóa <span className="bg-red-200 text-red-700 px-2 py-0.5 rounded-full text-xs ml-1">{trashCount}</span>
          </Link>
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
              placeholder="Tìm kiếm theo Tên, Email..."
            />
          </form>
          <div className="flex items-center gap-2">
            {/* Removed Role Filter as requested */}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-xs text-gray-500 uppercase tracking-wider">
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
                <tr key={account.account_id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${account.Role === 0 ? 'text-purple-600' : 'text-gray-500'}`}>
                      #{account.account_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold border border-gray-200 overflow-hidden shadow-sm flex-shrink-0">
                        {account.Avatar ? (
                          <img src={getMediaUrl(account.Avatar, '/images/default.png')} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (account.Name || account.email || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 line-clamp-1">
                          {account.Name || 'Chưa cập nhật'}
                        </span>
                        {account.Role === 0 && (
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase w-max mt-1">Admin</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-600 flex items-center gap-2"><i className="bi bi-envelope text-gray-400"></i> {account.email || '---'}</span>
                      <span className="text-gray-600 flex items-center gap-2"><i className="bi bi-telephone text-gray-400"></i> {account.Phone || '---'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-500">
                    {formatDate(account.create_at)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <select
                      className="form-select bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 py-1.5 cursor-pointer shadow-sm hover:bg-gray-100 transition-colors"
                      value={account.Role}
                      onChange={(e) => {
                        setSelectedAccount(account);
                        setSelectedRole(parseInt(e.target.value));
                        setShowRoleModal(true);
                      }}
                    >
                      <option value={0}>Quản trị viên</option>
                      <option value={1}>Khách hàng</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ActionMenu
                      items={[
                        {
                          label: 'Xem hồ sơ',
                          onClick: () => {
                            window.location.href = `/admin/users/${account.account_id}`;
                          }
                        },
                        ...(account.Role !== 0
                          ? [
                              {
                                label: 'Khóa tài khoản',
                                tone: 'danger' as const,
                                onClick: () => {
                                  setSelectedAccount(account);
                                  setShowDisableModal(true);
                                }
                              }
                            ]
                          : [])
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center mb-3">
                        <i className="bi bi-people text-2xl text-gray-300"></i>
                      </div>
                      <p className="text-gray-500 font-medium text-lg">Không tìm thấy tài khoản nào</p>
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
        title="Khóa tài khoản"
        message={`Bạn có chắc chắn muốn khóa tài khoản "<strong class="text-red-600">${selectedAccount?.Name || selectedAccount?.email}</strong>"? Người này sẽ không thể đăng nhập.`}
        type="danger"
        onConfirm={handleDisable}
        onCancel={() => setShowDisableModal(false)}
      />

      <ConfirmModal
        isOpen={showRoleModal}
        title="Đổi quyền hạn"
        message={`Chuyển quyền tài khoản "<strong class="text-blue-600">${selectedAccount?.Name || selectedAccount?.email}</strong>" sang <strong class="text-blue-600">${getRoleLabel(selectedRole)}</strong>?`}
        type="warning"
        onConfirm={handleChangeRole}
        onCancel={() => setShowRoleModal(false)}
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
