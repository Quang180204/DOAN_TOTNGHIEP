// app/(admin)/admin/profile/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';
import toast from 'react-hot-toast';


export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('/images/default.png');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '/images/default.png'
  });

  const getAvatarUrl = (path: string) => getMediaUrl(path, '/images/default.png');

  const fetchProfile = async () => {
    try {
      const res = await api.get('/account/profile');
      if (res.data.success && res.data.user) {
        const u = res.data.user;
        setFormData({
          name: u.Name || '',
          email: u.email || '',
          phone: u.Phone || '',
          avatar: u.Avatar || '/images/default.png'
        });
        setAvatarPreview(u.Avatar || '/images/default.png');
        
        // Update localStorage to stay in sync
        localStorage.setItem('userName', u.Name || '');
        localStorage.setItem('userEmail', u.email || '');
        localStorage.setItem('userPhone', u.Phone || '');
        localStorage.setItem('userAvatar', u.Avatar || '/images/default.png');
      }
    } catch (error) {
      console.error('Lỗi tải hồ sơ:', error);
      toast.error('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    if (file.type && !file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    setSelectedAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng điền Họ tên');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put('/account/profile', {
        Name: formData.name,
        Phone: formData.phone
      });

      if (res.data.success) {
        let updatedUser = res.data.user;
        if (selectedAvatarFile) {
          const avatarForm = new FormData();
          avatarForm.append('avatar', selectedAvatarFile);
          const avatarRes = await api.post('/account/upload-avatar', avatarForm, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (avatarRes.data.success) {
            updatedUser = avatarRes.data.user;
            setAvatarPreview(updatedUser?.Avatar || '/images/default.png');
            setSelectedAvatarFile(null);
          }
        }

        localStorage.setItem('userName', updatedUser?.Name || formData.name);
        localStorage.setItem('userPhone', updatedUser?.Phone || formData.phone);
        localStorage.setItem('userAvatar', updatedUser?.Avatar || formData.avatar);
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        window.dispatchEvent(new Event('storage'));
        toast.success('Cập nhật thông tin thành công!');
        
        // Chuyển về trang admin sau khi cập nhật thành công
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      } else {
        toast.error(res.data.message || 'Cập nhật thất bại');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 w-full max-w-[1000px] mx-auto opacity-100">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
            <i className="bi bi-person-lines-fill text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Chi tiết tài khoản</h1>
            <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
              <span onClick={() => router.push('/admin')} className="cursor-pointer hover:text-blue-600 transition-colors">Bảng điều khiển</span>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-gray-700">Hồ sơ cá nhân</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            
            {/* Left: Form Section */}
            <div className="flex-1 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Thông tin cá nhân</h3>
              
              <div className="space-y-5">
                {/* Họ và tên */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <i className="bi bi-person text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-12 w-full h-12 bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block shadow-sm transition-colors"
                      placeholder="Nhập họ và tên"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-xs text-gray-400 font-normal">(Không thể thay đổi)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <i className="bi bi-envelope text-gray-400"></i>
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      className="pl-12 w-full h-12 bg-gray-50 border border-gray-200 text-gray-400 text-sm rounded-xl block shadow-sm cursor-not-allowed select-none"
                      readOnly
                      disabled
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <i className="bi bi-telephone text-gray-400"></i>
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-12 w-full h-12 bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block shadow-sm transition-colors"
                      placeholder="Nhập số điện thoại"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Role badge */}
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <i className="bi bi-shield-check text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-900">Quản trị viên hệ thống</p>
                    <p className="text-xs text-indigo-500 mt-0.5">Bạn có toàn quyền quản lý hệ thống</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-8 mt-6 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-[15px] font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                >
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang xử lý...</>
                  ) : (
                    <><i className="bi bi-check2-circle"></i> Cập nhật</>
                  )}
                </button>
              </div>
            </div>


            {/* Right: Avatar Section */}
            <div className="w-full md:w-80 bg-gradient-to-b from-gray-50 to-white p-8 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col items-center justify-start">
              <h3 className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-wider w-full text-center">Ảnh đại diện</h3>
              
              {/* Avatar Display */}
              <div className="relative mb-6">
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white ring-4 ring-gray-100">
                  <img
                    src={getAvatarUrl(avatarPreview)}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = '/images/default.png' }}
                  />
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>

              <p className="text-sm font-bold text-gray-900 text-center mb-1">{formData.name}</p>
              <p className="text-xs text-gray-400 text-center mb-6">{formData.email}</p>

              {/* Change Avatar Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                <i className="bi bi-camera text-lg"></i>
                Thay đổi Avatar
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.jpg,.jpeg,.png,.webp"
                className="hidden"
              />
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
