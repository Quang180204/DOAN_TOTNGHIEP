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

// Danh sách danh mục
export const GetGenres = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.size as string) || 15;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    let whereClause: Prisma.GenreWhereInput = {};
    
    if (search) {
      whereClause = {
        genre_name: { contains: search, mode: 'insensitive' as Prisma.QueryMode }
      };
    }

    const [genres, total] = await Promise.all([
      prisma.genre.findMany({
        where: whereClause,
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.genre.count({ where: whereClause })
    ]);

    // Lấy số lượng sản phẩm cho từng genre
    const genresWithCount = await Promise.all(genres.map(async (genre) => {
      const productCount = await prisma.product.count({
        where: { genre_id: genre.genre_id }
      });
      return { ...genre, productCount };
    }));

    res.json({
      success: true,
      data: genresWithCount,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetGenres error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Tạo danh mục mới
export const CreateGenre = async (req: AuthRequest, res: Response) => {
  try {
    const { genreName } = req.body;

    if (!genreName) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên danh mục' });
    }

    const existGenre = await prisma.genre.findFirst({
      where: { genre_name: genreName }
    });

    if (existGenre) {
      return res.json({ success: false, message: 'exist', data: 'Danh mục đã tồn tại' });
    }

    const genre = await prisma.genre.create({
      data: {
        genre_name: genreName,
        create_by: req.user?.Name || 'admin',
        create_at: new Date(),
        update_by: req.user?.Name || 'admin',
        update_at: new Date()
      }
    });

    res.json({ success: true, message: 'success', data: genre });
  } catch (error) {
    console.error('CreateGenre error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Sửa danh mục
export const EditGenre = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    const { genreName } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    if (!genreName) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên danh mục' });
    }

    const existGenre = await prisma.genre.findFirst({
      where: {
        genre_name: genreName,
        genre_id: { not: id }
      }
    });

    if (existGenre) {
      return res.json({ success: false, message: 'exist', data: 'Tên danh mục đã tồn tại' });
    }

    await prisma.genre.update({
      where: { genre_id: id },
      data: {
        genre_name: genreName,
        update_at: new Date(),
        update_by: req.user?.Name || 'admin'
      }
    });

    res.json({ success: true, message: 'success' });
  } catch (error) {
    console.error('EditGenre error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Xóa danh mục
export const DeleteGenre = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    await prisma.genre.delete({
      where: { genre_id: id }
    });

    res.json({ success: true, message: 'delete' });
  } catch (error) {
    console.error('DeleteGenre error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};