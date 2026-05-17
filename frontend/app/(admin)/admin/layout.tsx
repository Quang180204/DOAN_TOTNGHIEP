'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/media';
import {
  ArchiveBoxIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  HomeIcon,
  Squares2X2Icon,
  TagIcon,
  UserCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Bảng điều khiển', href: '/admin', icon: HomeIcon },
  { name: 'Sản phẩm', href: '/admin/products', icon: ArchiveBoxIcon },
  { name: 'Đơn hàng', href: '/admin/orders', icon: CreditCardIcon },
  { name: 'Tài khoản', href: '/admin/users', icon: UserGroupIcon },
  { name: 'Danh mục', href: '/admin/genres', icon: Squares2X2Icon },
  { name: 'Thương hiệu', href: '/admin/brands', icon: TagIcon },
  { name: 'Khuyến mãi', href: '/admin/discounts', icon: TagIcon },
  { name: 'Đánh giá', href: '/admin/feedbacks', icon: ChatBubbleLeftRightIcon },
  { name: 'Phản hồi khách hàng', href: '/admin/contacts', icon: ChatBubbleLeftRightIcon }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState('/images/default.png');
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');

    if (!token || role !== '0') {
      router.push('/account/login');
      return;
    }
    setUserName(name || 'Admin');
    setAvatar(getMediaUrl(localStorage.getItem('userAvatar'), '/images/default.png'));
  }, [router]);

  useEffect(() => {
    const handleStorageChange = () => {
      setUserName(localStorage.getItem('userName') || 'Admin');
      setAvatar(getMediaUrl(localStorage.getItem('userAvatar'), '/images/default.png'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setShowAvatarDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('userPhone');
    router.push('/account/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf5ff_0%,#eff6ff_42%,#f8fbff_100%)]">
      <header className="sticky top-0 z-50 border-b border-cyan-100/80 bg-white/92 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-[0_18px_32px_-16px_rgba(37,99,235,0.82)]"
            >
              <HomeIcon className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Admin workspace</p>
              <p className="text-base font-semibold text-slate-900">Quản trị hệ thống</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 xl:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-[0_14px_24px_-16px_rgba(37,99,235,0.88)]'
                      : 'text-slate-600 hover:bg-cyan-50/70 hover:text-sky-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
              className="flex items-center gap-3 rounded-2xl border border-cyan-100/80 bg-white px-3 py-2 hover:bg-cyan-50/50"
            >
              <img
                className="h-10 w-10 rounded-xl object-cover"
                src={avatar}
                onError={(e) => {
                  e.currentTarget.src = '/images/default.png';
                }}
                alt="Avatar"
              />
              <div className="hidden text-left sm:block">
                <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </button>

            {showAvatarDropdown && (
              <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-cyan-100/80 bg-white shadow-2xl">
                <div className="tech-panel border-b border-cyan-300/20 px-4 py-4 text-white">
                  <p className="text-sm text-cyan-100">Tài khoản quản trị</p>
                  <p className="mt-1 truncate text-base font-semibold">{userName}</p>
                </div>
                <div className="p-2">
                  <Link
                    href="/admin/profile"
                    onClick={() => setShowAvatarDropdown(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-700 hover:bg-cyan-50/50"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    Chi tiết tài khoản
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mt-1 w-full rounded-xl px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
