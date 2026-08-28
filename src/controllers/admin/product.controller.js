import Product from "../../models/Product.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** GET /api/admin/products */
export const list = asyncHandler(async (req, res) => {
  const { q, category, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (q) filter.name = { $regex: q, $options: "i" };
  if (category) filter.category = category;

  const p = Math.max(1, Number(page));
  const l = Math.min(200, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Product.find(filter).sort("-createdAt").skip((p - 1) * l).limit(l),
    Product.countDocuments(filter),
  ]);

  res.json({ items, total, page: p, limit: l });
});

/** POST /api/admin/products */
export const create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.category || body.price == null) {
    return res.status(400).json({ error: "name, category and price are required" });
  }
  const product = await Product.create(body);
  res.status(201).json(product);
});

/** PATCH /api/admin/products/:id */
export const update = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body || {}, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

/** DELETE /api/admin/products/:id */
export const remove = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ ok: true, id: product._id });
});
