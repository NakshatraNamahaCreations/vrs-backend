import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

/**
 * Storage strategy is picked from env at startup:
 *   - CLOUDINARY_URL (or the three individual CLOUDINARY_* vars) present →
 *     multer buffers the upload in memory, then we stream it straight to
 *     Cloudinary and stamp req.file.path with the returned secure URL.
 *     Works on read-only serverless filesystems (Vercel/Lambda).
 *   - otherwise → write to a local `uploads/` folder. Nice for dev; falls
 *     back to /tmp/uploads on Vercel just so the module doesn't crash on load.
 *
 * The controller reads req.file.path — full https URL in Cloudinary mode,
 * relative disk path in dev mode — and builds the persisted image URL from
 * that. The frontend resolveImg() handles both shapes.
 */
/**
 * Parse a CLOUDINARY_URL of the form
 *   cloudinary://<api_key>:<api_secret>@<cloud_name>
 * into { cloud_name, api_key, api_secret }. Returns null on miss so we can
 * fall through to the individual env vars.
 */
function parseCloudinaryUrl(url) {
  if (!url) return null;
  const m = String(url).match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!m) return null;
  return { api_key: m[1], api_secret: m[2], cloud_name: m[3] };
}

// Env values pasted through dashboards frequently pick up leading/trailing
// whitespace or a stray newline — Cloudinary computes signatures over the
// exact secret so even one extra space returns "Invalid Signature".
const trim = (v) => (typeof v === "string" ? v.trim() : v);

const cloudinaryConfig =
  parseCloudinaryUrl(trim(process.env.CLOUDINARY_URL)) ||
  (process.env.CLOUDINARY_CLOUD_NAME &&
   process.env.CLOUDINARY_API_KEY &&
   process.env.CLOUDINARY_API_SECRET
    ? {
        cloud_name: trim(process.env.CLOUDINARY_CLOUD_NAME),
        api_key: trim(process.env.CLOUDINARY_API_KEY),
        api_secret: trim(process.env.CLOUDINARY_API_SECRET),
      }
    : null);

export const usingCloudinary = Boolean(cloudinaryConfig);

const fileFilter = (req, file, cb) => {
  if (!/^image\/(jpe?g|png|webp|gif|avif)$/i.test(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, WEBP, AVIF or GIF images are allowed"));
  }
  cb(null, true);
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 MB

let uploadImageMiddleware;

if (usingCloudinary) {
  // Pass credentials explicitly — relying on the SDK's env-var auto-read
  // silently fails when only the individual CLOUDINARY_* vars are set,
  // which surfaces as "Must supply api_key" at upload time.
  cloudinary.config({ ...cloudinaryConfig, secure: true });
  // Print a redacted config summary so you can confirm at a glance in Vercel
  // logs that we're pointing at the right Cloudinary account and picked up a
  // secret. The api_secret itself is never logged.
  console.log(
    `✔ Cloudinary configured — cloud=${cloudinaryConfig.cloud_name}, ` +
    `key=${String(cloudinaryConfig.api_key || "").slice(0, 4)}…, ` +
    `secretLen=${String(cloudinaryConfig.api_secret || "").length}`
  );

  const folder = process.env.CLOUDINARY_FOLDER || "vrs";
  const memoryMulter = multer({ storage: multer.memoryStorage(), fileFilter, limits });

  // Compose: buffer with multer → stream to Cloudinary → mutate req.file.
  uploadImageMiddleware = {
    single: (field) => {
      const memoryMw = memoryMulter.single(field);
      return (req, res, next) => {
        memoryMw(req, res, (err) => {
          if (err) return next(err);
          if (!req.file) return next();
          const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (uploadErr, result) => {
              if (uploadErr) return next(uploadErr);
              // Match multer.diskStorage's shape so the controller stays agnostic.
              req.file.path = result.secure_url;
              req.file.filename = result.public_id;
              req.file.cloudinary = result;
              next();
            }
          );
          stream.end(req.file.buffer);
        });
      };
    },
  };
  console.log("✔ Image uploads → Cloudinary");
} else {
  const uploadDir = process.env.VERCEL ? "/tmp/uploads" : "uploads";
  try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn(`Could not prepare upload dir "${uploadDir}":`, err.message);
  }

  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || "").toLowerCase();
      const random = crypto.randomBytes(6).toString("hex");
      cb(null, `${Date.now()}-${random}${ext || ".bin"}`);
    },
  });

  uploadImageMiddleware = multer({ storage: diskStorage, fileFilter, limits });
}

export const uploadImage = uploadImageMiddleware;
