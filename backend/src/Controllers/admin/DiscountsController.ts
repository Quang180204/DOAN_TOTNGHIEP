import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/authMiddleware';
import { Prisma } from '@prisma/client';

const getParamId = (param: string | string[] | undefined): number | null => {
  if (!param) return null;
  const idStr = typeof param === 'string' ? param : param[0];
  const id = parseInt(idStr);
  return isNaN(id) ? null : id;
};

// Format tiền Việt
const formatCurrency = (price: number): string => {
  return (price || 0).toLocaleString('vi-VN') + '₫';
};

// Danh sách mã giảm giá
export const GetDiscounts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.size as string) || 10;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    let whereClause: Prisma.DiscountWhereInput = {};
    if (search) {
      whereClause = {
        OR: [
          { discount_name: { contains: search, mode: 'insensitive' } },
          { discount_code: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({
        where: whereClause,
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.discount.count({ where: whereClause })
    ]);

    const discountsWithCount = await Promise.all(discounts.map(async (discount) => {
      const productCount = await prisma.product.count({
        where: { disscount_id: discount.disscount_id }
      });
      return { ...discount, productCount };
    }));

    res.json({
      success: true,
      data: discountsWithCount,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Tạo mã giảm giá mới (Đã đưa về cơ chế chuẩn giống hàm Edit)
export const CreateDiscount = async (req: AuthRequest, res: Response) => {
  try {
    const { discountStart, discountEnd, discountPrice, discountCode, quantity } = req.body;
    const safeCode = discountCode ? String(discountCode).trim().slice(0, 10).toUpperCase() : null;

    if (!discountStart || !discountEnd || !discountPrice || !quantity) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const startDate = new Date(discountStart);
    const endDate = new Date(discountEnd);
    const numPrice = Number(discountPrice);
    const numQty = Number(quantity);

    const formattedPrice = formatCurrency(numPrice);
    const discountName = `Giảm ${formattedPrice} [${safeCode || 'KM'}]`;

    // Lấy ID tiếp theo thủ công do sequence PostgreSQL bị lệch
    const maxResult = await prisma.$queryRaw<[{ max: number }]>`SELECT COALESCE(MAX(disscount_id), 0) AS max FROM discount`;
    const nextId = Number(maxResult[0].max) + 1;

    const discount = await prisma.discount.create({
      data: {
        disscount_id: nextId,
        discount_name: discountName,
        discount_price: numPrice,
        discount_star: startDate,
        discount_end: endDate,
        discount_code: safeCode,
        quantity: numQty,
        create_by: req.user?.Name || 'admin',
        create_at: new Date(),
        update_by: req.user?.Name || 'admin',
        update_at: new Date()
      }
    });

    res.json({ success: true, message: 'Tạo mã thành công', data: discount });
  } catch (error) {
    console.error('CreateDiscount error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo mã' });
  }
};

// Sửa mã giảm giá (Đang hoạt động tốt)
export const EditDiscount = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    const { discountStart, discountEnd, discountPrice, discountCode, quantity } = req.body;
    const safeCode = discountCode ? String(discountCode).trim().slice(0, 10).toUpperCase() : null;

    if (!id) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    const startDate = new Date(discountStart);
    const endDate = new Date(discountEnd);
    const numPrice = Number(discountPrice);
    const formattedPrice = formatCurrency(numPrice);

    const discountName = `Giảm ${formattedPrice} [${safeCode || 'KM'}]`;

    await prisma.discount.update({
      where: { disscount_id: id },
      data: {
        discount_name: discountName,
        discount_price: numPrice,
        discount_star: startDate,
        discount_end: endDate,
        discount_code: safeCode,
        quantity: Number(quantity),
        update_at: new Date(),
        update_by: req.user?.Name || 'admin'
      }
    });

    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Xóa mã giảm giá
export const DeleteDiscount = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    await prisma.discount.delete({
      where: { disscount_id: id }
    });

    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};
