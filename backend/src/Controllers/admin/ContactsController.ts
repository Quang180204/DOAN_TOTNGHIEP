import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/authMiddleware';
import {
  appendContactMessage,
  createContactMessage,
  formatContactThread,
  getContactStatusFromThread
} from '../../utils/contactThread';

export const GetContacts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.size as string) || 10;
    const search = String(req.query.search || '').trim();
    const skip = (page - 1) * pageSize;

    const whereClause: any = {
      status: { not: 'N' }
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where: whereClause,
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.contact.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: contacts.map(formatContactThread),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetContacts error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const ReplyContact = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const reply = String(req.body.reply || req.body.message || '').trim();

    if (!id || !reply) {
      return res.status(400).json({ success: false, message: 'Vui long nhap noi dung phan hoi' });
    }

    const contact = await prisma.contact.findUnique({ where: { contact_id: id } });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Khong tim thay lien he' });
    }

    const adminAccount = req.user?.account_id
      ? await prisma.account.findUnique({
          where: { account_id: req.user.account_id },
          select: { Name: true }
        })
      : null;

    const thread = appendContactMessage(
      contact.content,
      createContactMessage(
        'admin',
        adminAccount?.Name || 'Admin',
        reply,
        req.user?.account_id?.toString()
      )
    );

    const updated = await prisma.contact.update({
      where: { contact_id: id },
      data: {
        content: JSON.stringify(thread),
        status: getContactStatusFromThread(thread),
        update_by: req.user?.account_id.toString(),
        update_at: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Phan hoi thanh cong',
      data: formatContactThread(updated)
    });
  } catch (error) {
    console.error('ReplyContact error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const DeleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID khong hop le' });
    }

    const contact = await prisma.contact.findUnique({ where: { contact_id: id } });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Khong tim thay lien he' });
    }

    await prisma.contact.delete({ where: { contact_id: id } });

    res.json({
      success: true,
      message: 'Da xoa phan hoi'
    });
  } catch (error) {
    console.error('DeleteContact error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};
