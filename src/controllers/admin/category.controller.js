import Category from "../../models/Category.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** GET /api/admin/categories */
export const list = asyncHandler(async (req, res) => {
  const items = await Category.find().sort({ order: 1, name: 1 });
  res.json({ items, total: items.length });
});

/** POST /api/admin/categories  body: { name, image?, order?, isActive? } */
export const create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.name || !String(body.name).trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  const doc = await Category.create(body);
  res.status(201).json(doc);
});

/** PATCH /api/admin/categories/:id */
export const update = asyncHandler(async (req, res) => {
  const doc = await Category.findByIdAndUpdate(req.params.id, req.body || {}, {
    new: true,
    runValidators: true,
  });
  if (!doc) return res.status(404).json({ error: "Category not found" });
  res.json(doc);
});

/** DELETE /api/admin/categories/:id */
export const remove = asyncHandler(async (req, res) => {
  const doc = await Category.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: "Category not found" });
  res.json({ ok: true, id: doc._id });
});
