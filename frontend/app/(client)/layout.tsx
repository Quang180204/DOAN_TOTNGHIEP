'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/client/layout/Header';
import Footer from '@/components/client/layout/Footer';
import MobileMenu from '@/components/client/layout/MobileMenu';
import CartSidebar from '@/components/client/layout/CartSidebar';
import ToastNotification from '@/components/client/common/ToastNotification';
import ChatbotWidget from '@/components/client/common/ChatbotWidget';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const isLoginPage = pathname === '/account/login';

  useEffect(() => {
    const getCartCount = () => {
      const cookies = document.cookie.split(';');
      let count = 0;
      cookies.forEach(cookie => {
        if (cookie.trim().startsWith('product_')) {
          const quantity = parseInt(cookie.split('=')[1]);
          if (!isNaN(quantity)) count += quantity;
        }
      });
      setCartCount(count);
    };
    getCartCount();
    window.addEventListener('cartUpdated', getCartCount);
    return () => window.removeEventListener('cartUpdated', getCartCount);
  }, []);

  return (
    <>
      {!isLoginPage && (
        <>
          <Header 
            cartCount={cartCount} 
            onCartOpen={() => setIsCartOpen(true)}
            onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          />
          <MobileMenu 
            isOpen={isMobileMenuOpen} 
            onClose={() => setIsMobileMenuOpen(false)} 
          />
          <CartSidebar 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)}
            onCartUpdate={() => {
              const event = new Event('cartUpdated');
              window.dispatchEvent(event);
            }}
          />
        </>
      )}
      <main className={isLoginPage ? 'min-h-screen' : 'min-h-screen pt-20'}>{children}</main>
      <Footer />
      {!isLoginPage && <ChatbotWidget />}
      
      <ToastNotification />
    </>
  );
}
