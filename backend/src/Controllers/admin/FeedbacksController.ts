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

// Helper lấy thông tin feedback kèm account và replies
const getFeedbackWithDetails = async (feedback: any) => {
  const account = await prisma.account.findUnique({
    where: { account_id: feedback.account_id },
    select: { Name: true, email: true, Avatar: true }
  });

  const replies = await prisma.replyFeedback.findMany({
    where: { feedback_id: feedback.feedback_id, stastus: '2' }
  });

  const repliesWithAccount = await Promise.all(replies.map(async (reply) => {
    const replyAccount = await prisma.account.findUnique({
      where: { account_id: reply.account_id },
      select: { Name: true, Avatar: true }
    });
    return { ...reply, account: replyAccount };
  }));

  // Lấy thông tin sản phẩm
  const product = await prisma.product.findUnique({
    where: { product_id: feedback.product_id },
    select: { product_name: true, price: true, image: true }
  });

  return {
    ...feedback,
    account,
    account_name: account?.Name || 'Khách hàng',
    account_email: account?.email || '',
    replies: repliesWithAccount,
    product,
    product_name: product?.product_name || '',
    product_image: product?.image || ''
  };
};

// Danh sách đánh giá
export const GetFeedbacks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.size as string) || 15;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    let whereClause: Prisma.FeedbackWhereInput = {};
    
    if (search) {
      whereClause.account_id = { equals: parseInt(search) || -1 };
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where: whereClause,
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.feedback.count({ where: whereClause })
    ]);

    // Lấy thông tin chi tiết cho từng feedback
    const feedbacksWithDetails = await Promise.all(feedbacks.map(fb => getFeedbackWithDetails(fb)));

    res.json({
      success: true,
      data: feedbacksWithDetails,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetFeedbacks error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Phản hồi bình luận
export const ReplyComment = async (req: AuthRequest, res: Response) => {
  try {
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

    // Lấy ID tiếp theo thủ công do sequence PostgreSQL bị lệch
    const maxResult = await prisma.$queryRaw<[{ max: number }]>`SELECT COALESCE(MAX(rep_feedback_id), 0) AS max FROM replyfeedback`;
    const nextId = Number(maxResult[0].max) + 1;

    const reply = await prisma.replyFeedback.create({
      data: {
        rep_feedback_id: nextId,
        feedback_id: feedbackId,
        account_id: req.user?.account_id || 0,
        content: replyContent,
        stastus: '2',
        create_at: new Date()
      }
    });

    // Lấy thông tin account để trả về
    const account = await prisma.account.findUnique({
      where: { account_id: req.user?.account_id || 0 },
      select: { Name: true, Avatar: true }
    });

    res.json({ success: true, message: 'Phản hồi thành công', data: { ...reply, account } });
  } catch (error) {
    console.error('ReplyComment error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};
