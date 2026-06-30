import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "../config/cloudinary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Kept only so index.js static mount keeps working for any legacy local files.
export const uploadsDir = path.resolve(__dirname, "../../uploads");

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new Error("Only image or PDF files are allowed"));
  },
});

const router = Router();

router.post("/", upload.single("file"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  if (!isCloudinaryConfigured()) {
    return res.status(500).json({
      message: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    });
  }

  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      // Use the file extension so PDFs/raw files keep a sensible URL.
      filename_override: req.file.originalname,
      use_filename: true,
      unique_filename: true,
    });

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
