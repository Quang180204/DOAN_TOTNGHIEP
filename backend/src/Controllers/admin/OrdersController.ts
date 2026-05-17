import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/authMiddleware';
import { formatValue, getOrderWithRelations } from '../../utils/orderPayload';

const getParamId = (param: string | string[] | undefined): number | null => {
  if (!param) return null;
  const idStr = typeof param === 'string' ? param : param[0];
  const id = parseInt(idStr, 10);
  return Number.isNaN(id) ? null : id;
};

export const GetOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.size as string, 10) || 15;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    const whereClause: Prisma.OrderWhereInput = {
      status: { notIn: ['0', '4'] }
    };

    if (search) {
      const searchNum = parseInt(search, 10);
      if (!Number.isNaN(searchNum)) {
        whereClause.order_id = searchNum;
      }
    }

    const [orders, total, trashCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        orderBy: { oder_date: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.order.count({ where: whereClause }),
      prisma.order.count({ where: { status: { in: ['0', '4'] } } })
    ]);

    const ordersWithDetails = await Promise.all(orders.map((order) => getOrderWithRelations(order)));

    res.json({
      success: true,
      data: formatValue(ordersWithDetails),
      total,
      trashCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetOrders error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const GetTrashOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.size as string, 10) || 15;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    const whereClause: Prisma.OrderWhereInput = {
      status: { in: ['0', '4'] }
    };

    if (search) {
      const searchNum = parseInt(search, 10);
      if (!Number.isNaN(searchNum)) {
        whereClause.order_id = searchNum;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        orderBy: { oder_date: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.order.count({ where: whereClause })
    ]);

    const ordersWithDetails = await Promise.all(orders.map((order) => getOrderWithRelations(order)));

    res.json({
      success: true,
      data: formatValue(ordersWithDetails),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetTrashOrders error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const GetOrderDetail = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID khong hop le' });
    }

    const order = await prisma.order.findUnique({
      where: { order_id: id }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Khong ton tai' });
    }

    const orderWithDetails = await getOrderWithRelations(order);
    const orderHistory = await prisma.order.findMany({
      where: {
        account_id: order.account_id,
        order_id: { not: id }
      },
      orderBy: { oder_date: 'desc' },
      take: 10
    });
    const orderHistoryWithAccount = await Promise.all(orderHistory.map((item) => getOrderWithRelations(item)));

    res.json({
      success: true,
      data: formatValue(orderWithDetails),
      orderHistory: formatValue(orderHistoryWithAccount)
    });
  } catch (error) {
    console.error('GetOrderDetail error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const UpdateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID khong hop le' });
    }

    const order = await prisma.order.findUnique({ where: { order_id: id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Khong tim thay' });
    }

    if (order.status === '3') {
      return res.json({ success: false, message: 'Don hang da hoan thanh' });
    }

    await prisma.order.update({
      where: { order_id: id },
      data: {
        status,
        update_at: new Date(),
        update_by: req.user?.account_id.toString()
      }
    });

    res.json({ success: true, message: 'success' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const CancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID khong hop le' });
    }

    await prisma.order.update({
      where: { order_id: id },
      data: {
        status: '0',
        update_at: new Date(),
        update_by: req.user?.account_id.toString()
      }
    });

    res.json({ success: true, message: 'success' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const DeleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID khong hop le' });
    }

    await prisma.order.delete({ where: { order_id: id } });
    res.json({ success: true, message: 'delete' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};
