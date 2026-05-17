import crypto from 'crypto';
import https from 'https';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/authMiddleware';
import { normalizePaymentCode, toPaymentMethodView } from '../../utils/payment';

const SHIPPING_FEE = 30000;
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const MOMO_REQUEST_TYPE = 'payWithMethod';
const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
const MOMO_MIN_AMOUNT = Number(process.env.MOMO_MIN_AMOUNT || 1000);
const MOMO_MAX_AMOUNT = Number(process.env.MOMO_MAX_AMOUNT || 50000000);
const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const MOMO_REDIRECT_URL = process.env.MOMO_REDIRECT_URL || `${FRONTEND_ORIGIN}/checkout/momo/result`;
const MOMO_IPN_URL = process.env.MOMO_IPN_URL || `${FRONTEND_ORIGIN}/checkout/momo/result`;

const parseSelectedProductIds = (value: unknown): number[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => !Number.isNaN(item) && item > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => !Number.isNaN(item) && item > 0);
  }
  return [];
};

const parseBuyNowQuantity = (value: unknown): number | null => {
  const quantity = Number(value);
  return Number.isNaN(quantity) || quantity <= 0 ? null : quantity;
};

const getCartFromCookies = (
  req: Request,
  options?: {
    selectedProductIds?: number[];
    buyNowProductId?: number | null;
    buyNowQuantity?: number | null;
  }
): { productIds: number[]; quantities: number[] } => {
  const cookies = req.cookies || {};
  const productIds: number[] = [];
  const quantities: number[] = [];
  const selectedSet = new Set(options?.selectedProductIds || []);

  Object.keys(cookies).forEach((key) => {
    if (!key.startsWith('product_')) return;

    const productId = parseInt(key.replace('product_', ''), 10);
    let quantity = parseInt(cookies[key], 10);

    if (options?.buyNowProductId && productId !== options.buyNowProductId) {
      return;
    }

    if (selectedSet.size > 0 && !selectedSet.has(productId)) {
      return;
    }

    if (options?.buyNowProductId === productId && options.buyNowQuantity) {
      quantity = options.buyNowQuantity;
    }

    if (!Number.isNaN(productId) && !Number.isNaN(quantity) && quantity > 0) {
      productIds.push(productId);
      quantities.push(quantity);
    }
  });

  return { productIds, quantities };
};

const removeProductFromCookies = (res: Response, productId: number): void => {
  res.cookie(`product_${productId}`, '', {
    expires: new Date(Date.now() - 86400000),
    httpOnly: true,
    path: '/'
  });
};

const getProductPriceAfterDiscount = (product: any): number => {
  let price = product.price;

  if (product.discount && product.discount.discount_star && product.discount.discount_end) {
    const now = new Date();
    const discountStart = new Date(product.discount.discount_star);
    const discountEnd = new Date(product.discount.discount_end);

    if (discountStart < now && discountEnd > now && product.discount.discount_price) {
      price = product.price - product.discount.discount_price;
    }
  }

  return price;
};

const getDiscountFromCookie = (req: Request): { discount: number; discountCode: string | null } => {
  const discount = req.cookies.discount ? parseFloat(req.cookies.discount) : 0;
  const discountCode = req.cookies.discountCode || null;
  return { discount, discountCode };
};

const clampCheckoutTotal = (subtotal: number, discount: number, shipping: number) =>
  Math.max(0, subtotal - discount + shipping);

const saveDiscountToCookie = (res: Response, discount: number, discountCode: string): void => {
  res.cookie('discount', discount.toString(), {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    path: '/'
  });
  res.cookie('discountCode', discountCode, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    path: '/'
  });
};

const clearDiscountCookie = (res: Response): void => {
  res.cookie('discount', '', { expires: new Date(0), path: '/' });
  res.cookie('discountCode', '', { expires: new Date(0), path: '/' });
};

const loadProductsWithDiscount = async (productIds: number[]) => {
  const products = await prisma.product.findMany({
    where: {
      product_id: { in: productIds },
      status: '1'
    }
  });

  return Promise.all(
    products.map(async (product) => {
      const discount = await prisma.discount.findUnique({
        where: { disscount_id: product.disscount_id }
      });
      return { ...product, discount };
    })
  );
};

const ensureCorePaymentMethods = async () => {
  const payments = await prisma.payment.findMany({
    orderBy: { payment_id: 'asc' }
  });

  const hasCod = payments.some((payment) => normalizePaymentCode(payment.payment_name) === 'cod');
  const hasMomo = payments.some((payment) => normalizePaymentCode(payment.payment_name) === 'momo');

  if (!hasCod) {
    await prisma.payment.create({
      data: {
        payment_name: 'Thanh toán khi nhận hàng',
        status: '1',
        create_at: new Date(),
        create_by: 'system',
        update_at: new Date(),
        update_by: 'system'
      }
    });
  }

  if (!hasMomo) {
    await prisma.payment.create({
      data: {
        payment_name: 'MoMo',
        status: '1',
        create_at: new Date(),
        create_by: 'system',
        update_at: new Date(),
        update_by: 'system'
      }
    });
  }
};

const buildCheckoutPaymentMethods = async () => {
  await ensureCorePaymentMethods();

  const payments = await prisma.payment.findMany({
    where: {
      OR: [{ status: null }, { status: '1' }]
    },
    orderBy: { payment_id: 'asc' }
  });

  const mapped = payments.map((payment) => {
    const view = toPaymentMethodView(payment);
    if (view.code === 'momo') {
      return { ...view, enabled: true, comingSoon: false };
    }
    return view;
  }).filter((method) => method.code === 'cod' || method.code === 'momo');

  if (mapped.length > 0) {
    return mapped;
  }

  return [
    {
      payment_id: 1,
      code: 'cod' as const,
      name: 'Thanh toan khi nhan hang',
      enabled: true,
      comingSoon: false
    }
  ];
};

const getSelectedCartPayload = (req: Request) => ({
  selectedProductIds: parseSelectedProductIds(req.query.items || req.body?.selectedProductIds),
  buyNowProductId: req.query.buyNow ? Number(req.query.buyNow) : req.body?.buyNowProductId ? Number(req.body.buyNowProductId) : null,
  buyNowQuantity: parseBuyNowQuantity(req.query.buyNowQuantity || req.body?.buyNowQuantity)
});

const createOrderTransaction = async ({
  tx,
  userId,
  req,
  orderAddress,
  note,
  paymentMethod,
  deliveryId,
  persistDiscount = true
}: {
  tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
  userId: number;
  req: Request;
  orderAddress: any;
  note?: string;
  paymentMethod: { payment_id: number; code: string; name: string };
  deliveryId: number;
  persistDiscount?: boolean;
}) => {
  const selection = getSelectedCartPayload(req);
  const { productIds, quantities } = getCartFromCookies(req, selection);

  if (productIds.length === 0) {
    throw new Error('Gio hang cua ban dang trong');
  }

  const products = await tx.product.findMany({
    where: {
      product_id: { in: productIds },
      status: '1'
    }
  });

  const productsWithDiscount = await Promise.all(
    products.map(async (product) => {
      const discount = await tx.discount.findUnique({
        where: { disscount_id: product.disscount_id }
      });
      return { ...product, discount };
    })
  );

  let subtotal = 0;
  for (let i = 0; i < productIds.length; i += 1) {
    const product = productsWithDiscount.find((entry) => entry.product_id === productIds[i]);
    const quantity = quantities[i];

    if (!product) {
      throw new Error('San pham khong ton tai');
    }

    const stock = parseInt(product.quantity || '0', 10);
    if (stock < quantity) {
      throw new Error(`San pham ${product.product_name} chi con ${stock} san pham`);
    }

    subtotal += getProductPriceAfterDiscount(product) * quantity;
  }

  let discountAmount = 0;
  let discountRecord: any = null;
  const { discount: cookieDiscount, discountCode: cookieDiscountCode } = getDiscountFromCookie(req);

  if (persistDiscount && cookieDiscount > 0 && cookieDiscountCode) {
    discountRecord = await tx.discount.findFirst({
      where: { discount_code: cookieDiscountCode }
    });

    if (!discountRecord) {
      throw new Error('Ma giam gia khong hop le');
    }

    const now = new Date();
    if (discountRecord.quantity <= 0 || discountRecord.discount_star >= now || discountRecord.discount_end <= now) {
      throw new Error('Ma giam gia khong the su dung');
    }

    discountAmount = cookieDiscount;
  }

  let selectedAddress = orderAddress;
  if (!selectedAddress?.content && selectedAddress?.account_address_id) {
    selectedAddress = await tx.accountAddress.findFirst({
      where: {
        account_address_id: Number(selectedAddress.account_address_id),
        account_id: userId
      }
    });
  }

  if (!selectedAddress) {
    selectedAddress = await tx.accountAddress.findFirst({
      where: { account_id: userId, isDefault: true }
    });
  }

  let createdOrderAddressId: number | null = null;
  if (selectedAddress) {
    const username = selectedAddress.orderUsername || selectedAddress.accountUsername || selectedAddress.name;
    const phonenumber =
      selectedAddress.orderPhonenumber || selectedAddress.accountPhoneNumber || selectedAddress.phone;
    const provinceId = selectedAddress.province_id ? Number(selectedAddress.province_id) : null;
    const districtId = selectedAddress.district_id ? Number(selectedAddress.district_id) : null;
    const wardId = selectedAddress.ward_id ? Number(selectedAddress.ward_id) : null;
    const addressContent = selectedAddress.content || selectedAddress.addressDetail || '';

    const savedAddress = await tx.orderAddress.create({
      data: {
        orderPhonenumber: String(phonenumber || '').trim().slice(0, 10),
        orderUsername: String(username || '').trim().slice(0, 20),
        content: String(addressContent || '').trim().slice(0, 150),
        timesEdit: 0,
        province_id: provinceId,
        district_id: districtId,
        ward_id: wardId
      }
    });

    createdOrderAddressId = savedAddress.orderAddressId;
  }

  const finalTotal = clampCheckoutTotal(subtotal, discountAmount, SHIPPING_FEE);

  const createdOrder = await tx.order.create({
    data: {
      account_id: userId,
      payment_id: paymentMethod.payment_id,
      delivery_id: Number(deliveryId) || 1,
      oder_date: new Date(),
      total: finalTotal,
      status: '1',
      create_at: new Date(),
      create_by: userId.toString(),
      update_at: new Date(),
      update_by: userId.toString(),
      order_note: note || null,
      orderAddressId: createdOrderAddressId
    }
  });

  for (let i = 0; i < productIds.length; i += 1) {
    const product = productsWithDiscount.find((entry) => entry.product_id === productIds[i]);
    const quantity = quantities[i];
    if (!product) continue;

    const itemPrice = getProductPriceAfterDiscount(product);
    await tx.$executeRaw(
      Prisma.sql`
        INSERT INTO "oder_detail" (
          order_id,
          product_id,
          quantity,
          price,
          genre_id,
          disscount_id,
          status,
          transection,
          create_by,
          create_at,
          update_by,
          update_at
        ) VALUES (
          ${createdOrder.order_id},
          ${product.product_id},
          ${quantity},
          ${itemPrice},
          ${product.genre_id},
          ${product.disscount_id},
          ${'1'},
          ${paymentMethod.code === 'momo' ? 'MOMO_PENDING' : ''},
          ${userId.toString()},
          ${new Date()},
          ${userId.toString()},
          ${new Date()}
        )
      `
    );

    const currentQuantity = parseInt(product.quantity || '0', 10);
    await tx.product.update({
      where: { product_id: product.product_id },
      data: {
        quantity: String(currentQuantity - quantity),
        buyturn: { increment: quantity }
      }
    });
  }

  if (discountRecord) {
    await tx.discount.update({
      where: { disscount_id: discountRecord.disscount_id },
      data: { quantity: { decrement: 1 } }
    });
  }

  return {
    order: createdOrder,
    productIds,
    discountApplied: Boolean(discountRecord)
  };
};

const callMomoCreateLink = async (payload: {
  amount: string;
  orderId: string;
  requestId: string;
  orderInfo: string;
}): Promise<any> => {
  const extraData = '';
  const rawSignature =
    `accessKey=${MOMO_ACCESS_KEY}` +
    `&amount=${payload.amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${MOMO_IPN_URL}` +
    `&orderId=${payload.orderId}` +
    `&orderInfo=${payload.orderInfo}` +
    `&partnerCode=${MOMO_PARTNER_CODE}` +
    `&redirectUrl=${MOMO_REDIRECT_URL}` +
    `&requestId=${payload.requestId}` +
    `&requestType=${MOMO_REQUEST_TYPE}`;

  const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');
  const requestBody = JSON.stringify({
    partnerCode: MOMO_PARTNER_CODE,
    partnerName: 'Quang Shop Test',
    storeId: 'QuangShopMomo',
    requestId: payload.requestId,
    amount: payload.amount,
    orderId: payload.orderId,
    orderInfo: payload.orderInfo,
    redirectUrl: MOMO_REDIRECT_URL,
    ipnUrl: MOMO_IPN_URL,
    lang: 'vi',
    requestType: MOMO_REQUEST_TYPE,
    autoCapture: true,
    extraData,
    orderGroupId: '',
    signature
  });

  const endpoint = new URL(MOMO_ENDPOINT);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: endpoint.hostname,
        port: endpoint.port || 443,
        path: endpoint.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      },
      (response) => {
        let raw = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          raw += chunk;
        });
        response.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
};

export const PreviewCart = async (req: Request, res: Response) => {
  try {
    const selection = getSelectedCartPayload(req);
    const { productIds, quantities } = getCartFromCookies(req, selection);

    if (productIds.length === 0) {
      return res.json({ products: [], quantities: [], total: 0 });
    }

    const productsWithDiscount = await loadProductsWithDiscount(productIds);
    const sortedProducts: any[] = [];
    const sortedQuantities: number[] = [];

    productIds.forEach((id, index) => {
      const product = productsWithDiscount.find((entry) => entry.product_id === id);
      if (!product) {
        removeProductFromCookies(res, id);
        return;
      }

      sortedProducts.push({
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.price.toString(),
        view: product.view?.toString(),
        buyturn: product.buyturn?.toString(),
        image: product.image,
        discount: product.discount,
        priceAfterDiscount: getProductPriceAfterDiscount(product)
      });
      sortedQuantities.push(quantities[index]);
    });

    const total = sortedProducts.reduce(
      (sum, product, index) => sum + product.priceAfterDiscount * sortedQuantities[index],
      0
    );

    res.json({
      success: true,
      products: sortedProducts,
      quantities: sortedQuantities,
      total
    });
  } catch (error) {
    console.error('PreviewCart error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu, vui long thu lai sau' });
  }
};

export const ViewCart = async (req: Request, res: Response) => {
  try {
    const selection = getSelectedCartPayload(req);
    const { productIds, quantities } = getCartFromCookies(req, selection);

    if (productIds.length === 0) {
      return res.json({ success: true, products: [], quantities: [], subtotal: 0, discount: 0, total: 0 });
    }

    const productsWithDiscount = await loadProductsWithDiscount(productIds);
    let subtotal = 0;
    const cartItems: any[] = [];

    productIds.forEach((id, index) => {
      const product = productsWithDiscount.find((entry) => entry.product_id === id);
      if (!product || quantities[index] <= 0) return;

      const priceAfterDiscount = getProductPriceAfterDiscount(product);
      const itemTotal = priceAfterDiscount * quantities[index];
      subtotal += itemTotal;

      cartItems.push({
        product: {
          product_id: product.product_id,
          product_name: product.product_name,
          price: product.price.toString(),
          view: product.view?.toString(),
          buyturn: product.buyturn?.toString(),
          image: product.image,
          quantity: product.quantity,
          discount: product.discount,
          priceAfterDiscount
        },
        quantity: quantities[index],
        itemTotal
      });
    });

    res.json({
      success: true,
      products: cartItems,
      subtotal,
      discount: 0,
      discountCode: null,
      total: subtotal
    });
  } catch (error) {
    console.error('ViewCart error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu: ' + (error as Error).message });
  }
};

export const Checkout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap de thanh toan' });
    }

    const userId = req.user.account_id;
    const selection = getSelectedCartPayload(req);
    const { productIds, quantities } = getCartFromCookies(req, selection);

    if (productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Gio hang cua ban dang trong' });
    }

    const [user, productsWithDiscount, addresses, provinces, paymentMethods] = await Promise.all([
      prisma.account.findUnique({ where: { account_id: userId } }),
      loadProductsWithDiscount(productIds),
      prisma.accountAddress.findMany({
        where: { account_id: userId },
        orderBy: [{ isDefault: 'desc' }, { account_address_id: 'desc' }]
      }).catch(() => []),
      prisma.provinces.findMany({ orderBy: { province_name: 'asc' } }).catch(() => []),
      buildCheckoutPaymentMethods()
    ]);

    let subtotal = 0;
    const cartItems: any[] = [];

    productIds.forEach((id, index) => {
      const product = productsWithDiscount.find((entry) => entry.product_id === id);
      if (!product || quantities[index] <= 0) return;

      const priceAfterDiscount = getProductPriceAfterDiscount(product);
      const itemTotal = priceAfterDiscount * quantities[index];
      subtotal += itemTotal;

      cartItems.push({
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.price?.toString(),
        priceAfterDiscount,
        quantity: quantities[index],
        image: product.image,
        itemTotal
      });
    });

    const { discount, discountCode } = getDiscountFromCookie(req);
    const total = clampCheckoutTotal(subtotal, discount, SHIPPING_FEE);

    res.json({
      success: true,
      user: {
        account_id: user?.account_id,
        name: user?.Name,
        email: user?.email,
        phone: user?.Phone,
        defaultAddress: addresses.find((address) => address.isDefault) || null
      },
      cartItems,
      subtotal,
      discount,
      discountCode,
      shipping: SHIPPING_FEE,
      total,
      addresses,
      provinces,
      paymentMethods,
      selectedProductIds: productIds
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Loi may chu: ' + (error as Error).message
    });
  }
};

export const SaveOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap de dat hang' });
    }

    const paymentMethods = await buildCheckoutPaymentMethods();
    const selectedPayment = paymentMethods.find((method) => method.payment_id === Number(req.body.payment_id));

    if (!selectedPayment || normalizePaymentCode(selectedPayment.name) !== 'cod') {
      return res.status(400).json({ success: false, message: 'Phuong thuc thanh toan hien chua ho tro' });
    }

    const result = await prisma.$transaction((tx) =>
      createOrderTransaction({
        tx: tx as any,
        userId: req.user!.account_id,
        req,
        orderAddress: req.body.orderAddress,
        note: req.body.note,
        paymentMethod: selectedPayment,
        deliveryId: Number(req.body.delivery_id) || 1,
        persistDiscount: true
      })
    );

    result.productIds.forEach((productId) => removeProductFromCookies(res, productId));
    clearDiscountCookie(res);

    res.json({
      success: true,
      message: 'Dat hang thanh cong',
      orderId: result.order.order_id,
      order: {
        id: result.order.order_id,
        total: result.order.total,
        date: result.order.oder_date,
        status: result.order.status
      }
    });
  } catch (error) {
    console.error('SaveOrder error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Loi! Dat hang khong thanh cong'
    });
  }
};

export const CreateMomoPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap de thanh toan' });
    }

    const paymentMethods = await buildCheckoutPaymentMethods();
    const momoPayment = paymentMethods.find((method) => method.code === 'momo');
    if (!momoPayment) {
      return res.status(400).json({ success: false, message: 'Chua cau hinh thanh toan MoMo' });
    }

    const result = await prisma.$transaction((tx) =>
      createOrderTransaction({
        tx: tx as any,
        userId: req.user!.account_id,
        req,
        orderAddress: req.body.orderAddress,
        note: req.body.note,
        paymentMethod: momoPayment,
        deliveryId: Number(req.body.delivery_id) || 1,
        persistDiscount: true
      })
    );

    const orderId = `${MOMO_PARTNER_CODE}${result.order.order_id}_${Date.now()}`;
    const requestId = orderId;
    const momoChargeAmount = Math.round(Number(result.order.total || 0));
    if (momoChargeAmount < MOMO_MIN_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Giao dich MoMo toi thieu ${MOMO_MIN_AMOUNT.toLocaleString('vi-VN')} VND`
      });
    }
    if (momoChargeAmount > MOMO_MAX_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Giao dich MoMo toi da ${MOMO_MAX_AMOUNT.toLocaleString('vi-VN')} VND cho tai khoan hien tai`
      });
    }
    const momoResponse = await callMomoCreateLink({
      amount: momoChargeAmount.toString(),
      orderId,
      requestId,
      orderInfo: `Thanh toan don hang #${result.order.order_id}`
    });

    if (Number(momoResponse.resultCode) !== 0) {
      await prisma.order.update({
        where: { order_id: result.order.order_id },
        data: {
          status: '0',
          update_at: new Date(),
          update_by: req.user.account_id.toString()
        }
      });
      return res.status(400).json({
        success: false,
        message: momoResponse.message || 'Khong tao duoc lien ket thanh toan MoMo'
      });
    }

    res.json({
      success: true,
      orderId: result.order.order_id,
      payUrl: momoResponse.payUrl,
      deeplink: momoResponse.deeplink,
      qrCodeUrl: momoResponse.qrCodeUrl
    });
  } catch (error) {
    console.error('CreateMomoPayment error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Khong tao duoc giao dich MoMo'
    });
  }
};

export const ConfirmMomoPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const orderId = Number(req.body.orderId);
    const resultCode = Number(req.body.resultCode);

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Don hang khong hop le' });
    }

    const order = await prisma.order.findFirst({
      where: {
        order_id: orderId,
        account_id: req.user.account_id
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });
    }

    if (resultCode !== 0) {
      await prisma.order.update({
        where: { order_id: orderId },
        data: {
          status: '0',
          update_at: new Date(),
          update_by: req.user.account_id.toString()
        }
      });
      return res.status(400).json({ success: false, message: 'Thanh toan MoMo that bai' });
    }

    const selection = getSelectedCartPayload(req);
    const { productIds } = getCartFromCookies(req, selection);
    productIds.forEach((productId) => removeProductFromCookies(res, productId));
    clearDiscountCookie(res);

    res.json({
      success: true,
      message: 'Thanh toan don hang thanh cong'
    });
  } catch (error) {
    console.error('ConfirmMomoPayment error:', error);
    res.status(500).json({ success: false, message: 'Loi xac nhan thanh toan MoMo' });
  }
};

export const UseDiscountCode = async (req: Request, res: Response) => {
  try {
    const code = String(req.body.code || '').trim();

    if (!code) {
      return res.status(400).json({ success: false, message: 'Vui long nhap ma giam gia' });
    }

    const discount = await prisma.discount.findFirst({
      where: { discount_code: code }
    });

    if (!discount) {
      return res.json({ success: false, discountPrice: 0, message: 'Ma giam gia khong hop le' });
    }

    const now = new Date();
    const discountStart = new Date(discount.discount_star);
    const discountEnd = new Date(discount.discount_end);

    if (discountStart < now && discountEnd > now && discount.quantity > 0) {
      saveDiscountToCookie(res, discount.discount_price, discount.discount_code || '');
      return res.json({
        success: true,
        discountPrice: discount.discount_price,
        message: 'Ap dung ma giam gia thanh cong'
      });
    }

    if (discount.quantity === 0) {
      return res.json({ success: false, discountPrice: 0, message: 'Ma giam gia da duoc su dung het' });
    }

    return res.json({ success: false, discountPrice: 0, message: 'Ma giam gia da het han' });
  } catch (error) {
    console.error('UseDiscountCode error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu, vui long thu lai sau' });
  }
};

export const AddToCart = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity || 1);

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Vui long chon san pham' });
    }

    const product = await prisma.product.findFirst({
      where: { product_id: productId, status: '1' }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'San pham khong ton tai' });
    }

    const currentQuantity = parseInt(req.cookies[`product_${productId}`] || '0', 10);
    const newQuantity = currentQuantity + quantity;

    res.cookie(`product_${productId}`, newQuantity.toString(), {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      path: '/'
    });

    res.json({
      success: true,
      message: 'Da them san pham vao gio hang',
      productId,
      quantity: newQuantity
    });
  } catch (error) {
    console.error('AddToCart error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu, vui long thu lai sau' });
  }
};

export const UpdateCartQuantity = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity);

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Vui long chon san pham' });
    }

    if (quantity <= 0) {
      removeProductFromCookies(res, productId);
      return res.json({ success: true, message: 'Da xoa san pham khoi gio hang' });
    }

    res.cookie(`product_${productId}`, quantity.toString(), {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      path: '/'
    });

    res.json({
      success: true,
      message: 'Cap nhat gio hang thanh cong',
      productId,
      quantity
    });
  } catch (error) {
    console.error('UpdateCartQuantity error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu, vui long thu lai sau' });
  }
};

export const RemoveFromCart = async (req: Request, res: Response) => {
  try {
    const productIdNumber = Number(req.params.productId);

    if (!productIdNumber) {
      return res.status(400).json({ success: false, message: 'ID san pham khong hop le' });
    }

    removeProductFromCookies(res, productIdNumber);
    res.json({
      success: true,
      message: 'Da xoa san pham khoi gio hang'
    });
  } catch (error) {
    console.error('RemoveFromCart error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu, vui long thu lai sau' });
  }
};
