import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma';
import { getOrderWithRelations } from '../../utils/orderPayload';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

const formatCurrency = (amount: number) => `${(amount || 0).toLocaleString('vi-VN')}đ`;

const detectIntent = (message: string) => {
  const normalized = normalizeText(message);

  if (/(xin chao|chao ban|hello|hi|alo|cam on|thank|tam biet|bye|ban la ai|ban co the giup gi)/.test(normalized)) return 'small_talk';
  if (/(don hang|lich su mua|trang thai don|giao hang|ma don)/.test(normalized)) return 'order_lookup';
  if (/(so sanh|nen mua|khac nhau|chon giua|hay hon)/.test(normalized)) return 'compare_products';
  if (/(ban chay|pho bien|nhieu nguoi mua|hot)/.test(normalized)) return 'best_sellers';
  if (/(khuyen mai|giam gia|voucher|uu dai|deal)/.test(normalized)) return 'discounts';
  if (/(phu kien|chuot|ban phim|tai nghe|o cung|ssd|hub)/.test(normalized)) return 'accessories';
  if (/(gaming|choi game)/.test(normalized)) return 'gaming_laptops';
  if (/(do hoa|thiet ke|render|edit video)/.test(normalized)) return 'design_laptops';
  if (/(hoc tap|sinh vien|van phong|lam viec)/.test(normalized)) return 'study_laptops';
  if (/(laptop|may tinh)/.test(normalized)) return 'laptops';
  if (/(gia|duoi|tren|tam|khoang|tu )/.test(normalized)) return 'budget';

  return 'general';
};

const getCartProductIdsFromCookies = (req: Request) =>
  Object.keys(req.cookies || {})
    .filter((key) => key.startsWith('product_'))
    .map((key) => Number(key.replace('product_', '')))
    .filter((value) => !Number.isNaN(value) && value > 0);

const parseMoneyToken = (token: string): number | null => {
  const normalized = normalizeText(token).replace(/\./g, '').replace(/,/g, '');
  const billionMatch = normalized.match(/(\d+)\s*ty/);
  if (billionMatch) return parseInt(billionMatch[1], 10) * 1_000_000_000;

  const millionMatch = normalized.match(/(\d+)\s*(trieu|cu|tr)/);
  if (millionMatch) return parseInt(millionMatch[1], 10) * 1_000_000;

  const plainMoneyMatch = normalized.match(/(\d{5,12})/);
  if (plainMoneyMatch) return parseInt(plainMoneyMatch[1], 10);

  return null;
};

const parseBudgetIntent = (message: string) => {
  const normalized = normalizeText(message).replace(/\./g, '').replace(/,/g, '');
  const betweenMatch = normalized.match(/(tu|khoang tu)\s+(.+?)\s+(den|toi)\s+(.+)/);
  if (betweenMatch) {
    const min = parseMoneyToken(betweenMatch[2]);
    const max = parseMoneyToken(betweenMatch[4]);
    if (min && max) return { mode: 'between' as const, min: Math.min(min, max), max: Math.max(min, max) };
  }

  const aboveMatch = normalized.match(/(tren|hon|tu)\s+(\d+\s*(ty|trieu|cu|tr)|\d{5,12})/);
  if (aboveMatch) {
    const value = parseMoneyToken(aboveMatch[2]);
    if (value) return { mode: 'min' as const, min: value };
  }

  const belowMatch = normalized.match(/(duoi|nho hon|khong vuot qua|toi da)\s+(\d+\s*(ty|trieu|cu|tr)|\d{5,12})/);
  if (belowMatch) {
    const value = parseMoneyToken(belowMatch[2]);
    if (value) return { mode: 'max' as const, max: value };
  }

  const exact = parseMoneyToken(normalized);
  if (exact) return { mode: 'max' as const, max: exact };

  return null as null | { mode: 'min'; min: number } | { mode: 'max'; max: number } | { mode: 'between'; min: number; max: number };
};

const extractOrderId = (message: string): number | null => {
  const normalized = normalizeText(message);
  const match = normalized.match(/(?:don hang|ma don|order)\s*#?\s*(\d{1,10})/);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const extractComparedNames = (message: string) =>
  normalizeText(message)
    .split(/\s+(?:va|voi|hay|hoac)\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4);

const extractConversationHistory = (history: any) => {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-8)
    .map((item) => ({
      role: item?.role === 'user' ? 'Người dùng' : 'Trợ lý',
      content: typeof item?.content === 'string' ? item.content.trim() : '',
    }))
    .filter((item) => item.content);
};

const computeDiscountedPrice = (
  price: number,
  discount?: { discount_star: Date; discount_end: Date; discount_price: number } | null
) => {
  if (!discount) return price;
  const now = new Date();
  const start = new Date(discount.discount_star);
  const end = new Date(discount.discount_end);
  if (start <= now && end >= now && discount.discount_price) {
    return Math.max(0, price - Number(discount.discount_price));
  }
  return price;
};

const getChatUser = async (req: Request) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { account_id: number };
    const user = await prisma.account.findUnique({
      where: { account_id: decoded.account_id },
      select: { account_id: true, email: true, Role: true, Name: true, status: true },
    });

    if (!user || user.status !== '1') return null;
    return user;
  } catch {
    return null;
  }
};

const getOrderLookupContext = async (userId: number, message: string) => {
  const orderId = extractOrderId(message);

  if (orderId) {
    const order = await prisma.order.findFirst({
      where: {
        order_id: orderId,
        account_id: userId,
        status: { notIn: ['0', '4'] },
      },
    });

    if (!order) {
      return {
        answer: `Tôi không tìm thấy đơn hàng #${orderId} trong tài khoản của bạn.`,
        orders: [],
      };
    }

    const detail = await getOrderWithRelations(order);
    const statusMap: Record<string, string> = {
      '0': 'Đã hủy',
      '1': 'Đang xử lý',
      '2': 'Đang giao hàng',
      '3': 'Hoàn thành',
      '4': 'Đã xóa',
    };

    return {
      answer: `Đơn hàng #${detail.order_id} hiện ở trạng thái ${statusMap[detail.status || '1'] || 'Đang xử lý'}, tổng tiền ${formatCurrency(Number(detail.total || 0))}.`,
      orders: [detail],
    };
  }

  const orders = await prisma.order.findMany({
    where: { account_id: userId, status: { notIn: ['0', '4'] } },
    orderBy: { create_at: 'desc' },
    take: 3,
  });

  if (!orders.length) {
    return { answer: 'Tôi chưa thấy đơn hàng nào trong tài khoản của bạn.', orders: [] };
  }

  const details = await Promise.all(orders.map((order) => getOrderWithRelations(order)));
  const summary = details
    .map((order) => {
      const statusMap: Record<string, string> = { '1': 'Đang xử lý', '2': 'Đang giao hàng', '3': 'Hoàn thành' };
      return `#${order.order_id}: ${statusMap[order.status || '1'] || 'Đang xử lý'} - ${formatCurrency(Number(order.total || 0))}`;
    })
    .join('; ');

  return {
    answer: `Tôi tìm thấy ${details.length} đơn hàng gần nhất của bạn: ${summary}.`,
    orders: details,
  };
};

const getPersonalizationContext = async (req: Request, userId: number) => {
  const wishlistRows = await prisma.wishlist.findMany({
    where: { account_id: userId },
    orderBy: { create_at: 'desc' },
    take: 5,
  });

  const wishlistProducts = wishlistRows.length
    ? await prisma.product.findMany({
        where: { product_id: { in: wishlistRows.map((row) => row.product_id) } },
        select: { product_id: true, product_name: true, brand_id: true, Type: true },
      })
    : [];

  const cartProductIds = getCartProductIdsFromCookies(req);
  const cartProducts = cartProductIds.length
    ? await prisma.product.findMany({
        where: { product_id: { in: cartProductIds } },
        select: { product_id: true, product_name: true, brand_id: true, Type: true },
      })
    : [];

  const recentOrders = await prisma.order.findMany({
    where: { account_id: userId, status: { notIn: ['0', '4'] } },
    orderBy: { create_at: 'desc' },
    take: 3,
  });

  const orderDetails = recentOrders.length
    ? await prisma.orderDetail.findMany({
        where: { order_id: { in: recentOrders.map((order) => order.order_id) } },
        select: { product_id: true },
      })
    : [];

  const orderedProducts = orderDetails.length
    ? await prisma.product.findMany({
        where: { product_id: { in: [...new Set(orderDetails.map((row) => row.product_id))] } },
        select: { product_id: true, product_name: true, brand_id: true, Type: true },
      })
    : [];

  const allBrandIds = [...new Set([...wishlistProducts, ...cartProducts, ...orderedProducts].map((item) => item.brand_id).filter(Boolean))];
  const brands = allBrandIds.length
    ? await prisma.brand.findMany({
        where: { brand_id: { in: allBrandIds } },
        select: { brand_id: true, brand_name: true },
      })
    : [];

  const brandMap = new Map(brands.map((item) => [item.brand_id, item.brand_name || '']));
  const favoriteBrandCounts = new Map<string, number>();

  [...wishlistProducts, ...cartProducts, ...orderedProducts].forEach((product) => {
    const brandName = brandMap.get(product.brand_id);
    if (!brandName) return;
    favoriteBrandCounts.set(brandName, (favoriteBrandCounts.get(brandName) || 0) + 1);
  });

  const favoriteBrands = [...favoriteBrandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return {
    favoriteBrands,
    wishlistProducts,
    cartProducts,
    orderedProducts,
    text: [
      favoriteBrands.length ? `Hãng xuất hiện nhiều trong hành vi gần đây: ${favoriteBrands.join(', ')}` : '',
      wishlistProducts.length ? `Wishlist gần đây: ${wishlistProducts.map((item) => item.product_name).join('; ')}` : '',
      cartProducts.length ? `Giỏ hàng hiện tại: ${cartProducts.map((item) => item.product_name).join('; ')}` : '',
      orderedProducts.length ? `Sản phẩm đã mua gần đây: ${orderedProducts.map((item) => item.product_name).join('; ')}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
};

const scoreProduct = (
  product: {
    product_name: string;
    brand_name: string;
    genre_name: string;
    price: number;
    priceAfterDiscount: number;
    avgRating: number;
    feedbackCount: number;
  },
  message: string,
  keywordTokens: string[],
  matchedBrands: string[],
  matchedGenres: string[],
  wantsDiscounts: boolean
) => {
  const haystack = normalizeText(`${product.product_name} ${product.brand_name} ${product.genre_name}`);
  let score = 0;

  keywordTokens.forEach((token) => {
    if (haystack.includes(token)) score += 4;
  });

  if (matchedBrands.includes(normalizeText(product.brand_name))) score += 8;
  if (matchedGenres.includes(normalizeText(product.genre_name))) score += 6;
  if (wantsDiscounts && product.priceAfterDiscount < product.price) score += 6;
  score += Math.min(product.avgRating, 5);
  score += Math.min(product.feedbackCount / 10, 3);

  const normalizedMessage = normalizeText(message);
  if (/(gaming|choi game)/.test(normalizedMessage) && /(gaming|rog|tuf|nitro|legion|predator)/.test(haystack)) score += 6;
  if (/(do hoa|thiet ke|render|edit video)/.test(normalizedMessage) && /(rtx|creator|proart|vivobook|16gb|i7|i9|ryzen 7|ryzen 9)/.test(haystack)) score += 6;
  if (/(hoc tap|sinh vien|van phong|lam viec)/.test(normalizedMessage) && product.priceAfterDiscount <= 25000000) score += 5;

  return score;
};

const buildCatalogContext = (products: any[]) =>
  products
    .slice(0, 12)
    .map((product, index) =>
      [
        `${index + 1}. ID=${product.product_id}`,
        `Tên=${product.product_name}`,
        `Hãng=${product.brand_name || 'Không rõ'}`,
        `Danh mục=${product.genre_name || 'Không rõ'}`,
        `Giá gốc=${product.price}`,
        `Giá hiện tại=${product.priceAfterDiscount}`,
        `Giảm giá=${product.priceAfterDiscount < product.price ? 'Có' : 'Không'}`,
        `Đánh giá TB=${product.avgRating || 0}`,
        `Lượt đánh giá=${product.feedbackCount || 0}`,
      ].join(' | ')
    )
    .join('\n');

const extractTextFromGemini = (payload: any) => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
};

const enhanceAnswerWithGemini = async ({
  message,
  answer,
  products,
  wantsProductListing,
  historyText,
  orderContextText,
  comparisonContextText,
  personalizationText,
}: {
  message: string;
  answer: string;
  wantsProductListing: boolean;
  historyText: string;
  orderContextText: string;
  comparisonContextText: string;
  personalizationText: string;
  products: Array<{
    product_id: number;
    product_name: string;
    image: string;
    price: number;
    priceAfterDiscount: number;
    quantity: string | null;
    brand_name: string;
    genre_name: string;
    type: number | null;
    avgRating: number;
    feedbackCount: number;
  }>;
}) => {
  if (!GEMINI_API_KEY) return answer;

  const catalogContext = buildCatalogContext(products);
  const systemPrompt = [
    'Bạn là AI tư vấn bán hàng cho website laptop và phụ kiện.',
    'Nhiệm vụ:',
    '- Trả lời tự nhiên bằng tiếng Việt có dấu.',
    '- Chỉ dựa trên dữ liệu được cung cấp.',
    '- Nếu dữ liệu không đủ, phải nói rõ là chưa đủ dữ liệu.',
    '- Ưu tiên nhận diện nhu cầu theo thương hiệu, tầm giá, giảm giá, danh mục, mục đích sử dụng và đánh giá thật.',
    '- Không bịa thêm sản phẩm không có trong danh sách.',
    '- Nếu người dùng chỉ chào hỏi, cảm ơn, hỏi xã giao hoặc hỏi bạn là ai, không được cố gợi ý sản phẩm.',
    '- Chỉ nhắc đến các gợi ý sản phẩm bên dưới nếu câu hỏi thật sự là về mua hàng hoặc lọc sản phẩm.',
    '- Nếu người dùng đang so sánh sản phẩm, hãy nêu rõ khác nhau về giá, hãng, đánh giá trung bình và số lượt đánh giá.',
    '- Câu trả lời tự nhiên hơn, không cụt, tối đa 6 câu.',
  ].join('\n');

  const userPrompt = [
    `Câu hỏi người dùng: ${message}`,
    `Trả lời gợi ý hiện tại của hệ thống: ${answer}`,
    `Có nên hiển thị gợi ý sản phẩm không: ${wantsProductListing ? 'Có' : 'Không'}`,
    `Lịch sử hội thoại gần đây:\n${historyText || 'Không có.'}`,
    `Ngữ cảnh đơn hàng:\n${orderContextText || 'Không có.'}`,
    `Ngữ cảnh so sánh:\n${comparisonContextText || 'Không có.'}`,
    `Ngữ cảnh cá nhân hóa:\n${personalizationText || 'Không có.'}`,
    'Danh sách sản phẩm ứng viên:',
    catalogContext || 'Không có sản phẩm nào.',
    'Hãy viết lại câu trả lời sao cho tự nhiên hơn, đúng trọng tâm hơn. Nếu không nên gợi ý sản phẩm thì tuyệt đối không nhắc khách xem sản phẩm.',
  ].join('\n\n');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.45,
        topP: 0.9,
        maxOutputTokens: 420,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const text = extractTextFromGemini(payload);
  return text || answer;
};

export const SendChatbotMessage = async (req: Request, res: Response) => {
  try {
    const message = String(req.body.message || '').trim();
    const history = extractConversationHistory(req.body.history);

    if (!message) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung câu hỏi' });
    }

    const historyText = history.map((item) => `${item.role}: ${item.content}`).join('\n');
    const chatUser = await getChatUser(req);
    const personalization = chatUser ? await getPersonalizationContext(req, chatUser.account_id) : null;

    const [brands, genres] = await Promise.all([
      prisma.brand.findMany({ select: { brand_id: true, brand_name: true } }),
      prisma.genre.findMany({ select: { genre_id: true, genre_name: true } }),
    ]);

    const normalizedMessage = normalizeText(message);
    const budgetIntent = parseBudgetIntent(message);
    const intent = detectIntent(message);
    const wantsDiscounts = /(khuyen mai|giam gia|voucher|uu dai|deal)/.test(normalizedMessage);
    const isSmallTalk = intent === 'small_talk';

    const matchedBrandRows = brands.filter((item) => {
      const brandName = normalizeText(item.brand_name || '');
      return brandName && normalizedMessage.includes(brandName);
    });

    const matchedGenreRows = genres.filter((item) => {
      const genreName = normalizeText(item.genre_name || '');
      return genreName && normalizedMessage.includes(genreName);
    });

    const whereClause: any = {
      status: '1',
      quantity: { not: '0' },
    };

    if (intent === 'accessories') {
      whereClause.Type = 2;
    } else if (['laptops', 'gaming_laptops', 'design_laptops', 'study_laptops', 'budget', 'compare_products'].includes(intent)) {
      whereClause.Type = 1;
    }

    if (matchedBrandRows.length) {
      whereClause.brand_id = { in: matchedBrandRows.map((item) => item.brand_id) };
    }

    if (matchedGenreRows.length) {
      whereClause.genre_id = { in: matchedGenreRows.map((item) => item.genre_id) };
    }

    const orderBy: any =
      intent === 'best_sellers'
        ? [{ buyturn: 'desc' }, { view: 'desc' }, { product_id: 'desc' }]
        : [{ product_id: 'desc' }];

    const rawProducts = await prisma.product.findMany({
      where: whereClause,
      take: isSmallTalk ? 12 : 180,
      orderBy,
      select: {
        product_id: true,
        product_name: true,
        price: true,
        image: true,
        quantity: true,
        Type: true,
        buyturn: true,
        brand_id: true,
        genre_id: true,
        disscount_id: true,
      },
    });

    const brandIds = [...new Set(rawProducts.map((item) => item.brand_id).filter(Boolean))];
    const genreIds = [...new Set(rawProducts.map((item) => item.genre_id).filter(Boolean))];
    const discountIds = [...new Set(rawProducts.map((item) => item.disscount_id).filter(Boolean))];
    const productIds = rawProducts.map((item) => item.product_id);

    const [brandRows, genreRows, discountRows, feedbackRows] = await Promise.all([
      brandIds.length
        ? prisma.brand.findMany({ where: { brand_id: { in: brandIds } }, select: { brand_id: true, brand_name: true } })
        : Promise.resolve([]),
      genreIds.length
        ? prisma.genre.findMany({ where: { genre_id: { in: genreIds } }, select: { genre_id: true, genre_name: true } })
        : Promise.resolve([]),
      discountIds.length
        ? prisma.discount.findMany({
            where: { disscount_id: { in: discountIds } },
            select: { disscount_id: true, discount_price: true, discount_star: true, discount_end: true },
          })
        : Promise.resolve([]),
      productIds.length
        ? prisma.feedback.findMany({
            where: { product_id: { in: productIds }, stastus: '2' },
            select: { product_id: true, rate_star: true },
          })
        : Promise.resolve([]),
    ]);

    const brandMap = new Map(brandRows.map((item) => [item.brand_id, item.brand_name || '']));
    const genreMap = new Map(genreRows.map((item) => [item.genre_id, item.genre_name || '']));
    const discountMap = new Map(discountRows.map((item) => [item.disscount_id, item]));
    const feedbackMap = new Map<number, { sum: number; count: number }>();

    feedbackRows.forEach((item) => {
      const current = feedbackMap.get(item.product_id) || { sum: 0, count: 0 };
      current.sum += item.rate_star;
      current.count += 1;
      feedbackMap.set(item.product_id, current);
    });

    let products = rawProducts.map((product) => {
      const price = Number(product.price || 0);
      const discount = discountMap.get(product.disscount_id);
      const priceAfterDiscount = computeDiscountedPrice(price, discount);
      const feedback = feedbackMap.get(product.product_id);
      const avgRating = feedback?.count ? Number((feedback.sum / feedback.count).toFixed(1)) : 0;
      const feedbackCount = feedback?.count || 0;

      return {
        product_id: product.product_id,
        product_name: product.product_name || '',
        image: product.image || '',
        price,
        priceAfterDiscount,
        quantity: product.quantity,
        brand_name: brandMap.get(product.brand_id) || '',
        genre_name: genreMap.get(product.genre_id) || '',
        type: product.Type,
        avgRating,
        feedbackCount,
      };
    });

    if (budgetIntent?.mode === 'max') {
      products = products.filter((product) => product.priceAfterDiscount <= budgetIntent.max);
    }
    if (budgetIntent?.mode === 'min') {
      products = products.filter((product) => product.priceAfterDiscount >= budgetIntent.min);
    }
    if (budgetIntent?.mode === 'between') {
      products = products.filter(
        (product) => product.priceAfterDiscount >= budgetIntent.min && product.priceAfterDiscount <= budgetIntent.max
      );
    }

    if (wantsDiscounts || intent === 'discounts') {
      products = products.filter((product) => product.priceAfterDiscount < product.price);
    }

    if (intent === 'gaming_laptops') {
      products = products.filter((product) => {
        const haystack = normalizeText(`${product.product_name} ${product.brand_name}`);
        return ['gaming', 'rog', 'tuf', 'nitro', 'legion', 'predator'].some((keyword) => haystack.includes(keyword));
      });
    }

    if (intent === 'design_laptops') {
      products = products.filter((product) => {
        const haystack = normalizeText(`${product.product_name} ${product.brand_name}`);
        return ['rtx', 'creator', 'proart', 'vivobook', 'thinkpad', '16gb', 'i7', 'i9', 'ryzen 7', 'ryzen 9'].some((keyword) =>
          haystack.includes(keyword)
        );
      });
    }

    if (intent === 'study_laptops') {
      products = products.filter((product) => product.priceAfterDiscount <= 25000000);
    }

    const keywordTokens = normalizedMessage
      .split(/\s+/)
      .filter(
        (token) =>
          token.length >= 2 &&
          !['laptop', 'phu', 'kien', 'duoi', 'tren', 'cho', 'toi', 'minh', 'mua', 'tim', 'can', 'loai', 'gia', 'co', 'khong', 'la', 'nhung', 'dang', 'so', 'sanh', 'va', 'voi', 'hay', 'hon'].includes(token)
      );

    const matchedBrands = matchedBrandRows.map((item) => normalizeText(item.brand_name || ''));
    const matchedGenres = matchedGenreRows.map((item) => normalizeText(item.genre_name || ''));

    products = products
      .map((product) => ({
        ...product,
        score: scoreProduct(product, message, keywordTokens, matchedBrands, matchedGenres, wantsDiscounts),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (budgetIntent?.mode === 'max' && b.priceAfterDiscount !== a.priceAfterDiscount) return a.priceAfterDiscount - b.priceAfterDiscount;
        if (budgetIntent?.mode === 'min' && b.priceAfterDiscount !== a.priceAfterDiscount) return b.priceAfterDiscount - a.priceAfterDiscount;
        return b.product_id - a.product_id;
      });

    let answer = 'Tôi có thể giúp bạn tìm laptop, phụ kiện, sản phẩm đang giảm giá hoặc gợi ý theo tầm giá.';
    let wantsProductListing = !isSmallTalk;
    let orderContextText = '';
    let comparisonContextText = '';
    const personalizationText = personalization?.text || '';

    if (isSmallTalk) {
      wantsProductListing = false;
      products = [];
      if (/(ban la ai)/.test(normalizedMessage)) {
        answer = 'Tôi là AI hỗ trợ của Quang\'s Shop. Tôi có thể giúp bạn tư vấn laptop, phụ kiện, lọc theo hãng, tầm giá, khuyến mãi hoặc nhu cầu sử dụng.';
      } else if (/(cam on|thank)/.test(normalizedMessage)) {
        answer = 'Không có gì. Khi bạn cần tìm laptop, phụ kiện hoặc muốn lọc theo hãng, giá và khuyến mãi, cứ nhắn tiếp cho tôi.';
      } else {
        answer = 'Chào bạn. Tôi đang ở đây để hỗ trợ tư vấn sản phẩm và giải đáp các câu hỏi liên quan đến cửa hàng.';
      }
    }

    if (intent === 'order_lookup') {
      wantsProductListing = false;
      products = [];

      if (!chatUser) {
        answer = 'Bạn cần đăng nhập để tôi tra cứu đơn hàng của tài khoản này.';
      } else {
        const orderLookup = await getOrderLookupContext(chatUser.account_id, message);
        answer = orderLookup.answer;
        orderContextText = orderLookup.orders
          .map((order: any) => {
            const items = Array.isArray(order.OrderDetails) ? order.OrderDetails.length : 0;
            return `Đơn #${order.order_id} | Trạng thái=${order.status} | Tổng=${order.total} | Số sản phẩm=${items}`;
          })
          .join('\n');
      }
    }

    if (intent === 'compare_products') {
      const comparedParts = extractComparedNames(message);
      products = products.filter((product) => {
        const haystack = normalizeText(`${product.product_name} ${product.brand_name}`);
        return comparedParts.some((part) => haystack.includes(part) || part.includes(haystack));
      });

      if (!products.length) {
        products = products
          .filter((product) => keywordTokens.some((token) => normalizeText(`${product.product_name} ${product.brand_name}`).includes(token)))
          .slice(0, 3);
      } else {
        products = products.slice(0, 3);
      }

      wantsProductListing = products.length > 0;
      comparisonContextText = products
        .map(
          (product) =>
            `${product.product_name} | Hãng=${product.brand_name} | Giá=${formatCurrency(product.priceAfterDiscount)} | Đánh giá=${product.avgRating}/5 | Lượt đánh giá=${product.feedbackCount}`
        )
        .join('\n');

      answer = products.length >= 2
        ? 'Tôi đã gom các mẫu bạn đang muốn so sánh và sẽ chỉ ra khác nhau chính về giá, hãng và đánh giá thực tế.'
        : products.length === 1
        ? 'Tôi mới xác định rõ được một mẫu trong câu hỏi của bạn. Bạn có thể nêu thêm tên mẫu còn lại để tôi so sánh chính xác hơn.'
        : 'Tôi chưa xác định rõ các mẫu cần so sánh. Bạn hãy ghi rõ tên 2 sản phẩm hoặc ít nhất là hãng và dòng máy.';
    }

    if (!isSmallTalk && intent !== 'order_lookup' && intent !== 'compare_products' && (matchedBrandRows.length || matchedGenreRows.length)) {
      const labels = [
        ...matchedBrandRows.map((item) => item.brand_name).filter(Boolean),
        ...matchedGenreRows.map((item) => item.genre_name).filter(Boolean),
      ];
      answer = `Tôi đã nhận ra từ khóa sản phẩm bạn đang nhắm tới: ${labels.join(', ')}.`;
    }

    if (intent === 'best_sellers') {
      answer = products.length
        ? 'Đây là các sản phẩm đang bán chạy hoặc được quan tâm nhiều trong cửa hàng.'
        : 'Hiện tôi chưa tìm thấy sản phẩm bán chạy phù hợp với yêu cầu này.';
      products = products.slice(0, 4);
    } else if (intent === 'discounts') {
      answer = products.length
        ? 'Đây là các sản phẩm đang có giảm giá hoặc mức giá tốt trong cửa hàng.'
        : 'Hiện chưa có sản phẩm giảm giá phù hợp với yêu cầu bạn vừa nhập.';
      products = products.slice(0, 4);
    } else if (intent === 'accessories') {
      answer = products.length
        ? 'Tôi đã lọc ra một số phụ kiện phù hợp từ dữ liệu hiện tại của cửa hàng.'
        : 'Hiện tôi chưa tìm thấy phụ kiện phù hợp với yêu cầu này.';
      products = products.slice(0, 4);
    } else if (intent === 'gaming_laptops') {
      answer = products.length
        ? 'Đây là các mẫu laptop thiên về gaming hoặc hiệu năng cao mà tôi tìm được.'
        : 'Hiện tôi chưa tìm thấy laptop gaming phù hợp với yêu cầu này.';
      products = products.slice(0, 4);
    } else if (intent === 'design_laptops') {
      answer = products.length
        ? 'Đây là các mẫu máy phù hợp hơn cho đồ họa, thiết kế hoặc dựng nội dung.'
        : 'Hiện tôi chưa tìm thấy laptop đồ họa phù hợp với yêu cầu này.';
      products = products.slice(0, 4);
    } else if (intent === 'study_laptops') {
      answer = products.length
        ? 'Đây là các mẫu laptop phù hợp hơn cho học tập, văn phòng và nhu cầu dùng hằng ngày.'
        : 'Hiện tôi chưa tìm thấy laptop học tập phù hợp với yêu cầu này.';
      products = products.slice(0, 4);
    } else if (intent === 'budget') {
      answer = products.length
        ? budgetIntent?.mode === 'min'
          ? `Tôi đã lọc các sản phẩm có giá từ ${formatCurrency(budgetIntent.min)} trở lên.`
          : budgetIntent?.mode === 'between'
          ? `Tôi đã lọc các sản phẩm trong khoảng từ ${formatCurrency(budgetIntent.min)} đến ${formatCurrency(budgetIntent.max)}.`
          : budgetIntent?.mode === 'max'
          ? `Tôi đã lọc các sản phẩm trong tầm giá không vượt quá ${formatCurrency(budgetIntent.max)}.`
          : 'Tôi đã lọc các sản phẩm theo tầm giá bạn đang quan tâm.'
        : budgetIntent?.mode === 'min'
        ? `Hiện tôi chưa tìm thấy sản phẩm có giá từ ${formatCurrency(budgetIntent.min)} trở lên phù hợp với yêu cầu này.`
        : 'Tôi chưa tìm thấy sản phẩm nằm trong tầm giá bạn vừa nêu.';
      products = products.slice(0, 4);
    } else if (intent === 'laptops') {
      answer = products.length
        ? 'Đây là một số mẫu laptop nổi bật tôi tìm được từ cửa hàng hiện tại.'
        : 'Hiện tôi chưa tìm thấy laptop phù hợp với yêu cầu này.';
      products = products.slice(0, 4);
    } else if (intent === 'general') {
      if (!products.length) {
        answer = 'Tôi chưa tìm được sản phẩm khớp ngay. Bạn có thể nói rõ hơn về thương hiệu, loại máy, tầm giá hoặc việc có muốn ưu tiên hàng giảm giá hay không.';
      } else if (matchedBrandRows.length || matchedGenreRows.length) {
        const labels = [
          ...matchedBrandRows.map((item) => item.brand_name).filter(Boolean),
          ...matchedGenreRows.map((item) => item.genre_name).filter(Boolean),
        ];
        answer = `Tôi đã nhận ra từ khóa bạn đang hỏi như ${labels.join(', ')} và lọc ra các gợi ý phù hợp nhất từ dữ liệu hiện tại.`;
      } else {
        answer = personalization?.favoriteBrands?.length
          ? `Tôi đã tìm được một vài gợi ý phù hợp. Dựa trên hành vi gần đây của bạn, tôi sẽ ưu tiên các hãng như ${personalization.favoriteBrands.join(', ')} nếu chúng vẫn khớp với câu hỏi.`
          : 'Tôi đã tìm được một vài gợi ý phù hợp từ dữ liệu sản phẩm hiện tại của cửa hàng.';
      }
      products = products.slice(0, 4);
    }

    if (!wantsProductListing) {
      products = [];
    }

    const finalAnswer = await enhanceAnswerWithGemini({
      message,
      answer,
      products,
      wantsProductListing,
      historyText,
      orderContextText,
      comparisonContextText,
      personalizationText,
    }).catch((error) => {
      console.error('Gemini enhanceAnswer error:', error);
      return answer;
    });

    return res.json({
      success: true,
      data: {
        answer: finalAnswer,
        products,
        provider: GEMINI_API_KEY ? 'gemini' : 'rules',
      },
    });
  } catch (error) {
    console.error('SendChatbotMessage error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xử lý chatbot' });
  }
};
