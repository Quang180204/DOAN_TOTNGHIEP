'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

function MomoResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const confirmPayment = async () => {
      const resultCode = Number(searchParams.get('resultCode') || '1');
      const extraOrderId = Number(searchParams.get('orderId')?.split('_')[0]?.replace('MOMO', '') || 0);
      const savedQuery = sessionStorage.getItem(`momo_order_${extraOrderId}`) || '';
      const checkoutUrl = savedQuery ? `/checkout?${savedQuery}` : '/checkout';
      const savedParams = new URLSearchParams(savedQuery);

      try {
        await api.post('/cart/momo/confirm', {
          orderId: extraOrderId,
          resultCode,
          selectedProductIds: savedParams.get('items')?.split(',').map(Number).filter(Boolean),
          buyNowProductId: Number(savedParams.get('buyNow') || 0) || undefined,
          buyNowQuantity: Number(savedParams.get('buyNowQuantity') || 0) || undefined
        });

        sessionStorage.removeItem(`momo_order_${extraOrderId}`);
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Thanh toán đơn hàng thành công');
        router.replace('/');
      } catch (error: any) {
        if (extraOrderId) {
          sessionStorage.removeItem(`momo_order_${extraOrderId}`);
        }
        if (resultCode !== 0) {
          toast('Đã quay lại trang thanh toán. Đơn hàng chưa hoàn tất.');
        } else {
          toast.error(error.response?.data?.message || 'Thanh toán MoMo thất bại');
        }
        router.replace(checkoutUrl);
      }
    };

    confirmPayment();
  }, [router, searchParams]);

  return <div className="min-h-screen flex items-center justify-center">Đang xác nhận thanh toán MoMo...</div>;
}

export default function MomoResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang xác nhận thanh toán MoMo...</div>}>
      <MomoResultContent />
    </Suspense>
  );
}
