// components/admin/layout/Header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

export default function AdminHeader({ onMenuClick, userName = 'Admin' }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    window.location.href = '/account/login';
  };

  return (
    <div id="kt_header" className="header align-items-stretch">
      <div className="container-fluid d-flex align-items-stretch justify-content-between">
        {/* Mobile menu toggle */}
        <div className="d-flex align-items-center d-lg-none ms-n2 me-2">
          <div className="btn btn-icon btn-active-light-primary w-30px h-30px" onClick={onMenuClick}>
            <span className="svg-icon svg-icon-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 7H3C2.4 7 2 6.6 2 6V4C2 3.4 2.4 3 3 3H21C21.6 3 22 3.4 22 4V6C22 6.6 21.6 7 21 7Z" fill="black" />
                <path opacity="0.3" d="M21 14H3C2.4 14 2 13.6 2 13V11C2 10.4 2.4 10 3 10H21C21.6 10 22 10.4 22 11V13C22 13.6 21.6 14 21 14ZM22 20V18C22 17.4 21.6 17 21 17H3C2.4 17 2 17.4 2 18V20C2 20.6 2.4 21 3 21H21C21.6 21 22 20.6 22 20Z" fill="black" />
              </svg>
            </span>
          </div>
        </div>

        {/* Mobile logo */}
        <div className="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
          <Link href="/admin" className="d-lg-none">
            <img alt="Logo" src="/Images/Admin/assets/media/logos/logo-2.svg" className="h-30px" />
          </Link>
        </div>

        {/* Right side */}
        <div className="d-flex align-items-stretch justify-content-between flex-lg-grow-1">
          <div className="d-flex align-items-stretch" id="kt_header_nav"></div>
          <div className="d-flex align-items-stretch flex-shrink-0">
            <div className="d-flex align-items-center ms-1 ms-lg-3" id="kt_header_user_menu_toggle">
              <div className="cursor-pointer symbol symbol-30px symbol-md-40px" onClick={() => setShowUserMenu(!showUserMenu)}>
                <img src="/Images/Admin/assets/media/avatars/300-1.jpg" alt="user" />
              </div>
              
              {/* User dropdown menu */}
              {showUserMenu && (
                <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-275px show" style={{ position: 'absolute', top: '60px', right: '20px', zIndex: 100 }}>
                  <div className="menu-item px-3">
                    <div className="menu-content d-flex align-items-center px-3">
                      <div className="symbol symbol-50px me-5">
                        <img alt="Logo" src="/Images/Admin/assets/media/avatars/300-1.jpg" />
                      </div>
                      <div className="d-flex flex-column">
                        <div className="fw-bolder d-flex align-items-center fs-5">{userName}</div>
                        <a href="#" className="fw-bold text-muted text-hover-primary fs-7">Administrator</a>
                      </div>
                    </div>
                  </div>
                  <div className="separator my-2"></div>
                  <div className="menu-item px-5 my-1">
                    <Link href="/" className="menu-link px-5">Về trang chủ</Link>
                  </div>
                  <div className="menu-item px-5">
                    <button onClick={handleLogout} className="menu-link px-5 w-100 text-start">Đăng xuất</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}