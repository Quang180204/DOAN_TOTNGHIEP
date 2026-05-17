'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/account/forgot-password', { Email: email });
      if (res.data.success) {
        setSubmitted(true);
        toast.success('Link đặt lại mật khẩu đã được gửi!');
      } else {
        toast.error(res.data.message || 'Gửi yêu cầu thất bại');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gửi yêu cầu thất bại');
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
          <span className="text-gray-700">Quên mật khẩu</span>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Quên mật khẩu</h1>

          {submitted ? (
            <div className="text-center">
              <div className="text-6xl mb-4">📧</div>
              <p className="text-gray-600 mb-4">
                Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
              </p>
              <Link
                href="/account/login"
                className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-gray-600 text-center mb-6">
                Nhập email của bạn để nhận link đặt lại mật khẩu
              </p>

              <div className="mb-6">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 font-medium"
              >
                {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
              </button>

              <div className="text-center mt-6">
                <span className="text-gray-600">Bạn đã nhớ mật khẩu?</span>
                <Link href="/account/login" className="ml-2 text-yellow-600 hover:underline font-medium">
                  Đăng nhập ngay
                </Link>
              </div>
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