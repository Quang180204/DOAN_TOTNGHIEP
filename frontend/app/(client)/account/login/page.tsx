'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng nhập email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/account/login', {
        Email: email,
        Password: password
      });

      if (res.data.success) {
        const user = res.data.user;
        const userRole = user?.Role;

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userRole', userRole.toString());
        localStorage.setItem('userId', user?.account_id.toString());
        localStorage.setItem('userName', user?.Name || '');
        localStorage.setItem('userEmail', user?.email || '');
        localStorage.setItem('userAvatar', user?.Avatar || '/images/default.png');

        document.cookie = `token=${res.data.token}; path=/; max-age=604800`;
        document.cookie = `userRole=${userRole}; path=/; max-age=604800`;

        toast.success('Đăng nhập thành công');
        window.location.href = userRole === 0 ? '/admin' : '/';
      } else {
        toast.error(res.data.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950 pt-24"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(37,99,235,.88), rgba(14,116,144,.72), rgba(15,23,42,.82)), url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2200&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.24),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.22),transparent_30%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(125,211,252,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.16)_1px,transparent_1px)] [background-size:38px_38px]" />

      <div className="relative z-10 grid min-h-screen w-full grid-cols-1 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="flex items-center px-8 py-12 lg:px-16 lg:py-16">
          <div className="max-w-2xl text-white">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-cyan-50 backdrop-blur-xl">
              <i className="bi bi-stars text-2xl" />
              <span className="text-sm font-bold tracking-[0.12em] uppercase">Không gian mua sắm công nghệ</span>
            </div>

            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.02] text-white [text-shadow:0_10px_32px_rgba(15,23,42,0.58)] xl:text-6xl">
              Kết nối đam mê, săn deal cực chất.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/90 [text-shadow:0_6px_24px_rgba(15,23,42,0.5)]">
              Trở thành một phần của cộng đồng Quang&apos;s Shop để nhận thông báo khuyến mãi độc quyền và quản lý đơn hàng theo cách rõ ràng hơn.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['Ưu đãi riêng', 'Cập nhật deal mới nhanh hơn'],
                ['Đơn hàng rõ ràng', 'Theo dõi trạng thái theo từng bước'],
                ['Tài khoản tập trung', 'Quản lý địa chỉ và lịch sử mua']
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-xl">
                  <p className="text-sm font-semibold text-cyan-100">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/80">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-20 flex items-center justify-center px-8 py-12 lg:py-16">
          <div className="w-full max-w-md rounded-[28px] border border-cyan-100/70 bg-white p-10 shadow-[0_28px_80px_-42px_rgba(37,99,235,0.5)]">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-slate-900">Đăng nhập</h2>
              <p className="mt-2 text-slate-500">Nhập thông tin tài khoản của bạn bên dưới</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 ml-1 block text-sm font-bold text-slate-700">Email</label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-sky-600">
                    <i className="bi bi-envelope-at text-lg" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-2xl border border-cyan-100/80 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 ml-1 flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-700">Mật khẩu</label>
                  <Link href="/account/forgot-password" className="text-xs font-bold text-sky-600 hover:text-sky-700">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-sky-600">
                    <i className="bi bi-key text-lg" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-2xl border border-cyan-100/80 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-8 flex w-full justify-center gap-3 py-4 text-lg font-black disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span>Đăng nhập ngay</span>
                    <i className="bi bi-arrow-right text-xl" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm text-slate-500">
                Chưa có tài khoản?{' '}
                <Link href="/account/register" className="font-black text-sky-600 hover:underline underline-offset-4">
                  Đăng ký mới
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
