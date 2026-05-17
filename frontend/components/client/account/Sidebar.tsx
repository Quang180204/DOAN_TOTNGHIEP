'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPinIcon,
  ArrowRightOnRectangleIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function AccountSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/account/profile', label: 'Thông tin tài khoản', icon: UserCircleIcon },
    { href: '/orders', label: 'Lịch sử mua hàng', icon: ShoppingBagIcon },
    { href: '/account/address', label: 'Sổ địa chỉ', icon: MapPinIcon },
    { href: '/account/change-password', label: 'Đổi mật khẩu', icon: ShieldCheckIcon }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  return (
    <aside className="surface-card overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tài khoản</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">Quản lý thông tin cá nhân</p>
      </div>

      <div className="p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
