'use client';

import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-xl z-50 lg:hidden transform transition-transform">
        <div className="flex justify-end p-4 border-b">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-8 text-center">
            <img src="/images/logo_black.png" alt="Quang's Shop" className="h-12 mx-auto" />
          </div>
          
          <nav className="space-y-4">
            <Link href="/" className="block text-gray-700 hover:text-yellow-600 py-2" onClick={onClose}>
              Trang Chủ
            </Link>
            <Link href="/products/laptop" className="block text-gray-700 hover:text-yellow-600 py-2" onClick={onClose}>
              Laptop
            </Link>
            <Link href="/products/accessories" className="block text-gray-700 hover:text-yellow-600 py-2" onClick={onClose}>
              Phụ kiện
            </Link>
            <Link href="/contact" className="block text-gray-700 hover:text-yellow-600 py-2" onClick={onClose}>
              Liên Hệ
            </Link>
            
            <div className="border-t pt-4 mt-4">
              <Link href="/account/login" className="block text-gray-700 hover:text-yellow-600 py-2" onClick={onClose}>
                Đăng nhập
              </Link>
              <Link href="/account/register" className="block text-gray-700 hover:text-yellow-600 py-2" onClick={onClose}>
                Đăng ký
              </Link>
            </div>
          </nav>
          
          <div className="mt-8 pt-8 border-t">
            <address className="text-gray-500 text-sm not-italic">
              <p>📍 12 Ngô Xuân Quảng,<br />Gia Lâm, Hà Nội</p>
              <p className="mt-2">📞 0986951018 </p>
              <p>📧 quang180204@gmail.com</p>
            </address>
          </div>
        </div>
      </div>
    </>
  );
}
