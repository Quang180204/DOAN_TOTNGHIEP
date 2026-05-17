import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/authMiddleware';

// Helper: Lấy ID từ params an toàn
const getParamId = (param: string | string[] | undefined): number | null => {
  if (!param) return null;
  const idStr = typeof param === 'string' ? param : param[0];
  const id = parseInt(idStr);
  return isNaN(id) ? null : id;
};

// Helper: Tính giá sau discount
const getPriceAfterDiscount = (product: any): number => {
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

// Helper: Lấy discount cho sản phẩm
const getProductDiscount = async (disscountId: number) => {
  return await prisma.discount.findUnique({
    where: { disscount_id: disscountId }
  });
};

// Helper: Lấy genre cho sản phẩm
const getProductGenre = async (genreId: number) => {
  return await prisma.genre.findUnique({
    where: { genre_id: genreId }
  });
};

// Helper: Lấy brand cho sản phẩm
const getProductBrand = async (brandId: number) => {
  return await prisma.brand.findUnique({
    where: { brand_id: brandId }
  });
};

// Helper: Lấy images cho sản phẩm
const getProductImages = async (productId: number) => {
  return await prisma.productImages.findMany({
    where: { product_id: productId }
  });
};

// Helper: Lấy rating trung bình cho sản phẩm
const getAvgRating = async (productId: number): Promise<number> => {
  const feedbacks = await prisma.feedback.findMany({
    where: {
      product_id: productId,
      stastus: '2'
    },
    select: { rate_star: true }
  });
  
  if (feedbacks.length === 0) return 0;
  const sum = feedbacks.reduce((acc, fb) => acc + fb.rate_star, 0);
  return parseFloat((sum / feedbacks.length).toFixed(1));
};

// Helper: Format sản phẩm
const formatProduct = async (product: any) => {
  const [discount, genre, brand, images, avgRating] = await Promise.all([
    getProductDiscount(product.disscount_id),
    getProductGenre(product.genre_id),
    getProductBrand(product.brand_id),
    getProductImages(product.product_id),
    getAvgRating(product.product_id)
  ]);

  return {
    product_id: product.product_id,
    product_name: product.product_name,
    price: product.price.toString(),
    view: product.view?.toString(),
    buyturn: product.buyturn?.toString(),
    quantity: product.quantity,
    status: product.status,
    image: product.image,
    description: product.description,
    specifications: product.specifications,
    Type: product.Type,
    create_at: product.create_at,
    priceAfterDiscount: getPriceAfterDiscount({ ...product, discount }).toString(),
    avgRating,
    discount: discount ? {
      discount_id: discount.disscount_id,
      discount_name: discount.discount_name,
      discount_price: discount.discount_price,
      discount_star: discount.discount_star,
      discount_end: discount.discount_end
    } : null,
    genre: genre ? {
      genre_id: genre.genre_id,
      genre_name: genre.genre_name
    } : null,
    brand: brand ? {
      brand_id: brand.brand_id,
      brand_name: brand.brand_name
    } : null,
    images: images.map(img => ({ image: img.image }))
  };
};

// Helper: Lấy danh sách sản phẩm có phân trang và sắp xếp
const getProductsWithPagination = async (
  whereClause: any,
  page: number,
  sortOrder: string,
  pageSize: number = 9
) => {
  const pageNumber = page || 1;
  const skip = (pageNumber - 1) * pageSize;
  
  let orderBy: any = { create_at: 'desc' };
  switch (sortOrder) {
    case 'price_asc':
      orderBy = { price: 'asc' };
      break;
    case 'price_desc':
      orderBy = { price: 'desc' };
      break;
    case 'date_asc':
      orderBy = { create_at: 'asc' };
      break;
    case 'date_desc':
      orderBy = { create_at: 'desc' };
      break;
    case 'name_asc':
      orderBy = { product_name: 'asc' };
      break;
    case 'name_desc':
      orderBy = { product_name: 'desc' };
      break;
    case 'popular':
      orderBy = [{ buyturn: 'desc' }, { view: 'desc' }];
      break;
    default:
      orderBy = { create_at: 'desc' };
  }

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: pageSize
    }),
    prisma.product.count({ where: whereClause })
  ]);

  const productsWithDetails = await Promise.all(products.map(p => formatProduct(p)));

  return {
    products: productsWithDetails,
    total: totalCount,
    page: pageNumber,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize)
  };
};

// ==================== CONTROLLER FUNCTIONS ====================

// 1. Danh sách Laptop (Type = 1)
export const Laptop = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const sortOrder = (req.query.sortOrder as string) || '';

    const whereClause = {
      status: '1',
      Type: 1,
      quantity: { not: '0' }
    };

    const result = await getProductsWithPagination(whereClause, page, sortOrder, 16);

    res.json({
      success: true,
      type: 'Laptop',
      ...result
    });
  } catch (error) {
    console.error('Laptop error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// 2. Danh sách Phụ kiện (Type = 2)
export const Accessories = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const sortOrder = (req.query.sortOrder as string) || '';

    const whereClause = {
      status: '1',
      Type: 2,
      quantity: { not: '0' }
    };

    const result = await getProductsWithPagination(whereClause, page, sortOrder, 16);

    res.json({
      success: true,
      type: 'Phụ kiện',
      ...result
    });
  } catch (error) {
    console.error('Accessories error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// 3. Chi tiết sản phẩm
export const ProductDetail = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 5;

    const product = await prisma.product.findFirst({
      where: {
        product_id: id,
        status: '1'
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    // Tăng lượt xem
    await prisma.product.update({
      where: { product_id: id },
      data: { view: { increment: 1 } }
    });

    // Lấy thông tin chi tiết của sản phẩm
    const formattedProduct = await formatProduct(product);

    // Sản phẩm liên quan (cùng genre_id)
    const relatedProductsRaw = await prisma.product.findMany({
      where: {
        status: '1',
        genre_id: product.genre_id,
        product_id: { not: id },
        quantity: { not: '0' }
      },
      take: 8
    });

    const relatedProducts = await Promise.all(relatedProductsRaw.map(p => formatProduct(p)));

    // Lấy danh sách bình luận
    const skip = (page - 1) * pageSize;
    const [feedbacksRaw, totalFeedbacks] = await Promise.all([
      prisma.feedback.findMany({
        where: {
          product_id: id,
          stastus: '2'
        },
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.feedback.count({
        where: { product_id: id, stastus: '2' }
      })
    ]);

    // Lấy thông tin account và replies cho từng feedback
    const feedbacks = await Promise.all(feedbacksRaw.map(async (fb) => {
      const account = await prisma.account.findUnique({
        where: { account_id: fb.account_id },
        select: { Name: true, Avatar: true, account_id: true }
      });
      
      const replies = await prisma.replyFeedback.findMany({
        where: { feedback_id: fb.feedback_id, stastus: '2' },
        orderBy: { create_at: 'asc' }
      });
      
      const repliesWithAccount = await Promise.all(replies.map(async (reply) => {
        const replyAccount = await prisma.account.findUnique({
          where: { account_id: reply.account_id },
          select: { Name: true, Avatar: true, account_id: true }
        });
        return { ...reply, account: replyAccount };
      }));
      
      return { ...fb, account, replies: repliesWithAccount };
    }));

    res.json({
      success: true,
      product: formattedProduct,
      relatedProducts,
      feedbacks: {
        data: feedbacks,
        total: totalFeedbacks,
        page,
        pageSize,
        totalPages: Math.ceil(totalFeedbacks / pageSize)
      }
    });
  } catch (error) {
    console.error('ProductDetail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// 4. Tìm kiếm sản phẩm
export const SearchResult = async (req: Request, res: Response) => {
  try {
    const searchText = (req.query.s as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const sortOrder = (req.query.sortOrder as string) || '';

    if (!searchText.trim()) {
      return res.json({
        success: true,
        products: [],
        total: 0,
        searchText: '',
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    const whereClause = {
      status: '1',
      quantity: { not: '0' },
      OR: [
        { product_name: { contains: searchText, mode: 'insensitive' } },
        { product_id: { equals: parseInt(searchText) || -1 } }
      ]
    };

    const result = await getProductsWithPagination(whereClause, page, sortOrder);

    res.json({
      success: true,
      searchText,
      ...result
    });
  } catch (error) {
    console.error('SearchResult error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// 5. Bình luận sản phẩm
export const ProductComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để bình luận' });
    }

    const { productId, discountId, genreId, rateStar, commentContent } = req.body;

    if (!productId || !rateStar || !commentContent) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (rateStar < 1 || rateStar > 5) {
      return res.status(400).json({ success: false, message: 'Số sao phải từ 1 đến 5' });
    }

    const purchasedProduct = await prisma.$queryRaw<any[]>`
      SELECT od.product_id
      FROM "oder_detail" od
      INNER JOIN "order" o ON o.order_id = od.order_id
      WHERE o.account_id = ${req.user.account_id}
        AND o.status = '3'
        AND od.product_id = ${Number(productId)}
      LIMIT 1
    `;

    if (purchasedProduct.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Ban chi co the danh gia sau khi da mua va nhan hang san pham'
      });
    }

    const maxFeedback = await prisma.$queryRaw<[{ max: number }]>`SELECT COALESCE(MAX(feedback_id), 0) AS max FROM feedback`;
    const nextFeedbackId = Number(maxFeedback[0].max) + 1;

    const feedback = await prisma.feedback.create({
      data: {
        feedback_id: nextFeedbackId,
        account_id: req.user.account_id,
        product_id: productId,
        disscount_id: discountId || 0,
        genre_id: genreId || 0,
        rate_star: rateStar,
        content: commentContent,
        stastus: '2',
        create_at: new Date(),
        create_by: req.user.account_id.toString(),
        update_at: new Date(),
        update_by: req.user.account_id.toString()
      }
    });

    const account = await prisma.account.findUnique({
      where: { account_id: req.user.account_id },
      select: { Name: true, Avatar: true }
    });

    res.json({
      success: true,
      message: 'Bình luận thành công',
      feedback: { ...feedback, account }
    });
  } catch (error) {
    console.error('ProductComment error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// 6. Phản hồi bình luận
export const ReplyComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để phản hồi' });
    }

    const { feedbackId, replyContent } = req.body;

    if (!feedbackId || !replyContent) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const feedback = await prisma.feedback.findUnique({
      where: { feedback_id: feedbackId }
    });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Bình luận không tồn tại' });
    }

    const maxReply = await prisma.$queryRaw<[{ max: number }]>`SELECT COALESCE(MAX(rep_feedback_id), 0) AS max FROM replyfeedback`;
    const nextReplyId = Number(maxReply[0].max) + 1;

    const reply = await prisma.replyFeedback.create({
      data: {
        rep_feedback_id: nextReplyId,
        feedback_id: feedbackId,
        account_id: req.user.account_id,
        content: replyContent,
        stastus: '2',
        create_at: new Date()
      }
    });

    const account = await prisma.account.findUnique({
      where: { account_id: req.user.account_id },
      select: { Name: true, Avatar: true }
    });

    res.json({
      success: true,
      message: 'Phản hồi thành công',
      reply: { ...reply, account }
    });
  } catch (error) {
    console.error('ReplyComment error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// 7. Lấy danh sách bình luận theo sản phẩm
export const GetProductFeedbacks = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 5;
    const skip = (page - 1) * pageSize;

    const [feedbacksRaw, total] = await Promise.all([
      prisma.feedback.findMany({
        where: {
          product_id: id,
          stastus: '2'
        },
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.feedback.count({
        where: { product_id: id, stastus: '2' }
      })
    ]);

    const feedbacks = await Promise.all(feedbacksRaw.map(async (fb) => {
      const account = await prisma.account.findUnique({
        where: { account_id: fb.account_id },
        select: { Name: true, Avatar: true, account_id: true }
      });
      
      const replies = await prisma.replyFeedback.findMany({
        where: { feedback_id: fb.feedback_id, stastus: '2' },
        orderBy: { create_at: 'asc' }
      });
      
      const repliesWithAccount = await Promise.all(replies.map(async (reply) => {
        const replyAccount = await prisma.account.findUnique({
          where: { account_id: reply.account_id },
          select: { Name: true, Avatar: true, account_id: true }
        });
        return { ...reply, account: replyAccount };
      }));
      
      return { ...fb, account, replies: repliesWithAccount };
    }));

    res.json({
      success: true,
      data: feedbacks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetProductFeedbacks error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};
