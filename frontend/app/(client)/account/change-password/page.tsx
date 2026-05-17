'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AccountSidebar from '@/components/client/account/Sidebar';
import { LockClosedIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/account/login?return=/account/change-password');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oldPassword || !newPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put('/account/change-password', { oldPassword, newPassword });
      if (res.data.success) {
        toast.success('Đổi mật khẩu thành công');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition">Trang chủ</Link>
          <span>/</span>
          <Link href="/account/profile" className="hover:text-blue-600 transition">Tài khoản</Link>
          <span>/</span>
          <span className="text-gray-700">Đổi mật khẩu</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <AccountSidebar />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                <h1 className="text-2xl font-bold text-white">Đổi mật khẩu</h1>
                <p className="text-blue-100 text-sm mt-1">Bảo mật tài khoản của bạn</p>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                  {/* Mật khẩu cũ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <LockClosedIcon className="w-4 h-4 inline mr-1 text-blue-500" />
                      Mật khẩu cũ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none pr-12"
                        placeholder="Nhập mật khẩu cũ"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Mật khẩu mới */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <KeyIcon className="w-4 h-4 inline mr-1 text-blue-500" />
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="Nhập mật khẩu mới"
                    />
                    <p className="text-xs text-gray-400 mt-1">Mật khẩu phải có ít nhất 6 ký tự</p>
                  </div>

                  {/* Xác nhận mật khẩu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ShieldCheckIcon className="w-4 h-4 inline mr-1 text-blue-500" />
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="Xác nhận mật khẩu mới"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 flex gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Đang xử lý...
                        </span>
                      ) : (
                        'Đổi mật khẩu'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                    >
                      Làm mới
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}