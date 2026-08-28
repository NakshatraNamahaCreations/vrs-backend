import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

/**
 * Storage strategy is picked from env at startup:
 *   - CLOUDINARY_URL set  → upload straight to Cloudinary (works on serverless).
 *   - otherwise           → write to a local `uploads/` folder (nice for dev).
 *
 * Both paths hand back a URL you can persist on the Product model. Disk mode
 * returns `/uploads/<file>`; Cloudinary mode returns the full https URL — the
 * frontend `resolveImg` helper already handles both.
 */
const cloudinaryUrl =
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME &&
   process.env.CLOUDINARY_API_KEY &&
   process.env.CLOUDINARY_API_SECRET &&
   `cloudinary://${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}@${process.env.CLOUDINARY_CLOUD_NAME}`);

export const usingCloudinary = Boolean(cloudinaryUrl);

let storage;
if (usingCloudinary) {
  // Cloudinary SDK auto-reads CLOUDINARY_URL. Setting it here in case the
  // consumer only provided the individual vars.
  cloudinary.config({ secure: true });
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: process.env.CLOUDINARY_FOLDER || "vrs",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "avif", "gif"],
    },
  });
  console.log("✔ Image uploads → Cloudinary");
} else {
  const uploadDir = process.env.VERCEL ? "/tmp/uploads" : "uploads";
  try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    // Read-only filesystem (e.g. serverless without Cloudinary configured) —
    // don't take the whole app down. Uploads will fail at request time.
    console.warn(`Could not prepare upload dir "${uploadDir}":`, err.message);
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || "").toLowerCase();
      const random = crypto.randomBytes(6).toString("hex");
      cb(null, `${Date.now()}-${random}${ext || ".bin"}`);
    },
  });
}

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
