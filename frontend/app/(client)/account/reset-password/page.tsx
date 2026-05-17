'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Mã xác nhận không hợp lệ');
      router.push('/account/login');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
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
      const res = await api.post('/account/reset-password', {
        token,
        newPassword: password
      });
      if (res.data.success) {
        setSubmitted(true);
        toast.success('Đặt lại mật khẩu thành công!');
        setTimeout(() => {
          router.push('/account/login');
        }, 2000);
      } else {
        toast.error(res.data.message || 'Đặt lại mật khẩu thất bại');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đặt lại mật khẩu thất bại');
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
          <Link href="/account/login" className="hover:text-yellow-600">Đăng nhập</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Đặt lại mật khẩu</span>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Đặt lại mật khẩu</h1>

          {submitted ? (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-600 mb-4">
                Đặt lại mật khẩu thành công!
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Đang chuyển hướng đến trang đăng nhập...
              </p>
              <Link
                href="/account/login"
                className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600"
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-gray-600 text-center mb-6">
                Vui lòng nhập mật khẩu mới cho tài khoản của bạn
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
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
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Đang tải...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
