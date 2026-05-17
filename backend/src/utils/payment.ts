type PaymentRecord = {
  payment_id: number;
  payment_name?: string | null;
  status?: string | null;
};

const normalizeText = (value?: string | null) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase();

export type PaymentMethodView = {
  payment_id: number;
  code: 'cod' | 'momo' | 'vnpay' | 'other';
  name: string;
  enabled: boolean;
  comingSoon: boolean;
};

export const normalizePaymentCode = (paymentName?: string | null): PaymentMethodView['code'] => {
  const normalized = normalizeText(paymentName);
  if (normalized.includes('momo')) return 'momo';
  if (normalized.includes('vnpay')) return 'vnpay';
  if (
    normalized.includes('cod') ||
    normalized.includes('truc tiep') ||
    normalized.includes('thanh toan khi nhan hang') ||
    normalized.includes('nhan hang') ||
    normalized.includes('giao hang') ||
    normalized.includes('cash on delivery') ||
    normalized.includes('tien mat')
  ) {
    return 'cod';
  }
  return 'other';
};

export const toPaymentMethodView = (payment: PaymentRecord): PaymentMethodView => {
  const code = normalizePaymentCode(payment.payment_name);
  const fallbackName = code === 'cod' ? 'Thanh toán khi nhận hàng' : code === 'momo' ? 'Momo' : 'Thanh toán';
  const name = String(payment.payment_name || fallbackName);

  if (code === 'momo') {
    return {
      payment_id: payment.payment_id,
      code,
      name,
      enabled: false,
      comingSoon: true
    };
  }

  if (code === 'vnpay') {
    return {
      payment_id: payment.payment_id,
      code,
      name,
      enabled: false,
      comingSoon: false
    };
  }

  return {
    payment_id: payment.payment_id,
    code,
    name,
    enabled: code === 'cod',
    comingSoon: false
  };
};
