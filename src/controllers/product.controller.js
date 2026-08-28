import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/products
 * query: category, brand, tag, q, minPrice, maxPrice, sort, page, limit
 */
export const listProducts = asyncHandler(async (req, res) => {
  const {
    category,
    brand,
    tag,
    q,
    minPrice,
    maxPrice,
    sort = "-createdAt",
    page = 1,
    limit = 24,
  } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (tag) filter.tag = tag;
  if (q) filter.name = { $regex: q, $options: "i" };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const p = Math.max(1, Number(page));
  const l = Math.min(60, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((p - 1) * l).limit(l),
    Product.countDocuments(filter),
  ]);

  res.json({
    items,
    page: p,
    limit: l,
    total,
    hasMore: p * l < total,
  });
});

/**
 * GET /api/products/:id
 */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});
