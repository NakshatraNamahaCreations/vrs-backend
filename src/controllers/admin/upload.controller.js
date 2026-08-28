import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * POST /api/admin/upload
 * Multipart form with a single `file` field.
 *
 * Returns the URL that should be persisted on Product.image:
 *   - Cloudinary storage → req.file.path is already the full https URL.
 *   - Disk storage       → we build /uploads/<filename> for the static route.
 */
export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = /^https?:\/\//i.test(req.file.path || "")
    ? req.file.path
    : `/uploads/${req.file.filename}`;
  res.status(201).json({
    url,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});
