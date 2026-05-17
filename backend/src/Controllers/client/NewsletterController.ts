import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { sendNewsletterSubscriptionEmail } from '../../config/emailConfig';

export const SubscribeNewsletter = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
    }

    const existing = await prisma.contact.findFirst({
      where: { email, status: 'N' }
    });

    if (existing) {
      return res.json({ success: true, message: 'Email này đã đăng ký nhận tin' });
    }

    await prisma.contact.create({
      data: {
        name: email,
        phone: '',
        email,
        content: JSON.stringify({ subject: 'newsletter', message: 'subscribe' }),
        create_at: new Date(),
        create_by: 'newsletter',
        status: 'N'
      }
    });

    await sendNewsletterSubscriptionEmail(email);

    res.json({ success: true, message: 'Đăng ký nhận tin thành công' });
  } catch (error) {
    console.error('SubscribeNewsletter error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};
