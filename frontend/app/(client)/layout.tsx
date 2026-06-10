'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/client/layout/Header';
import Footer from '@/components/client/layout/Footer';
import MobileMenu from '@/components/client/layout/MobileMenu';
import CartSidebar from '@/components/client/layout/CartSidebar';
import ToastNotification from '@/components/client/common/ToastNotification';
import ChatbotWidget from '@/components/client/common/ChatbotWidget';
import api from '@/lib/api';

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
    let active = true;

    const getCartCount = async () => {
      try {
        const response = await api.get('/cart/preview');
        const quantities = Array.isArray(response.data.quantities) ? response.data.quantities : [];
        const count = quantities.reduce((sum: number, quantity: unknown) => {
          const parsedQuantity = Number(quantity);
          return sum + (Number.isFinite(parsedQuantity) ? parsedQuantity : 0);
        }, 0);

        if (active) setCartCount(count);
      } catch {
        if (active) setCartCount(0);
      }
    };

    const handleCartUpdated = () => {
      void getCartCount();
    };

    void getCartCount();
    window.addEventListener('cartUpdated', handleCartUpdated);

    return () => {
      active = false;
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
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
