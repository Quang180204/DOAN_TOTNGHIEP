'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AccountSidebar from '@/components/client/account/Sidebar';
import { CameraIcon, UserIcon, PhoneIcon, EnvelopeIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const getAvatarUrl = (path: string) => {
    if (!path) return '/images/default-avatar.png';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (path.startsWith('/uploads')) {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
      return `${apiBase}${path}`;
    }
    return path;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/account/login?return=/account/profile');
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/account/profile');
      if (res.data.success) {
        setUser(res.data.user);
        setName(res.data.user.Name || '');
        setPhone(res.data.user.Phone || '');
        setAvatar(res.data.user.Avatar || '/images/default-avatar.png');
      }
    } catch (error) {
      console.error('Lỗi tải profile:', error);
      toast.error('Không thể tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!name) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    setUpdating(true);
    try {
      const res = await api.put('/account/profile', { Name: name, Phone: phone });
      if (res.data.success) {
        localStorage.setItem('userName', res.data.user.Name);
        toast.success('Cập nhật thông tin thành công');
        fetchProfile();
      }
    } catch (error) {
      toast.error('Cập nhật thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra kích thước file (tối đa 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 2MB');
      return;
    }

    // Kiểm tra định dạng
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/i.test(file.name);
    if (!isImage) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/account/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setAvatar(res.data.user.Avatar);
        localStorage.setItem('userAvatar', res.data.user.Avatar);
        toast.success('Cập nhật ảnh đại diện thành công');
        fetchProfile();
      }
    } catch (error) {
      toast.error('Cập nhật ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-700">Thông tin tài khoản</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <AccountSidebar />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                <h1 className="text-2xl font-bold text-white">Thông tin tài khoản</h1>
                <p className="text-blue-100 text-sm mt-1">Quản lý thông tin cá nhân của bạn</p>
              </div>

              {/* Avatar Section */}
              <div className="flex flex-col items-center py-8 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                    <img
                      src={getAvatarUrl(avatar)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <CameraIcon className="w-8 h-8 text-white" />
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  onClick={handleAvatarClick}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Thay đổi ảnh đại diện
                </button>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (tối đa 2MB)</p>
              </div>

              {/* Form Section */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Email - Readonly */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <EnvelopeIcon className="w-4 h-4 inline mr-1 text-blue-500" />
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <CheckBadgeIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
                  </div>

                  {/* Họ tên */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserIcon className="w-4 h-4 inline mr-1 text-blue-500" />
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="Nhập họ tên"
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <PhoneIcon className="w-4 h-4 inline mr-1 text-blue-500" />
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      onClick={updateProfile}
                      disabled={updating}
                      className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                      {updating ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Đang lưu...
                        </span>
                      ) : (
                        'Lưu thay đổi'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
