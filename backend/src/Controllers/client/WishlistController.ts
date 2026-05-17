import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/authMiddleware';

type WishlistRow = {
  wishlist_id: number;
  account_id: number;
  product_id: number;
  create_at: Date;
};

const buildWishlistItems = async (accountId: number) => {
  const rows = await prisma.wishlist.findMany({
    where: { account_id: accountId },
    orderBy: { create_at: 'desc' }
  }) as WishlistRow[];

  const productIds = rows.map((item) => item.product_id);
  const products = productIds.length
    ? await prisma.product.findMany({
        where: {
          product_id: { in: productIds },
          status: '1'
        }
      })
    : [];

  return rows
    .map((item) => {
      const product = products.find((entry) => entry.product_id === item.product_id);
      if (!product) return null;
      return {
        wishlist_id: item.wishlist_id,
        product_id: product.product_id,
        product_name: product.product_name,
        image: product.image,
        price: product.price,
        quantity: product.quantity,
        create_at: item.create_at
      };
    })
    .filter(Boolean);
};

export const GetWishlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const items = await buildWishlistItems(req.user.account_id);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('GetWishlist error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const GetWishlistCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.json({ success: true, count: 0 });
    }

    const count = await prisma.wishlist.count({
      where: { account_id: req.user.account_id }
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error('GetWishlistCount error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const ToggleWishlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const productId = Number(req.body.productId);
    if (!productId) {
      return res.status(400).json({ success: false, message: 'San pham khong hop le' });
    }

    const existing = await prisma.wishlist.findFirst({
      where: {
        account_id: req.user.account_id,
        product_id: productId
      }
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { wishlist_id: existing.wishlist_id }
      });

      return res.json({
        success: true,
        action: 'removed',
        message: 'Da bo san pham khoi yeu thich'
      });
    }

    await prisma.wishlist.create({
      data: {
        account_id: req.user.account_id,
        product_id: productId
      }
    });

    res.json({
      success: true,
      action: 'added',
      message: 'Da them san pham vao yeu thich'
    });
  } catch (error) {
    console.error('ToggleWishlist error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const DeleteWishlistItem = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const productId = Number(req.params.productId);
    if (!productId) {
      return res.status(400).json({ success: false, message: 'San pham khong hop le' });
    }

    await prisma.wishlist.deleteMany({
      where: {
        account_id: req.user.account_id,
        product_id: productId
      }
    });

    res.json({
      success: true,
      message: 'Da xoa khoi danh sach yeu thich'
    });
  } catch (error) {
    console.error('DeleteWishlistItem error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};
