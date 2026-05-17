import { Request, Response } from 'express';
import prisma from '../../config/prisma';

const getParamId = (param: string | string[] | undefined): number | null => {
  if (!param) return null;
  const idStr = typeof param === 'string' ? param : param[0];
  const id = parseInt(idStr);
  return isNaN(id) ? null : id;
};

// Lấy danh sách tỉnh/thành phố
export const GetProvinces = async (req: Request, res: Response) => {
  try {
    const provinces = await prisma.provinces.findMany({
      orderBy: { province_name: 'asc' }
    });
    res.json({ success: true, data: provinces });
  } catch (error) {
    console.error('GetProvinces error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Lấy danh sách quận/huyện theo tỉnh
export const GetDistricts = async (req: Request, res: Response) => {
  try {
    const provinceId = getParamId(req.params.provinceId);
    if (!provinceId) {
      return res.status(400).json({ success: false, message: 'ID tỉnh không hợp lệ' });
    }

    const districts = await prisma.districts.findMany({
      where: { province_id: provinceId },
      orderBy: [{ type: 'asc' }, { district_name: 'asc' }]
    });
    res.json({ success: true, data: districts });
  } catch (error) {
    console.error('GetDistricts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// Lấy danh sách phường/xã theo quận/huyện
export const GetWards = async (req: Request, res: Response) => {
  try {
    const districtId = getParamId(req.params.districtId);
    if (!districtId) {
      return res.status(400).json({ success: false, message: 'ID quận/huyện không hợp lệ' });
    }

    const wards = await prisma.wards.findMany({
      where: { district_id: districtId },
      orderBy: [{ type: 'asc' }, { ward_name: 'asc' }]
    });
    res.json({ success: true, data: wards });
  } catch (error) {
    console.error('GetWards error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};