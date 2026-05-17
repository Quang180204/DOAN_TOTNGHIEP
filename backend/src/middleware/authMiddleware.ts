import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

export interface AuthRequest extends Request {
  user?: {
    account_id: number;
    email: string;
    Role: number;
    Name: string;
  };
}

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      account_id: number;
      email: string;
      Role: number;
      Name: string;
    };

    const user = await prisma.account.findUnique({
      where: { account_id: decoded.account_id },
      select: {
        account_id: true,
        email: true,
        Role: true,
        Name: true,
        status: true
      }
    });

    if (!user || user.status !== '1') {
      return res.status(401).json({ message: 'Unauthorized - User invalid or inactive' });
    }

    // Ép kiểu dữ liệu, xử lý null thành string rỗng
    req.user = {
      account_id: user.account_id,
      email: user.email || '',
      Role: user.Role,
      Name: user.Name || ''
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Unauthorized - Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.Role !== 0) {
    return res.status(403).json({ 
      success: false, 
      message: 'Bạn không có quyền truy cập khu vực này' 
    });
  }
  next();
};