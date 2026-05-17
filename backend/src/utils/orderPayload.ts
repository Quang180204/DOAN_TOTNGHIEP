import prisma from '../config/prisma';
import { normalizePaymentCode } from './payment';

const SHIPPING_FEE = 30000;

export const formatValue = (value: any): any => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item: any) => formatValue(item));
  if (typeof value === 'object') {
    const result: any = {};
    for (const key in value) {
      result[key] = formatValue(value[key]);
    }
    return result;
  }
  return value;
};

export const getOrderWithRelations = async (order: any) => {
  const [account, payment, delivery, orderAddress, orderDetails]: any[] = await Promise.all([
    order.account_id
      ? prisma.account.findUnique({
          where: { account_id: order.account_id },
          select: { Name: true, email: true, Phone: true, Avatar: true }
        })
      : null,
    order.payment_id ? prisma.payment.findUnique({ where: { payment_id: order.payment_id } }) : null,
    order.delivery_id ? prisma.delivery.findUnique({ where: { delivery_id: order.delivery_id } }) : null,
    order.orderAddressId ? prisma.orderAddress.findUnique({ where: { orderAddressId: order.orderAddressId } }) : null,
    prisma.$queryRaw<any[]>`SELECT * FROM "oder_detail" WHERE order_id = ${order.order_id} ORDER BY product_id ASC`
  ]);

  let fullAddress = null;
  if (orderAddress) {
    const [ward, district, province]: any[] = await Promise.all([
      orderAddress.ward_id ? prisma.wards.findUnique({ where: { ward_id: orderAddress.ward_id } }) : null,
      orderAddress.district_id ? prisma.districts.findUnique({ where: { district_id: orderAddress.district_id } }) : null,
      orderAddress.province_id ? prisma.provinces.findUnique({ where: { province_id: orderAddress.province_id } }) : null
    ]);

    fullAddress = {
      ...orderAddress,
      Wards: ward ? { ward_name: ward.ward_name, type: ward.type } : null,
      Districts: district ? { district_name: district.district_name, type: district.type } : null,
      Provinces: province ? { province_name: province.province_name } : null
    };
  }

  const detailsWithProducts = await Promise.all(
    (orderDetails || []).map(async (detail: any) => {
      const product = await prisma.product.findUnique({
        where: { product_id: detail.product_id },
        select: { product_name: true, image: true }
      });
      const existingFeedback = order.account_id
        ? await prisma.feedback.findFirst({
            where: {
              account_id: order.account_id,
              product_id: detail.product_id,
              stastus: '2'
            },
            select: { feedback_id: true, rate_star: true, content: true }
          })
        : null;

      return {
        ...detail,
        product_name: product?.product_name || `San pham #${detail.product_id}`,
        image: product?.image || null,
        hasFeedback: Boolean(existingFeedback),
        feedback: existingFeedback
      };
    })
  );

  const goodsSubtotal = detailsWithProducts.reduce(
    (sum: number, item: any) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const shippingFee = detailsWithProducts.length > 0 ? SHIPPING_FEE : 0;
  const discountAmount = Math.max(goodsSubtotal + shippingFee - Number(order.total || 0), 0);
  const hasMomoTransaction = detailsWithProducts.some((detail: any) =>
    String(detail.transection || '').toUpperCase().includes('MOMO')
  );
  const hasVnpayTransaction = detailsWithProducts.some((detail: any) =>
    String(detail.transection || '').toUpperCase().includes('VNPAY')
  );

  let paymentCode = normalizePaymentCode(payment?.payment_name);
  if (hasMomoTransaction) {
    paymentCode = 'momo';
  } else if (hasVnpayTransaction) {
    paymentCode = 'vnpay';
  } else if (paymentCode === 'momo') {
    paymentCode = 'cod';
  }

  const paymentDisplayName =
    paymentCode === 'cod'
      ? 'Thanh toán khi nhận hàng'
      : paymentCode === 'momo'
        ? 'Momo'
        : payment?.payment_name || 'Không xác định';

  return {
    ...order,
    account,
    payment,
    paymentCode,
    paymentDisplayName,
    delivery,
    OrderAddress: fullAddress,
    orderAddress: fullAddress
      ? {
          orderUsername: fullAddress.orderUsername,
          orderPhonenumber: fullAddress.orderPhonenumber,
          content: fullAddress.content,
          province_name: fullAddress.Provinces?.province_name || '',
          district_name: fullAddress.Districts?.district_name || '',
          ward_name: fullAddress.Wards?.ward_name || ''
        }
      : null,
    OrderDetails: detailsWithProducts,
    goodsSubtotal,
    shippingFee,
    discountAmount,
    grandTotal: Number(order.total || 0),
    isOrphan: detailsWithProducts.length === 0
  };
};
