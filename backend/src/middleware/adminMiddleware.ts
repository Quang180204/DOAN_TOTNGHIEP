import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Vui lòng đăng nhập' 
      });
    }

    if (req.user.Role !== 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền truy cập khu vực này' 
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi máy chủ' 
    });
  }
};