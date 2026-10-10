/**
 * upload.router.ts
 * POST /api/upload/product-image
 *
 * If Cloudinary is configured: uploads to Cloudinary and returns the secure URL.
 * If Cloudinary is NOT configured: returns a placeholder message explaining
 * what to configure — it does NOT store files on the server.
 *
 * Auth: farmer or admin only.
 */
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate, requireRole } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { isCloudinaryConfigured, env } from '../../config/env';
import { Readable } from 'node:stream';

const router = Router();

// Keep files in memory so we can stream to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are accepted.'));
    }
  },
});

router.post(
  '/product-image',
  authenticate,
  requireRole('farmer', 'admin'),
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError('No image file provided.', 400);

      if (!isCloudinaryConfigured()) {
        // Return a helpful message instead of failing silently
        return res.status(200).json({
          success: true,
          data: {
            url: '',
            configured: false,
            message:
              'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, ' +
              'CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env to enable image uploads. ' +
              'Products can still be created — images will be added later.',
          },
        });
      }

      // Configure Cloudinary
      cloudinary.config({
        cloud_name: env.cloudinaryCloudName,
        api_key: env.cloudinaryApiKey,
        api_secret: env.cloudinaryApiSecret,
      });

      // Stream the buffer to Cloudinary
      const url = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'farmconnect/products', resource_type: 'image' },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error('Cloudinary upload failed.'));
            resolve(result.secure_url);
          },
        );
        const readable = new Readable();
        readable.push(req.file!.buffer);
        readable.push(null);
        readable.pipe(stream);
      });

      return res.json({ success: true, data: { url, configured: true } });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
