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

// Danh sách thương hiệu
export const GetBrands = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.size as string) || 15;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    let whereClause: Prisma.BrandWhereInput = {};
    
    if (search) {
      whereClause = {
        brand_name: { contains: search, mode: 'insensitive' as Prisma.QueryMode }
      };
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where: whereClause,
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.brand.count({ where: whereClause })
    ]);

    // Lấy số lượng sản phẩm cho từng brand
    const brandsWithCount = await Promise.all(brands.map(async (brand) => {
      const productCount = await prisma.product.count({
        where: { brand_id: brand.brand_id }
      });
      return { ...brand, productCount };
    }));

    res.json({
      success: true,
      data: brandsWithCount,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetBrands error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Tạo thương hiệu mới
export const CreateBrand = async (req: AuthRequest, res: Response) => {
  try {
    const { brandName } = req.body;

    if (!brandName) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên thương hiệu' });
    }

    // Kiểm tra tồn tại
    const existBrand = await prisma.brand.findFirst({
      where: { brand_name: brandName }
    });

    if (existBrand) {
      return res.json({ success: false, message: 'exist', data: 'Thương hiệu đã tồn tại' });
    }

    const brand = await prisma.brand.create({
      data: {
        brand_name: brandName,
        create_by: req.user?.Name || 'admin',
        create_at: new Date(),
        update_by: req.user?.Name || 'admin',
        update_at: new Date()
      }
    });

    res.json({ success: true, message: 'success', data: brand });
  } catch (error) {
    console.error('CreateBrand error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Sửa thương hiệu
export const EditBrand = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    const { brandName } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    if (!brandName) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên thương hiệu' });
    }

    // Kiểm tra tồn tại tên khác
    const existBrand = await prisma.brand.findFirst({
      where: {
        brand_name: brandName,
        brand_id: { not: id }
      }
    });

    if (existBrand) {
      return res.json({ success: false, message: 'exist', data: 'Tên thương hiệu đã tồn tại' });
    }

    await prisma.brand.update({
      where: { brand_id: id },
      data: {
        brand_name: brandName,
        update_at: new Date(),
        update_by: req.user?.Name || 'admin'
      }
    });

    res.json({ success: true, message: 'success' });
  } catch (error) {
    console.error('EditBrand error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Xóa thương hiệu
export const DeleteBrand = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    await prisma.brand.delete({
      where: { brand_id: id }
    });

    res.json({ success: true, message: 'delete' });
  } catch (error) {
    console.error('DeleteBrand error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};