import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || "").toLowerCase();
    const random = crypto.randomBytes(6).toString("hex");
    cb(null, `${Date.now()}-${random}${ext || ".bin"}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!/^image\/(jpe?g|png|webp|gif|avif)$/i.test(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, WEBP, AVIF or GIF images are allowed"));
  }
  cb(null, true);
};

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
