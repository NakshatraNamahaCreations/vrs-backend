import Category from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/categories
 * Public — returns active categories in the order the admin has set.
 */
export const listCategories = asyncHandler(async (req, res) => {
  const items = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
  res.json({ items });
});
