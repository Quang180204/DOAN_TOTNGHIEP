// backend/src/Controllers/admin/ProductsController.ts
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

// Helper chuyển đổi BigInt
const serializeBigInt = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (typeof data === 'bigint') return Number(data);
  if (Array.isArray(data)) return data.map(serializeBigInt);
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = serializeBigInt(data[key]);
    }
    return result;
  }
  return data;
};

// Helper lấy thông tin liên quan của sản phẩm
const getProductRelations = async (product: any) => {
  const [genre, brand, discount, images] = await Promise.all([
    prisma.genre.findUnique({ where: { genre_id: product.genre_id } }),
    prisma.brand.findUnique({ where: { brand_id: product.brand_id } }),
    prisma.discount.findUnique({ where: { disscount_id: product.disscount_id } }),
    prisma.productImages.findMany({ where: { product_id: product.product_id } })
  ]);
  return { ...product, genre, brand, discount, images };
};

// Danh sách sản phẩm (đang hoạt động)
export const GetProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.size as string) || 15;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    let whereClause: Prisma.ProductWhereInput = {
      status: '1'
    };
    
    if (search) {
      whereClause.OR = [
        { product_name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { product_id: { equals: parseInt(search) || -1 } }
      ];
    }

    const [products, total, trashCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.product.count({ where: whereClause }),
      prisma.product.count({ where: { status: '0' } })
    ]);

    // Lấy thông tin liên quan cho từng sản phẩm
    const productsWithRelations = await Promise.all(products.map(p => getProductRelations(p)));
    
    // Chuyển đổi BigInt
    const serializedData = serializeBigInt(productsWithRelations);

    res.json({
      success: true,
      data: serializedData,
      total,
      trashCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetProducts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Danh sách sản phẩm trong thùng rác
export const GetTrashProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.size as string) || 15;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    let whereClause: Prisma.ProductWhereInput = {
      status: '0'
    };
    
    if (search) {
      whereClause.OR = [
        { product_name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { product_id: { equals: parseInt(search) || -1 } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.product.count({ where: whereClause })
    ]);

    // Lấy thông tin liên quan cho từng sản phẩm
    const productsWithRelations = await Promise.all(products.map(p => getProductRelations(p)));
    
    // Chuyển đổi BigInt
    const serializedData = serializeBigInt(productsWithRelations);

    res.json({
      success: true,
      data: serializedData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetTrashProducts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Chi tiết sản phẩm
export const GetProductDetail = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const product = await prisma.product.findUnique({
      where: { product_id: id }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: `Không tồn tại! (ID = ${id})` });
    }

    const productWithRelations = await getProductRelations(product);
    
    // Chuyển đổi BigInt
    const serializedData = serializeBigInt(productWithRelations);

    res.json({ success: true, data: serializedData });
  } catch (error) {
    console.error('GetProductDetail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Tạo sản phẩm mới
export const CreateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      product_name,
      price,
      quantity,
      genre_id,
      brand_id,
      disscount_id,
      Type,
      specifications,
      description,
      image
    } = req.body;

    if (!product_name || !price || !genre_id || !brand_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const product = await prisma.product.create({
      data: {
        product_name,
        price: parseFloat(price),
        quantity: quantity?.toString() || '0',
        genre_id: parseInt(genre_id),
        brand_id: parseInt(brand_id),
        disscount_id: parseInt(disscount_id) || 1,
        Type: parseInt(Type) || 1,
        specifications: specifications || '',
        description: description || '',
        image: image || '/images/default.png',
        status: '1',
        view: 0,
        buyturn: 0,
        create_by: req.user?.account_id.toString() || 'admin',
        create_at: new Date(),
        update_at: new Date()
      }
    });
    
    // Chuyển đổi BigInt
    const serializedData = serializeBigInt(product);

    res.json({ success: true, message: 'Thêm sản phẩm thành công', data: serializedData });
  } catch (error) {
    console.error('CreateProduct error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Sửa sản phẩm
export const EditProduct = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    const {
      product_name,
      price,
      quantity,
      genre_id,
      brand_id,
      disscount_id,
      Type,
      specifications,
      description,
      image
    } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const updatedProduct = await prisma.product.update({
      where: { product_id: id },
      data: {
        product_name,
        price: price ? parseFloat(price) : undefined,
        quantity: quantity?.toString(),
        genre_id: genre_id ? parseInt(genre_id) : undefined,
        brand_id: brand_id ? parseInt(brand_id) : undefined,
        disscount_id: disscount_id ? parseInt(disscount_id) : undefined,
        Type: Type ? parseInt(Type) : undefined,
        specifications,
        description,
        image,
        update_at: new Date(),
        update_by: req.user?.account_id.toString()
      }
    });
    
    // Chuyển đổi BigInt
    const serializedData = serializeBigInt(updatedProduct);

    res.json({ success: true, message: 'Cập nhật sản phẩm thành công', data: serializedData });
  } catch (error) {
    console.error('EditProduct error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Vô hiệu hóa sản phẩm (chuyển vào thùng rác)
export const DisableProduct = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    await prisma.product.update({
      where: { product_id: id },
      data: { status: '0' }
    });

    res.json({ success: true, message: 'disabled' });
  } catch (error) {
    console.error('DisableProduct error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Khôi phục sản phẩm
export const UndoProduct = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    await prisma.product.update({
      where: { product_id: id },
      data: { status: '1' }
    });

    res.json({ success: true, message: 'activate' });
  } catch (error) {
    console.error('UndoProduct error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Xóa vĩnh viễn sản phẩm
export const DeleteProduct = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    await prisma.productImages.deleteMany({
      where: { product_id: id }
    });

    await prisma.product.delete({
      where: { product_id: id }
    });

    res.json({ success: true, message: 'delete' });
  } catch (error) {
    console.error('DeleteProduct error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};