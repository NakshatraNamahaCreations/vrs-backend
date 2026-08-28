import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * POST /api/admin/upload
 * Multipart form with a single `file` field.
 * Returns the public URL that can be stored on Product.image.
 */
export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({
    url,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});
