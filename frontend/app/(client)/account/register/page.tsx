'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { persistAuthSession } from '@/lib/auth';
import { toggleWishlist } from '@/lib/wishlist';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/account/register', {
        Name: name,
        Email: email,
        Password: password,
        Phone: phone
      });
      if (res.data.success) {
        persistAuthSession(res.data.token, res.data.user);

        const pendingWishlistProductId = Number(sessionStorage.getItem('pendingWishlistProductId') || 0);
        if (pendingWishlistProductId) {
          try {
            await toggleWishlist(pendingWishlistProductId);
          } catch {
            toast.error('Tài khoản đã được tạo nhưng chưa thể thêm sản phẩm yêu thích');
          } finally {
            sessionStorage.removeItem('pendingWishlistProductId');
          }
        }

        toast.success('Đăng ký thành công!');
        const returnUrl =
          new URLSearchParams(window.location.search).get('return') ||
          sessionStorage.getItem('postAuthReturnUrl');
        sessionStorage.removeItem('postAuthReturnUrl');
        window.location.href = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
      } else {
        toast.error(res.data.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6 text-center">
          <Link href="/" className="hover:text-yellow-600">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Đăng ký</span>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Đăng ký tài khoản</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0987654321"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 6 ký tự</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-gray-600">Đã có tài khoản?</span>
            <Link href="/account/login" className="ml-2 text-yellow-600 hover:underline font-medium">
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        {/* Thông tin shop */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
          <p>🏠 12 Ngô Xuân Quảng, Gia Lâm, Hà Nội</p>
          <p>📞 0986 951 018</p>
          <p>📧 quang180204@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
