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

      try {
        await api.post('/cart/momo/confirm', {
          orderId: extraOrderId,
          resultCode,
          selectedProductIds: new URLSearchParams(savedQuery).get('items')?.split(',').map(Number).filter(Boolean),
          buyNowProductId: Number(new URLSearchParams(savedQuery).get('buyNow') || 0) || undefined,
          buyNowQuantity: Number(new URLSearchParams(savedQuery).get('buyNowQuantity') || 0) || undefined
        });

        sessionStorage.removeItem(`momo_order_${extraOrderId}`);
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Thanh toán đơn hàng thành công');
        router.replace(`/orders/${extraOrderId}`);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Thanh toán MoMo thất bại');
        router.replace('/checkout');
      }
    };

    confirmPayment();
  }, []);

  return <div className="min-h-screen flex items-center justify-center">Đang xác nhận thanh toán MoMo...</div>;
}

export default function MomoResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang xác nhận thanh toán MoMo...</div>}>
      <MomoResultContent />
    </Suspense>
  );
}
