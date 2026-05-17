// components/admin/layout/SlideBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuSections = [
  {
    title: 'BẢNG ĐIỀU KHIỂN',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '📊' }
    ]
  },
  {
    title: 'QUẢN LÝ SẢN PHẨM',
    items: [
      { href: '/admin/products', label: 'Sản phẩm', icon: '📦' },
      { href: '/admin/brands', label: 'Thương hiệu', icon: '🏷️' },
      { href: '/admin/genres', label: 'Danh mục', icon: '📂' },
      { href: '/admin/discounts', label: 'Mã giảm giá', icon: '🎫' },
      { href: '/admin/feedbacks', label: 'Đánh giá', icon: '💬' },
      { href: '/admin/contacts', label: 'Liên hệ', icon: '📨' }
    ]
  },
  {
    title: 'QUẢN LÝ ĐẶT HÀNG',
    items: [
      { href: '/admin/orders', label: 'Đơn hàng', icon: '📋' }
    ]
  },
  {
    title: 'QUẢN LÝ TÀI KHOẢN',
    items: [
      { href: '/admin/users', label: 'Tài khoản', icon: '👥' }
    ]
  }
];

interface SidebarProps {
  onLogout?: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <div className="aside-menu flex-column-fluid">
      <div className="menu menu-column menu-title-gray-800" id="#kt_aside_menu">
        {menuSections.map((section, idx) => (
          <div key={idx}>
            <div className="menu-item">
              <div className="menu-content pt-8 pb-0">
                <span className="menu-section text-muted text-uppercase fs-8 ls-1">
                  {section.title}
                </span>
              </div>
            </div>
            {section.items.map((item) => (
              <div key={item.href} className="menu-item">
                <Link
                  href={item.href}
                  className={`menu-link ${isActive(item.href) ? 'active' : ''}`}
                >
                  <span className="menu-icon">
                    <span className="svg-icon svg-icon-2">
                      {item.icon === '📊' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="2" y="2" width="9" height="9" rx="2" fill="black" />
                          <rect opacity="0.3" x="13" y="2" width="9" height="9" rx="2" fill="black" />
                          <rect opacity="0.3" x="13" y="13" width="9" height="9" rx="2" fill="black" />
                          <rect opacity="0.3" x="2" y="13" width="9" height="9" rx="2" fill="black" />
                        </svg>
                      )}
                      {item.icon === '📦' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path opacity="0.3" d="M21 13H15V11H21C21.6 11 22 10.6 22 10C22 9.4 21.6 9 21 9H15V3C15 2.4 14.6 2 14 2C13.4 2 13 2.4 13 3V9H11V3C11 2.4 10.6 2 10 2C9.4 2 9 2.4 9 3V9H3C2.4 9 2 9.4 2 10C2 10.6 2.4 11 3 11H9V13H3C2.4 13 2 13.4 2 14C2 14.6 2.4 15 3 15H9V21C9 21.6 9.4 22 10 22C10.6 22 11 21.6 11 21V15H13V21C13 21.6 13.4 22 14 22C14.6 22 15 21.6 15 21V15H21C21.6 15 22 14.6 22 14C22 13.4 21.6 13 21 13Z" fill="black" />
                          <path d="M16 17H8C7.4 17 7 16.6 7 16V8C7 7.4 7.4 7 8 7H16C16.6 7 17 7.4 17 8V16C17 16.6 16.6 17 16 17ZM14 10H10V14H14V10Z" fill="black" />
                        </svg>
                      )}
                      {item.icon === '👥' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path opacity="0.3" d="M20.5543 4.37824L12.1798 2.02473C12.0626 1.99176 11.9376 1.99176 11.8203 2.02473L3.44572 4.37824C3.18118 4.45258 3 4.6807 3 4.93945V13.569C3 14.6914 3.48509 15.8404 4.4417 16.984C5.17231 17.8575 6.18314 18.7345 7.446 19.5909C9.56752 21.0295 11.6566 21.912 11.7445 21.9488C11.8258 21.9829 11.9129 22 12.0001 22C12.0872 22 12.1744 21.983 12.2557 21.9488C12.3435 21.912 14.4326 21.0295 16.5541 19.5909C17.8169 18.7345 18.8277 17.8575 19.5584 16.984C20.515 15.8404 21 14.6914 21 13.569V4.93945C21 4.6807 20.8189 4.45258 20.5543 4.37824Z" fill="black" />
                          <path d="M12.0006 11.1542C13.1434 11.1542 14.0777 10.22 14.0777 9.0771C14.0777 7.93424 13.1434 7 12.0006 7C10.8577 7 9.92348 7.93424 9.92348 9.0771C9.92348 10.22 10.8577 11.1542 12.0006 11.1542Z" fill="black" />
                          <path d="M15.5652 13.814C15.5108 13.6779 15.4382 13.551 15.3566 13.4331C14.9393 12.8163 14.2954 12.4081 13.5697 12.3083C13.479 12.2993 13.3793 12.3174 13.3067 12.3718C12.9257 12.653 12.4722 12.7981 12.0006 12.7981C11.5289 12.7981 11.0754 12.653 10.6944 12.3718C10.6219 12.3174 10.5221 12.2902 10.4314 12.3083C9.70578 12.4081 9.05272 12.8163 8.64456 13.4331C8.56293 13.551 8.49036 13.687 8.43595 13.814C8.40875 13.8684 8.41781 13.9319 8.44502 13.9864C8.51759 14.1133 8.60828 14.2403 8.68991 14.3492C8.81689 14.5215 8.95295 14.6757 9.10715 14.8208C9.23413 14.9478 9.37925 15.0657 9.52439 15.1836C10.2409 15.7188 11.1026 15.9999 11.9915 15.9999C12.8804 15.9999 13.7421 15.7188 14.4586 15.1836C14.6038 15.0748 14.7489 14.9478 14.8759 14.8208C15.021 14.6757 15.1661 14.5215 15.2931 14.3492C15.3838 14.2312 15.4655 14.1133 15.538 13.9864C15.5833 13.9319 15.5924 13.8684 15.5652 13.814Z" fill="black" />
                        </svg>
                      )}
                      {!['📊', '📦', '👥'].includes(item.icon) && (
                        <span className="svg-icon svg-icon-2">🔹</span>
                      )}
                    </span>
                  </span>
                  <span className="menu-title">{item.label}</span>
                </Link>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
