import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/authMiddleware';

const getParamId = (param: string | string[] | undefined): number | null => {
  if (!param) return null;
  const idStr = typeof param === 'string' ? param : param[0];
  const id = parseInt(idStr, 10);
  return Number.isNaN(id) ? null : id;
};

const normalizeBoolean = (value: unknown) => value === true || value === 'true' || value === 1 || value === '1';

const normalizeAddressInput = (body: any) => ({
  province_id: Number(body.province_id),
  district_id: Number(body.district_id),
  ward_id: Number(body.ward_id),
  accountPhoneNumber: String(body.accountPhoneNumber || '').trim().slice(0, 10),
  accountUsername: String(body.accountUsername || '').trim().slice(0, 20),
  content: String(body.content || '').trim().slice(0, 50),
  isDefault: normalizeBoolean(body.isDefault)
});

export const GetAddresses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const userId = req.user.account_id;

    const addresses = await prisma.accountAddress.findMany({
      where: { account_id: userId },
      orderBy: [{ isDefault: 'desc' }, { account_address_id: 'desc' }]
    });

    const addressesWithLocation = await Promise.all(
      addresses.map(async (addr) => {
        const [province, district, ward] = await Promise.all([
          addr.province_id ? prisma.provinces.findUnique({ where: { province_id: addr.province_id } }) : null,
          addr.district_id ? prisma.districts.findUnique({ where: { district_id: addr.district_id } }) : null,
          addr.ward_id ? prisma.wards.findUnique({ where: { ward_id: addr.ward_id } }) : null
        ]);

        return {
          ...addr,
          province_name: province?.province_name || '',
          district_name: district?.district_name || '',
          ward_name: ward?.ward_name || ''
        };
      })
    );

    res.json({
      success: true,
      data: addressesWithLocation,
      count: addressesWithLocation.length
    });
  } catch (error) {
    console.error('GetAddresses error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu, vui long thu lai sau' });
  }
};

export const GetAddressDetail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID khong hop le' });
    }

    const address = await prisma.accountAddress.findFirst({
      where: {
        account_address_id: id,
        account_id: req.user.account_id
      }
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Khong tim thay dia chi' });
    }

    res.json({ success: true, data: address });
  } catch (error) {
    console.error('GetAddressDetail error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const CreateAddress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const userId = req.user.account_id;
    const payload = normalizeAddressInput(req.body);

    const addressCount = await prisma.accountAddress.count({
      where: { account_id: userId }
    });

    if (addressCount >= 4) {
      return res.status(400).json({
        success: false,
        message: 'Ban chi co the them toi da 4 dia chi'
      });
    }

    const shouldBeDefault = payload.isDefault || addressCount === 0;

    const newAddress = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.accountAddress.updateMany({
          where: { account_id: userId },
          data: { isDefault: false }
        });
      }

      return tx.accountAddress.create({
        data: {
          account_id: userId,
          province_id: payload.province_id,
          district_id: payload.district_id,
          ward_id: payload.ward_id,
          accountPhoneNumber: payload.accountPhoneNumber,
          accountUsername: payload.accountUsername,
          content: payload.content,
          isDefault: shouldBeDefault
        }
      });
    });

    res.json({
      success: true,
      message: 'Them dia chi thanh cong',
      data: newAddress
    });
  } catch (error) {
    console.error('CreateAddress error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const UpdateAddress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID khong hop le' });
    }

    const payload = normalizeAddressInput(req.body);

    const existingAddress = await prisma.accountAddress.findFirst({
      where: {
        account_address_id: id,
        account_id: req.user.account_id
      }
    });

    if (!existingAddress) {
      return res.status(404).json({ success: false, message: 'Khong tim thay dia chi' });
    }

    const updatedAddress = await prisma.$transaction(async (tx) => {
      const shouldBeDefault = payload.isDefault || existingAddress.isDefault;

      if (payload.isDefault) {
        await tx.accountAddress.updateMany({
          where: {
            account_id: req.user!.account_id,
            account_address_id: { not: id }
          },
          data: { isDefault: false }
        });
      }

      return tx.accountAddress.update({
        where: { account_address_id: id },
        data: {
          province_id: payload.province_id,
          district_id: payload.district_id,
          ward_id: payload.ward_id,
          accountPhoneNumber: payload.accountPhoneNumber,
          accountUsername: payload.accountUsername,
          content: payload.content,
          isDefault: shouldBeDefault
        }
      });
    });

    res.json({
      success: true,
      message: 'Cap nhat dia chi thanh cong',
      data: updatedAddress
    });
  } catch (error) {
    console.error('UpdateAddress error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const SetDefaultAddress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID khong hop le' });
    }

    const userId = req.user.account_id;

    const address = await prisma.accountAddress.findFirst({
      where: {
        account_address_id: id,
        account_id: userId
      }
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Khong tim thay dia chi' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.accountAddress.updateMany({
        where: { account_id: userId },
        data: { isDefault: false }
      });

      await tx.accountAddress.update({
        where: { account_address_id: id },
        data: { isDefault: true }
      });
    });

    res.json({
      success: true,
      message: 'Da dat lam dia chi mac dinh'
    });
  } catch (error) {
    console.error('SetDefaultAddress error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};

export const DeleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui long dang nhap' });
    }

    const id = getParamId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID khong hop le' });
    }

    const address = await prisma.accountAddress.findFirst({
      where: {
        account_address_id: id,
        account_id: req.user.account_id
      }
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Khong tim thay dia chi' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.accountAddress.delete({
        where: { account_address_id: id }
      });

      if (address.isDefault) {
        const nextAddress = await tx.accountAddress.findFirst({
          where: { account_id: req.user!.account_id },
          orderBy: { account_address_id: 'desc' }
        });

        if (nextAddress) {
          await tx.accountAddress.update({
            where: { account_address_id: nextAddress.account_address_id },
            data: { isDefault: true }
          });
        }
      }
    });

    res.json({
      success: true,
      message: 'Xoa dia chi thanh cong'
    });
  } catch (error) {
    console.error('DeleteAddress error:', error);
    res.status(500).json({ success: false, message: 'Loi may chu' });
  }
};
