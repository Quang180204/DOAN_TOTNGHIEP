'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BellIcon,
  Bars3Icon,
  ChevronDownIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { clearWishlistCache, getWishlistCount } from '@/lib/wishlist';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';
import { authUpdatedEvent, clearAuthSession } from '@/lib/auth';

interface HeaderProps {
  cartCount: number;
  onCartOpen: () => void;
  onMobileMenuOpen: () => void;
}

export default function Header({ cartCount, onCartOpen, onMobileMenuOpen }: HeaderProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('/images/default.png');
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    if (token) {
      setIsLoggedIn(true);
      setUserName(name || '');
      setUserAvatar(getMediaUrl(localStorage.getItem('userAvatar'), '/images/default.png'));
      getWishlistCount().then(setWishlistCount);
    } else {
      setWishlistCount(0);
      setUserAvatar('/images/default.png');
    }

    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (!token || userRole === '0') return;

    api
      .get('/orders?size=5')
      .then((res) => {
        if (!res.data.success) return;
        const nextNotifications = (res.data.data || [])
          .filter((order: any) => ['2', '3', '0'].includes(order.status))
          .map((order: any) => ({
            id: `${order.order_id}-${order.status}`,
            orderId: order.order_id,
            status: order.status,
            text:
              order.status === '3'
                ? `Đơn hàng #${order.order_id} đã hoàn thành`
                : order.status === '2'
                  ? `Đơn hàng #${order.order_id} đang được xử lý`
                  : `Đơn hàng #${order.order_id} đã bị hủy`,
            time: order.update_at || order.oder_date
          }));
        setNotifications(nextNotifications);

        const seen = JSON.parse(localStorage.getItem('seenNotifications') || '[]') as string[];
        setUnseenCount(nextNotifications.filter((item: any) => !seen.includes(item.id)).length);
      })
      .catch(() => undefined);
  }, [isLoggedIn]);

  useEffect(() => {
    const handleWishlistUpdated = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setWishlistCount(0);
        return;
      }
      getWishlistCount().then(setWishlistCount);
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdated);
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdated);
  }, []);

  useEffect(() => {
    const syncUserState = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(Boolean(token));
      setUserName(localStorage.getItem('userName') || '');
      setUserAvatar(getMediaUrl(localStorage.getItem('userAvatar'), '/images/default.png'));
    };

    window.addEventListener('storage', syncUserState);
    window.addEventListener(authUpdatedEvent, syncUserState);
    return () => {
      window.removeEventListener('storage', syncUserState);
      window.removeEventListener(authUpdatedEvent, syncUserState);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    clearWishlistCache();
    setIsLoggedIn(false);
    setWishlistCount(0);
    setUserAvatar('/images/default.png');
    setIsUserMenuOpen(false);
    window.location.href = '/';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?s=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleWishlistClick = () => {
    if (!localStorage.getItem('token')) {
      toast.error('Vui lòng đăng nhập để dùng danh sách yêu thích');
      router.push('/account/login?return=/wishlist');
      return;
    }

    router.push('/wishlist');
  };

  const openNotifications = () => {
    const nextOpen = !isNotificationOpen;
    setIsNotificationOpen(nextOpen);
    if (!nextOpen) return;

    const seen = JSON.parse(localStorage.getItem('seenNotifications') || '[]') as string[];
    const merged = Array.from(new Set([...seen, ...notifications.map((item) => item.id)]));
    localStorage.setItem('seenNotifications', JSON.stringify(merged));
    setUnseenCount(0);
  };

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/products/laptop', label: 'Laptop' },
    { href: '/products/accessories', label: 'Phụ kiện' },
    { href: '/contact', label: 'Liên hệ' }
  ];

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-2xl' : ''}`}>
        <div className="container-custom">
          <div
            className={`mt-3 flex min-h-16 items-center justify-between rounded-[26px] border px-4 shadow-[0_26px_80px_-38px_rgba(37,99,235,0.55)] backdrop-blur-2xl sm:px-5 ${
              scrolled
                ? 'border-cyan-100/80 bg-white/76'
                : 'border-cyan-100/60 bg-white/62'
            }`}
          >
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-lg font-bold text-white shadow-[0_16px_28px_-12px_rgba(37,99,235,0.8)]">
                  Q
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-[0.18em] text-cyan-700">QUANG&apos;S SHOP</p>
                  <p className="text-sm font-medium text-slate-700">Laptop và phụ kiện công nghệ</p>
                </div>
              </Link>

              <nav className="hidden items-center gap-1 lg:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-cyan-50/80 hover:text-sky-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="rounded-xl p-2.5 text-slate-600 transition hover:bg-cyan-50/80 hover:text-sky-700">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>

              <button onClick={handleWishlistClick} className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-cyan-50/80 hover:text-sky-700">
                <HeartIcon className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-1 text-[11px] font-semibold text-white">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {isLoggedIn && (
                <div className="relative" ref={notificationRef}>
                  <button onClick={openNotifications} className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-cyan-50/80 hover:text-sky-700">
                    <BellIcon className="h-5 w-5" />
                    {unseenCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-1 text-[11px] font-semibold text-white">
                        {unseenCount}
                      </span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-cyan-100/80 bg-white shadow-2xl">
                      <div className="border-b border-cyan-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">Thông báo đơn hàng</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-slate-500">Chưa có thông báo mới.</div>
                        ) : (
                          notifications.map((item) => (
                            <Link
                              key={item.id}
                              href={`/orders/${item.orderId}`}
                              onClick={() => setIsNotificationOpen(false)}
                              className="block border-b border-cyan-50 px-4 py-3 hover:bg-cyan-50/50"
                            >
                              <p className="text-sm font-medium text-slate-900">{item.text}</p>
                              <p className="mt-1 text-xs text-slate-400">{new Date(item.time).toLocaleString('vi-VN')}</p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={onCartOpen} className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-cyan-50/80 hover:text-sky-700">
                <ShoppingBagIcon className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-1 text-[11px] font-semibold text-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {isLoggedIn ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 rounded-xl border border-cyan-100/80 bg-white/74 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50/50"
                  >
                    <img
                      src={userAvatar}
                      alt={userName || 'Tài khoản'}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-100"
                      onError={(event) => {
                        event.currentTarget.src = '/images/default.png';
                      }}
                    />
                    <span className="hidden max-w-[140px] truncate md:inline">{userName}</span>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-cyan-100/80 bg-white shadow-2xl">
                      <div className="tech-panel border-b border-cyan-300/20 px-5 py-4 text-white">
                        <p className="text-sm text-cyan-100">Tài khoản</p>
                        <p className="mt-1 truncate text-base font-semibold">{userName}</p>
                      </div>

                      <div className="p-2">
                        {[
                          { href: '/orders', title: 'Lịch sử đơn hàng', desc: 'Xem các đơn đã mua' },
                          { href: '/account/address', title: 'Sổ địa chỉ', desc: 'Quản lý địa chỉ giao hàng' },
                          { href: '/account/profile', title: 'Thông tin cá nhân', desc: 'Cập nhật hồ sơ' },
                          { href: '/account/change-password', title: 'Đổi mật khẩu', desc: 'Bảo mật tài khoản' }
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block rounded-xl px-4 py-3 hover:bg-cyan-50/50"
                          >
                            <p className="text-sm font-medium text-slate-900">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                          </Link>
                        ))}

                        <button onClick={handleLogout} className="mt-1 block w-full rounded-xl px-4 py-3 text-left hover:bg-red-50">
                          <p className="text-sm font-medium text-red-600">Đăng xuất</p>
                          <p className="mt-1 text-xs text-red-400">Thoát tài khoản hiện tại</p>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/account/login" className="btn-primary hidden sm:inline-flex">
                  Đăng nhập
                </Link>
              )}

              <button onClick={onMobileMenuOpen} className="rounded-xl p-2.5 text-slate-600 transition hover:bg-cyan-50/80 lg:hidden">
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {isSearchOpen && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-cyan-100/80 bg-white p-4 shadow-xl">
              <form onSubmit={handleSearch} className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="input-modern flex-1"
                  autoFocus
                />
                <button type="submit" className="btn-primary whitespace-nowrap">
                  Tìm kiếm
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

    </>
  );
}
