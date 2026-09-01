import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * Ensures a Category document exists for `name`. Idempotent — silently no-ops
 * when a matching category is already there. New entries are appended to the
 * end of the sort order so they don't reshuffle the existing tile lineup.
 *
 * Errors are swallowed on purpose: a failed category upsert must not break
 * the product save that triggered it.
 */
async function ensureCategory(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return;
  try {
    const existing = await Category.findOne({ name: trimmed });
    if (existing) return;
    const highest = await Category.findOne().sort("-order").select("order");
    await Category.create({
      name: trimmed,
      order: (highest?.order ?? -1) + 1,
      isActive: true,
    });
  } catch (err) {
    // A race with a duplicate create is fine — surface everything else in logs.
    if (err?.code !== 11000) {
      console.warn(`[ensureCategory] "${trimmed}":`, err.message);
    }
  }
}

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
  await ensureCategory(product.category);
  res.status(201).json(product);
});

/** PATCH /api/admin/products/:id */
export const update = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body || {}, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (req.body?.category) await ensureCategory(product.category);
  res.json(product);
});

/** DELETE /api/admin/products/:id */
export const remove = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ ok: true, id: product._id });
});
