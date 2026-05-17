import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/authMiddleware';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper lấy ID từ params
const getParamId = (param: string | string[] | undefined): number | null => {
  if (!param) return null;
  const idStr = typeof param === 'string' ? param : param[0];
  const id = parseInt(idStr);
  return isNaN(id) ? null : id;
};

// ==================== ADMIN LOGIN ====================
export const AdminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập email và mật khẩu' 
      });
    }

    // Tìm tài khoản theo email
    const account = await prisma.account.findFirst({
      where: { email: email }
    });

    if (!account) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Kiểm tra trạng thái tài khoản (không bị vô hiệu hóa)
    if (account.status === '0') {
      return res.status(403).json({ 
        success: false, 
        message: 'Tài khoản đã bị vô hiệu hóa' 
      });
    }

    // Kiểm tra role admin (0)
    if (account.Role !== 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Tài khoản không có quyền quản trị' 
      });
    }

    let isPasswordValid = false;
    if (account.password) {
      try {
        isPasswordValid = await bcrypt.compare(password, account.password);
      } catch {
        isPasswordValid = false;
      }
      if (!isPasswordValid) {
        isPasswordValid = password === account.password;
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Tạo token JWT
    const token = jwt.sign(
      { 
        account_id: account.account_id, 
        email: account.email, 
        Role: account.Role,
        Name: account.Name || ''
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      account: {
        account_id: account.account_id,
        Name: account.Name,
        email: account.email,
        Phone: account.Phone,
        Avatar: account.Avatar,
        Role: account.Role
      }
    });
  } catch (error) {
    console.error('AdminLogin error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi máy chủ, vui lòng thử lại sau' 
    });
  }
};

// Danh sách tài khoản (không bao gồm thùng rác)
export const GetAccounts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.size as string) || 15;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    const whereClause: any = {
      status: { not: '0' }
    };

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { account_id: { equals: parseInt(search) || -1 } },
        { Name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where: whereClause,
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize,
        select: {
          account_id: true,
          Name: true,
          email: true,
          Phone: true,
          Role: true,
          Avatar: true,
          status: true,
          create_at: true,
          create_by: true,
          update_at: true
        }
      }),
      prisma.account.count({ where: whereClause })
    ]);

    // Đếm số tài khoản trong thùng rác
    const trashCount = await prisma.account.count({
      where: { status: '0' }
    });

    res.json({
      success: true,
      data: accounts,
      total,
      page,
      pageSize,
      trashCount,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetAccounts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Danh sách tài khoản trong thùng rác
export const GetTrashAccounts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.size as string) || 15;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * pageSize;

    const whereClause: any = {
      status: '0'
    };

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { account_id: { equals: parseInt(search) || -1 } },
        { Name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where: whereClause,
        orderBy: { create_at: 'desc' },
        skip,
        take: pageSize,
        select: {
          account_id: true,
          Name: true,
          email: true,
          Phone: true,
          Role: true,
          Avatar: true,
          status: true,
          create_at: true
        }
      }),
      prisma.account.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: accounts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GetTrashAccounts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Chi tiết tài khoản
export const GetAccountDetail = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const account = await prisma.account.findUnique({
      where: { account_id: id }
    });

    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: `Không tồn tại! (ID = ${id})` 
      });
    }

    // Lấy addresses riêng
    const addresses = await prisma.accountAddress.findMany({
      where: { account_id: id }
    });

    res.json({ success: true, data: { ...account, addresses } });
  } catch (error) {
    console.error('GetAccountDetail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Đổi quyền tài khoản
export const ChangeRoles = async (req: AuthRequest, res: Response) => {
  try {
    const { accountId, roleId } = req.body;
    const currentUserRole = req.user?.Role;

    if (currentUserRole !== 0) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện' });
    }

    const account = await prisma.account.findUnique({
      where: { account_id: accountId }
    });

    if (!account) {
      return res.json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    await prisma.account.update({
      where: { account_id: accountId },
      data: { Role: roleId }
    });

    res.json({ success: true, message: 'Đổi quyền thành công' });
  } catch (error) {
    console.error('ChangeRoles error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Vô hiệu hóa tài khoản (chuyển vào thùng rác)
export const DisableAccount = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    // Không cho phép vô hiệu hóa chính mình
    if (req.user?.account_id === id) {
      return res.json({ success: false, message: 'Không thể vô hiệu hóa tài khoản đang đăng nhập' });
    }

    await prisma.account.update({
      where: { account_id: id },
      data: { status: '0' }
    });

    res.json({ success: true, message: 'Đã vô hiệu hóa tài khoản' });
  } catch (error) {
    console.error('DisableAccount error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Kích hoạt lại tài khoản
export const ActivateAccount = async (req: Request, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    await prisma.account.update({
      where: { account_id: id },
      data: { status: '1' }
    });

    res.json({ success: true, message: 'Đã kích hoạt tài khoản' });
  } catch (error) {
    console.error('ActivateAccount error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Xóa vĩnh viễn tài khoản
export const DeleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    // Không cho xóa chính mình
    if (req.user?.account_id === id) {
      return res.json({ success: false, message: 'Không thể xóa tài khoản đang đăng nhập' });
    }

    // Xóa các bản ghi liên quan trước
    await prisma.accountAddress.deleteMany({ where: { account_id: id } });

    await prisma.account.delete({ where: { account_id: id } });

    res.json({ success: true, message: 'Đã xóa vĩnh viễn tài khoản' });
  } catch (error) {
    console.error('DeleteAccount error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};
