import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/authMiddleware';

// Generate JWT token
const generateToken = (user: {
  account_id: number;
  email: string;
  Role: number;
  Name: string;
}): string => {
  const secret = process.env.JWT_SECRET || 'secret';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign(
    { account_id: user.account_id, email: user.email, Role: user.Role, Name: user.Name },
    secret,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
};

const verifyPassword = async (plainPassword: string, storedPassword: string): Promise<boolean> => {
  try {
    if (await bcrypt.compare(plainPassword, storedPassword)) return true;
  } catch {
    // Legacy/plain-text passwords are checked below.
  }
  return plainPassword === storedPassword;
};

// Đăng ký tài khoản
export const Register = async (req: Request, res: Response) => {
  try {
    const { Name, Email, Password, Phone } = req.body;

    if (!Name || !Email || !Password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu' });
    }

    if (Password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const checkEmail = await prisma.account.findUnique({ where: { email: Email } });
    if (checkEmail) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    const user = await prisma.account.create({
      data: {
        Name: Name || '',
        email: Email || '',
        Phone: Phone ? String(Phone).substring(0, 10) : '',
        password: hashedPassword,
        status: '1',
        Role: 1,
        Avatar: '/images/default.png',
        create_at: new Date(),
        update_at: new Date()
      },
      select: {
        account_id: true, Name: true, email: true,
        Phone: true, Role: true, Avatar: true,
        status: true, create_at: true
      }
    });

    const token = generateToken({
      account_id: user.account_id,
      email: user.email || '',
      Role: user.Role,
      Name: user.Name || ''
    });

    res.json({ success: true, message: 'Đăng ký thành công', token, user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Đăng nhập
export const Login = async (req: Request, res: Response) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await prisma.account.findUnique({ where: { email: Email } });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Email không tồn tại trong hệ thống' });
    }

    if (user.status !== '1') {
      return res.status(400).json({ success: false, message: 'Tài khoản đã bị khóa, vui lòng liên hệ hỗ trợ' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Thông tin đăng nhập không hợp lệ' });
    }

    const checkPassword = await verifyPassword(Password, user.password);
    if (!checkPassword) {
      return res.status(400).json({ success: false, message: 'Mật khẩu không chính xác' });
    }

    const userData = {
      account_id: user.account_id,
      Name: user.Name || '',
      email: user.email || '',
      Phone: user.Phone || '',
      Role: user.Role,
      Avatar: user.Avatar || '/images/default.png',
      status: user.status,
      create_at: user.create_at
    };

    const token = generateToken({
      account_id: user.account_id,
      email: user.email || '',
      Role: user.Role,
      Name: user.Name || ''
    });

    res.json({ success: true, message: 'Đăng nhập thành công', token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Quên mật khẩu
export const ForgotPassword = async (req: Request, res: Response) => {
  try {
    const { Email } = req.body;

    if (!Email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
    }

    const user = await prisma.account.findUnique({ where: { email: Email } });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Email không tồn tại trong hệ thống' });
    }

    const secret = process.env.JWT_SECRET || 'secret';
    const resetToken = jwt.sign(
      { account_id: user.account_id, email: user.email },
      secret,
      { expiresIn: '1h' }
    );

    await prisma.account.update({
      where: { account_id: user.account_id },
      data: { Requestcode: resetToken }
    });

    res.json({
      success: true,
      message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Đặt lại mật khẩu
export const ResetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã xác nhận và mật khẩu mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const secret = process.env.JWT_SECRET || 'secret';
    let decoded: any;

    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn' });
    }

    const user = await prisma.account.findFirst({
      where: { account_id: decoded.account_id, Requestcode: token }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.account.update({
      where: { account_id: user.account_id },
      data: { password: hashedPassword, Requestcode: null }
    });

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Lấy thông tin cá nhân
export const GetProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.account.findUnique({
      where: { account_id: req.user?.account_id },
      select: {
        account_id: true, Name: true, email: true,
        Phone: true, Avatar: true, Role: true,
        create_at: true, update_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Cập nhật thông tin cá nhân
export const UpdateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { Name, Phone, Avatar } = req.body;

    // Chỉ lưu avatar nếu là URL path (không phải base64)
    let avatarValue: string | undefined = undefined;
    if (Avatar && typeof Avatar === 'string' && !Avatar.startsWith('data:')) {
      avatarValue = Avatar.substring(0, 255);
    }

    const updatedUser = await prisma.account.update({
      where: { account_id: req.user?.account_id },
      data: {
        Name: Name ? String(Name).substring(0, 50) : undefined,
        Phone: Phone ? String(Phone).substring(0, 10) : undefined,
        Avatar: avatarValue,
        update_at: new Date()
      },
      select: {
        account_id: true, Name: true, email: true,
        Phone: true, Avatar: true, Role: true
      }
    });

    const token = generateToken({
      account_id: updatedUser.account_id,
      email: updatedUser.email || '',
      Role: updatedUser.Role,
      Name: updatedUser.Name || ''
    });

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      token,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Đổi mật khẩu
export const ChangePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await prisma.account.findUnique({
      where: { account_id: req.user?.account_id }
    });

    if (!user || !user.password) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
    }

    const isValidPassword = await verifyPassword(oldPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.account.update({
      where: { account_id: req.user?.account_id },
      data: { password: hashedPassword, update_at: new Date() }
    });

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Cập nhật ảnh đại diện
export const UpdateAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
    }

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh' });
    }

    const avatarUrl = '/' + file.path.replace(/\\/g, '/');

    const updatedUser = await prisma.account.update({
      where: { account_id: req.user.account_id },
      data: { Avatar: avatarUrl, update_at: new Date() },
      select: {
        account_id: true, Name: true, email: true,
        Phone: true, Avatar: true, Role: true
      }
    });

    res.json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      user: updatedUser
    });
  } catch (error) {
    console.error('UpdateAvatar error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};
