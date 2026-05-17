import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/authMiddleware';
import {
  appendContactMessage,
  createContactMessage,
  formatContactThread,
  getContactStatusFromThread
} from '../../utils/contactThread';

export const GetMyContacts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const contacts = await prisma.contact.findMany({
      where: {
        create_by: req.user.account_id.toString(),
        status: { not: 'N' }
      },
      orderBy: { create_at: 'desc' }
    });

    res.json({ success: true, data: contacts.map(formatContactThread) });
  } catch (error) {
    console.error('GetMyContacts error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const CreateContact = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const account = await prisma.account.findUnique({
      where: { account_id: req.user.account_id },
      select: { Name: true, email: true, Phone: true }
    });

    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Vui long nhap tieu de va noi dung' });
    }

    const contact = await prisma.contact.create({
      data: {
        name: account?.Name || req.user.Name || '',
        phone: account?.Phone || '',
        email: account?.email || req.user.email || '',
        content: JSON.stringify({
          subject,
          messages: [
            createContactMessage(
              'client',
              account?.Name || req.user.Name || 'Khach hang',
              message,
              req.user.account_id.toString()
            )
          ]
        }),
        create_by: req.user.account_id.toString(),
        create_at: new Date(),
        status: '1'
      }
    });

    res.json({
      success: true,
      message: 'Phan hoi da gui',
      data: formatContactThread(contact)
    });
  } catch (error) {
    console.error('CreateContact error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const ReplyMyContact = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const contactId = Number(req.params.id);
    const reply = String(req.body.message || req.body.reply || '').trim();

    if (!contactId || !reply) {
      return res.status(400).json({ success: false, message: 'Vui long nhap noi dung phan hoi' });
    }

    const account = await prisma.account.findUnique({
      where: { account_id: req.user.account_id },
      select: { Name: true }
    });

    const contact = await prisma.contact.findFirst({
      where: {
        contact_id: contactId,
        create_by: req.user.account_id.toString(),
        status: { not: 'N' }
      }
    });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Khong tim thay lien he' });
    }

    const thread = appendContactMessage(
      contact.content,
      createContactMessage(
        'client',
        account?.Name || req.user.Name || 'Khach hang',
        reply,
        req.user.account_id.toString()
      )
    );

    const updated = await prisma.contact.update({
      where: { contact_id: contactId },
      data: {
        content: JSON.stringify(thread),
        status: getContactStatusFromThread(thread),
        update_by: req.user.account_id.toString(),
        update_at: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Da gui phan hoi',
      data: formatContactThread(updated)
    });
  } catch (error) {
    console.error('ReplyMyContact error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};
