import fs from 'fs';
import path from 'path';

const defaultUploadDir = path.resolve(process.cwd(), 'uploads');

export const uploadRootDir = path.resolve(process.env.UPLOAD_DIR || defaultUploadDir);
export const avatarUploadDir = path.join(uploadRootDir, 'avatars');
export const productUploadDir = path.join(uploadRootDir, 'products');

export const ensureUploadDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const toPublicUploadPath = (filePath: string) => {
  const normalizedFilePath = path.resolve(filePath);
  const relativePath = path.relative(uploadRootDir, normalizedFilePath).replace(/\\/g, '/');
  return `/uploads/${relativePath}`;
};
