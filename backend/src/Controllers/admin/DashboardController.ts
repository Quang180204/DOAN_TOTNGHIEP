import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';

const formatValue = (value: any): any => {
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

export const GetDashboardStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    // Giờ Việt Nam (UTC+7)
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const todayStr = vnTime.toISOString().split('T')[0];
    const currentYear = vnTime.getFullYear();

    // Lấy tất cả đơn hàng đã hoàn thành (status = 3)
    const successfulOrders = await prisma.order.findMany({
      where: { status: '3' },
      select: { order_id: true, oder_date: true, total: true }
    });

    const orderIds = successfulOrders.map(o => o.order_id);
    
    // Map lưu ngày và tháng của từng đơn hàng (đã chuyển sang giờ VN)
    const orderInfoMap = new Map(successfulOrders.map(o => {
      const d = new Date(o.oder_date.getTime() + (7 * 60 * 60 * 1000));
      return [
        o.order_id, 
        { 
          dateStr: d.toISOString().split('T')[0],
          month: d.getMonth(), // 0-11
          year: d.getFullYear()
        }
      ];
    }));

    let totalRevenue = 0;
    let revenueByMonth = new Array(12).fill(0);
    let ordersByMonth = new Array(12).fill(0);
    let revenueByCategory: Record<string, number> = { Laptop: 0, 'Phụ kiện': 0 };
    let revenueByCategoryToday: Record<string, number> = {};
    let topProductsMap = new Map<number, { name: string, sold: number, price: number, revenue: number, image: string }>();

    if (successfulOrders.length > 0) {
      for (const o of successfulOrders) {
        const info = orderInfoMap.get(o.order_id);
        if (info && info.year === currentYear) {
          ordersByMonth[info.month] += 1;
        }
      }

      // SỬ DỤNG queryRaw cho OrderDetail
      const details: any[] = await prisma.$queryRaw`SELECT * FROM "oder_detail" WHERE order_id IN (${Prisma.join(orderIds)})`;

      if (details.length > 0) {
        const productIds = Array.from(new Set(details.map(d => d.product_id)));
        const products = await prisma.product.findMany({
          where: { product_id: { in: productIds } },
          select: { product_id: true, product_name: true, price: true, image: true, genre_id: true, Type: true }
        });

        const productMap = new Map(products.map(p => [p.product_id, p]));

        for (const d of details) {
          const product = productMap.get(d.product_id);
          const info = orderInfoMap.get(d.order_id);
          
          if (product && info) {
            const lineRevenue = Number(d.price) * Number(d.quantity);
            const categoryName = product.Type === 2 ? 'Phụ kiện' : 'Laptop';

            revenueByCategory[categoryName] = (revenueByCategory[categoryName] || 0) + lineRevenue;
            if (info.year === currentYear) {
              revenueByMonth[info.month] += lineRevenue;
            }

            // Doanh thu theo nhóm sản phẩm trong ngày
            if (info.dateStr === todayStr) {
              revenueByCategoryToday[categoryName] = (revenueByCategoryToday[categoryName] || 0) + lineRevenue;
            }

            // Top sản phẩm
            const existing = topProductsMap.get(d.product_id);
            if (existing) {
              existing.sold += Number(d.quantity);
              existing.revenue += lineRevenue;
            } else {
              topProductsMap.set(d.product_id, {
                name: product.product_name || '',
                sold: Number(d.quantity),
                price: Number(d.price) || Number(product.price),
                revenue: lineRevenue,
                image: product.image || ''
              });
            }
          }
        }
      }
    }

    totalRevenue = Object.values(revenueByCategory).reduce((sum, revenue) => sum + revenue, 0);

    const [totalAccounts, totalProducts, recentOrders] = await Promise.all([
      prisma.account.count(),
      prisma.product.count(),
      prisma.order.findMany({
        orderBy: { oder_date: 'desc' },
        take: 5
      })
    ]);

    const recentOrdersWithCustomer = await Promise.all(recentOrders.map(async (o) => {
      const [account, orderAddress] = await Promise.all([
        o.account_id ? prisma.account.findUnique({
          where: { account_id: o.account_id },
          select: { Name: true, Phone: true }
        }) : null,
        o.orderAddressId ? prisma.orderAddress.findUnique({
          where: { orderAddressId: o.orderAddressId },
          select: { orderUsername: true, orderPhonenumber: true }
        }) : null
      ]);
      return {
        ...o,
        customer_name: orderAddress?.orderUsername || account?.Name || 'Khách vãng lai',
        phone: orderAddress?.orderPhonenumber || account?.Phone || '---'
      };
    }));

    const responseData = {
      totalRevenue,
      totalOrders: successfulOrders.length,
      totalProducts,
      totalUsers: totalAccounts,
      revenuePercent: 0, 
      ordersPercent: 0,
      productsPercent: 0,
      usersPercent: 0,
      revenueByMonth: revenueByMonth.map(v => v / 1000000), // Đơn vị Triệu (tr) để hiển thị biểu đồ đẹp hơn
      ordersByMonth,
      topProducts: Array.from(topProductsMap.values())
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)
        .map(p => ({
          product_name: p.name,
          sold: p.sold,
          price: p.price,
          revenue: p.revenue,
          image: p.image
        })),
      recentOrders: recentOrdersWithCustomer,
      revenueByCategory,
      revenueByCategoryToday,
      activeUsers: totalAccounts,
      activeUsersPercent: 0
    };

    res.json({
      success: true,
      data: formatValue(responseData)
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};
