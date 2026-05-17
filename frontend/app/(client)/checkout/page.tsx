'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CreditCardIcon, ShieldCheckIcon, TruckIcon, WalletIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';

interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  priceAfterDiscount: number;
  quantity: number;
  image: string;
  itemTotal: number;
}

interface UserInfo {
  name: string;
  email: string;
  phone: string;
  defaultAddress: any;
}

interface Province {
  province_id: number;
  province_name: string;
}

interface District {
  district_id: number;
  district_name: string;
  type: string;
}

interface Ward {
  ward_id: number;
  ward_name: string;
  type: string;
}

interface PaymentMethod {
  payment_id: number;
  code: 'cod' | 'momo' | 'vnpay' | 'other';
  name: string;
  enabled: boolean;
  comingSoon: boolean;
}

const getPaymentLabel = (method: PaymentMethod): string => {
  if (method.code === 'cod') return 'Thanh toán khi nhận hàng';
  if (method.code === 'momo') return 'Momo';
  return method.name;
};

const clampCheckoutTotal = (subtotal: number, discount: number, shipping: number) =>
  Math.max(0, subtotal - discount + shipping);

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemsParam = searchParams.get('items') || '';
  const buyNow = searchParams.get('buyNow') || '';
  const buyNowQuantity = searchParams.get('buyNowQuantity') || '';

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('');
  const [total, setTotal] = useState(0);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const shippingFee = 30000;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (itemsParam) params.set('items', itemsParam);
    if (buyNow) params.set('buyNow', buyNow);
    if (buyNowQuantity) params.set('buyNowQuantity', buyNowQuantity);
    return params.toString();
  }, [itemsParam, buyNow, buyNowQuantity]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Vui lòng đăng nhập để thanh toán');
      router.push('/account/login?return=/checkout');
      return;
    }
    setIsLoggedIn(true);
    fetchCheckoutData();
    fetchProvinces();
  }, [queryString]);

  const fetchCheckoutData = async () => {
    try {
      const res = await api.get(`/cart/checkout${queryString ? `?${queryString}` : ''}`);

      if (res.data.success) {
        setCartItems(res.data.cartItems || []);
        const defaultAddress = res.data.user?.defaultAddress || null;
        setUser({
          name: res.data.user?.name || '',
          email: res.data.user?.email || '',
          phone: res.data.user?.phone || '',
          defaultAddress
        });
        if (defaultAddress) {
          setAddressDetail(defaultAddress.content || '');
          if (defaultAddress.province_id) {
            setSelectedProvince(String(defaultAddress.province_id));
            fetchDistricts(defaultAddress.province_id);
          }
          if (defaultAddress.district_id) {
            setSelectedDistrict(String(defaultAddress.district_id));
            fetchWards(defaultAddress.district_id);
          }
          if (defaultAddress.ward_id) {
            setSelectedWard(String(defaultAddress.ward_id));
          }
        }

        const methods = (res.data.paymentMethods || []) as PaymentMethod[];
        setPaymentMethods(methods);
        setSelectedPaymentId(methods.find((method) => method.code === 'cod')?.payment_id || methods[0]?.payment_id || null);

        setSubtotal(res.data.subtotal || 0);
        setDiscount(res.data.discount || 0);
        setAppliedDiscountCode(res.data.discountCode || '');
        setTotal(res.data.total || 0);
      }
    } catch {
      toast.error('Không thể tải dữ liệu thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res = await api.get('/location/provinces');
      if (res.data.success) setProvinces(res.data.data);
    } catch {}
  };

  const fetchDistricts = async (provinceId: number) => {
    try {
      const res = await api.get(`/location/districts/${provinceId}`);
      if (res.data.success) setDistricts(res.data.data);
    } catch {}
  };

  const fetchWards = async (districtId: number) => {
    try {
      const res = await api.get(`/location/wards/${districtId}`);
      if (res.data.success) setWards(res.data.data);
    } catch {}
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    setApplyingDiscount(true);
    try {
      const res = await api.post('/cart/discount', { code: discountCode });
      if (res.data.success) {
        setDiscount(res.data.discountPrice);
        setAppliedDiscountCode(discountCode.trim());
        setTotal(clampCheckoutTotal(subtotal, res.data.discountPrice, shippingFee));
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error('Áp dụng mã giảm giá thất bại');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const buildOrderPayload = () => ({
    note: orderNote,
    payment_id: selectedPaymentId,
    delivery_id: 1,
    selectedProductIds: itemsParam ? itemsParam.split(',').map(Number).filter(Boolean) : undefined,
    buyNowProductId: buyNow ? Number(buyNow) : undefined,
    buyNowQuantity: buyNowQuantity ? Number(buyNowQuantity) : undefined,
    orderAddress: {
      orderUsername: user?.name,
      orderPhonenumber: user?.phone,
      content: addressDetail,
      province_id: parseInt(selectedProvince, 10),
      district_id: parseInt(selectedDistrict, 10),
      ward_id: parseInt(selectedWard, 10)
    }
  });

  const validateForm = () => {
    if (!user?.name) return 'Vui lòng nhập họ tên';
    if (!user?.phone) return 'Vui lòng nhập số điện thoại';
    if (!selectedProvince || !selectedDistrict || !selectedWard) return 'Vui lòng chọn đầy đủ địa chỉ';
    if (!addressDetail.trim()) return 'Vui lòng nhập địa chỉ cụ thể';
    if (!selectedPaymentId) return 'Vui lòng chọn phương thức thanh toán';
    return '';
  };

  const handleSubmitOrder = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const selectedPayment = paymentMethods.find((method) => method.payment_id === selectedPaymentId);
    if (!selectedPayment) return;

    setSubmitting(true);
    try {
      if (selectedPayment.code === 'momo') {
        const res = await api.post('/cart/momo/create', buildOrderPayload());
        if (res.data.success) {
          const params = new URLSearchParams();
          params.set('orderId', String(res.data.orderId));
          if (itemsParam) params.set('items', itemsParam);
          if (buyNow) params.set('buyNow', buyNow);
          if (buyNowQuantity) params.set('buyNowQuantity', buyNowQuantity);
          sessionStorage.setItem(`momo_order_${res.data.orderId}`, params.toString());
          window.location.href = res.data.payUrl;
          return;
        }
      } else {
        const res = await api.post('/cart/save-order', buildOrderPayload());
        if (res.data.success) {
          toast.success('Đặt hàng thành công');
          router.push(`/orders/${res.data.orderId}`);
          return;
        }
      }

      toast.error('Không thể xử lý thanh toán');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const finalTotal = clampCheckoutTotal(subtotal, discount, shippingFee);

  if (loading) {
    return <div className="container-custom py-24 text-center text-slate-500">Đang tải thanh toán...</div>;
  }

  if (!isLoggedIn) return null;

  return (
    <div className="container-custom py-8">
      <div className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link href="/cart" className="hover:text-slate-900">Giỏ hàng</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Thanh toán</span>
      </div>

      <div className="mb-8 max-w-3xl">
        <h1 className="section-heading">Thanh toán</h1>
        <p className="section-copy">Hoàn thiện thông tin giao hàng, chọn phương thức thanh toán và kiểm tra lại đơn trước khi xác nhận.</p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.35fr,0.75fr]">
        <div className="space-y-6">
          <section className="surface-card p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <TruckIcon className="h-5 w-5" />
              Thông tin giao hàng
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Họ tên</label>
                <input type="text" value={user?.name || ''} onChange={(e) => setUser({ ...user!, name: e.target.value })} className="input-modern" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Số điện thoại</label>
                <input type="tel" value={user?.phone || ''} onChange={(e) => setUser({ ...user!, phone: e.target.value })} className="input-modern" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tỉnh/Thành phố</label>
                <select value={selectedProvince} onChange={(e) => {
                  const provinceId = parseInt(e.target.value, 10);
                  setSelectedProvince(e.target.value);
                  setSelectedDistrict('');
                  setSelectedWard('');
                  setDistricts([]);
                  setWards([]);
                  if (provinceId) fetchDistricts(provinceId);
                }} className="input-modern">
                  <option value="">Chọn Tỉnh/Thành phố</option>
                  {provinces.map((province) => <option key={province.province_id} value={province.province_id}>{province.province_name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Quận/Huyện</label>
                <select value={selectedDistrict} onChange={(e) => {
                  const districtId = parseInt(e.target.value, 10);
                  setSelectedDistrict(e.target.value);
                  setSelectedWard('');
                  setWards([]);
                  if (districtId) fetchWards(districtId);
                }} disabled={!selectedProvince} className="input-modern disabled:bg-slate-50">
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map((district) => <option key={district.district_id} value={district.district_id}>{district.type} {district.district_name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Phường/Xã</label>
                <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} disabled={!selectedDistrict} className="input-modern disabled:bg-slate-50">
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map((ward) => <option key={ward.ward_id} value={ward.ward_id}>{ward.type} {ward.ward_name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Địa chỉ cụ thể</label>
                <input type="text" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} className="input-modern" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Ghi chú đơn hàng</label>
                <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} rows={3} className="input-modern min-h-[120px] resize-none py-3" />
              </div>
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ShieldCheckIcon className="h-5 w-5" />
              Phương thức thanh toán
            </h2>
            <div className="mt-5 space-y-3">
              {paymentMethods.map((method) => (
                <label
                  key={method.payment_id}
                  className={`flex items-start gap-4 rounded-2xl border p-4 transition ${
                    selectedPaymentId === method.payment_id
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input type="radio" checked={selectedPaymentId === method.payment_id} onChange={() => setSelectedPaymentId(method.payment_id)} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {method.code === 'momo' ? <WalletIcon className="h-5 w-5" /> : <CreditCardIcon className="h-5 w-5" />}
                      <span className="font-medium text-slate-900">{getPaymentLabel(method)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {method.code === 'momo' ? 'Thanh toán qua Momo test/dev' : 'Thanh toán trực tiếp khi nhận hàng'}
                    </p>
                    {method.code === 'momo' && (
                      <p className="mt-2 text-xs text-amber-600">Hạn mức Momo test hiện tại: từ 1.000 VND đến 50.000.000 VND.</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="surface-card h-fit p-6">
          <h2 className="text-lg font-semibold text-slate-900">Đơn hàng của bạn</h2>
          <div className="mt-5 space-y-4">
            {cartItems.map((item) => (
              <div key={item.product_id} className="grid grid-cols-[72px,1fr] gap-3 rounded-2xl border border-slate-100 p-3">
                <img src={getMediaUrl(item.image, '/images/default.png')} alt={item.product_name} className="h-[72px] w-[72px] rounded-xl object-cover bg-slate-100" />
                <div>
                  <p className="line-clamp-2 text-sm font-medium text-slate-900">{item.product_name}</p>
                  <p className="mt-1 text-xs text-slate-500">x{item.quantity}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{item.priceAfterDiscount.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4 border-t border-slate-100 pt-5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Đơn giá sản phẩm</span>
              <span>{subtotal.toLocaleString('vi-VN')}đ</span>
            </div>

            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Nhập mã giảm giá"
                  className="input-modern h-11 flex-1"
                />
                <button onClick={handleApplyDiscount} disabled={applyingDiscount} className="btn-secondary h-11 px-4 py-0">
                  {applyingDiscount ? '...' : 'Áp mã'}
                </button>
              </div>
              {appliedDiscountCode && <p className="mt-2 text-xs text-emerald-700">Đang áp dụng: {appliedDiscountCode}</p>}
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Giảm giá</span>
              <span className="text-emerald-700">-{discount.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển</span>
              <span>{shippingFee.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-4 text-base font-semibold text-slate-900">
              <span>Tổng cộng</span>
              <span>{finalTotal.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          <button onClick={handleSubmitOrder} disabled={submitting} className="btn-primary mt-6 flex w-full">
            {submitting ? 'Đang xử lý...' : `Tiếp tục (${finalTotal.toLocaleString('vi-VN')}đ)`}
          </button>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container-custom py-24 text-center text-slate-500">Đang tải thanh toán...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
