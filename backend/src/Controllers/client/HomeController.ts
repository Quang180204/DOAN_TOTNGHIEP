import { Request, Response } from 'express';
import prisma from '../../config/prisma';

// Trang chủ - Lấy sản phẩm hiển thị
export const Index = async (req: Request, res: Response) => {
  try {
    // 1. Sản phẩm HOT (bán chạy + nhiều lượt xem)
    const hotProduct = await prisma.product.findMany({
      where: {
        status: '1',
        quantity: { not: '0' }
      },
      orderBy: [
        { buyturn: 'desc' },
        { view: 'desc' }
      ],
      take: 8
    });

    // 2. Sản phẩm mới nhất
    const newProduct = await prisma.product.findMany({
      where: {
        status: '1',
        quantity: { not: '0' }
      },
      orderBy: {
        create_at: 'desc'
      },
      take: 8
    });

    // 3. Sản phẩm Laptop (Type = 1)
    const laptop = await prisma.product.findMany({
      where: {
        status: '1',
        Type: 1,
        quantity: { not: '0' }
      },
      orderBy: [
        { buyturn: 'desc' },
        { view: 'desc' }
      ],
      take: 8
    });

    // 4. Sản phẩm Phụ kiện (Type = 2)
    const accessory = await prisma.product.findMany({
      where: {
        status: '1',
        Type: 2,
        quantity: { not: '0' }
      },
      orderBy: [
        { buyturn: 'desc' },
        { view: 'desc' }
      ],
      take: 8
    });

    // 5. Lấy discount riêng cho từng sản phẩm
    const getProductsWithDiscount = async (products: any[]) => {
      return await Promise.all(products.map(async (product) => {
        const discount = await prisma.discount.findUnique({
          where: { disscount_id: product.disscount_id }
        });
        const genre = await prisma.genre.findUnique({
          where: { genre_id: product.genre_id }
        });
        const brand = await prisma.brand.findUnique({
          where: { brand_id: product.brand_id }
        });
        return { ...product, discount, genre, brand };
      }));
    };

    // Lấy rating trung bình cho sản phẩm
    const feedbacks = await prisma.feedback.findMany({
      where: { stastus: '2' },
      select: {
        product_id: true,
        rate_star: true
      }
    });

    // Tính rating trung bình
    const ratingMap = new Map<number, { sum: number; count: number }>();
    feedbacks.forEach(fb => {
      const current = ratingMap.get(fb.product_id) || { sum: 0, count: 0 };
      ratingMap.set(fb.product_id, {
        sum: current.sum + fb.rate_star,
        count: current.count + 1
      });
    });

    const getAvgRating = (productId: number): number => {
      const rating = ratingMap.get(productId);
      if (!rating || rating.count === 0) return 0;
      return parseFloat((rating.sum / rating.count).toFixed(1));
    };

    // Format dữ liệu
    const formatProducts = (products: any[]) => {
      return products.map(p => ({
        product_id: p.product_id,
        product_name: p.product_name,
        price: p.price.toString(),
        view: p.view?.toString(),
        buyturn: p.buyturn?.toString(),
        image: p.image,
        quantity: p.quantity,
        Type: p.Type,
        priceAfterDiscount: p.discount && p.discount.discount_star && p.discount.discount_end
          ? (p.price - p.discount.discount_price).toString()
          : p.price.toString(),
        avgRating: getAvgRating(p.product_id),
        discount: p.discount ? {
          discount_id: p.discount.disscount_id,
          discount_name: p.discount.discount_name,
          discount_price: p.discount.discount_price,
          discount_star: p.discount.discount_star,
          discount_end: p.discount.discount_end
        } : null,
        genre: p.genre,
        brand: p.brand
      }));
    };

    const hotWithDiscount = await getProductsWithDiscount(hotProduct);
    const newWithDiscount = await getProductsWithDiscount(newProduct);
    const laptopWithDiscount = await getProductsWithDiscount(laptop);
    const accessoryWithDiscount = await getProductsWithDiscount(accessory);

    const data = {
      hotProduct: formatProducts(hotWithDiscount),
      newProduct: formatProducts(newWithDiscount),
      laptop: formatProducts(laptopWithDiscount),
      accessory: formatProducts(accessoryWithDiscount)
    };

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('HomeController error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ, vui lòng thử lại sau'
    });
  }
};