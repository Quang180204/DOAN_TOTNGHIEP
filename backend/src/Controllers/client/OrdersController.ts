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

export const GetMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const userId = req.user.account_id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.size as string, 10) || 10;
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          account_id: userId,
          status: { notIn: ['0', '4'] }
        },
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.order.count({
        where: {
          account_id: userId,
          status: { notIn: ['0', '4'] }
        }
      })
    ]);

    const formattedOrders = await Promise.all(orders.map((order) => getOrderWithRelations(order)));

    res.json({
      success: true,
      data: formatValue(formattedOrders),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetMyOrders error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu, vui long thu lai sau' });
  }
};

export const GetMyOrderDetail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const orderId = getParamId(req.params.id);
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'ID khong hop le' });
    }

    const order = await prisma.order.findFirst({
      where: {
        order_id: orderId,
        account_id: req.user.account_id,
        status: { notIn: ['0', '4'] }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });
    }

    const fullOrder = await getOrderWithRelations(order);

    res.json({
      success: true,
      data: formatValue(fullOrder)
    });
  } catch (error) {
    console.error('GetMyOrderDetail error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const TrackOrder = async (req: Request, res: Response) => {
  try {
    const orderId = getParamId(req.params.id);
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Ma don hang khong hop le' });
    }

    const order = await prisma.order.findUnique({
      where: { order_id: orderId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });
    }

    const statusMap: { [key: string]: string } = {
      '0': 'Da huy',
      '1': 'Dang xu ly',
      '2': 'Dang giao hang',
      '3': 'Hoan thanh'
    };

    res.json({
      success: true,
      data: {
        order_id: order.order_id,
        status: order.status,
        status_text: statusMap[order.status || '1'],
        total: order.total.toString(),
        order_date: order.oder_date,
        note: order.order_note
      }
    });
  } catch (error) {
    console.error('TrackOrder error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};
