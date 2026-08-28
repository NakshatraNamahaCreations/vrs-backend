import ContactMessage from "../../models/ContactMessage.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** GET /api/admin/enquiries */
export const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const p = Math.max(1, Number(page));
  const l = Math.min(200, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    ContactMessage.find(filter).sort("-createdAt").skip((p - 1) * l).limit(l),
    ContactMessage.countDocuments(filter),
  ]);

  res.json({ items, total, page: p, limit: l });
});

/** PATCH /api/admin/enquiries/:id  body: { status } */
export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const doc = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!doc) return res.status(404).json({ error: "Enquiry not found" });
  res.json(doc);
});

/** DELETE /api/admin/enquiries/:id */
export const remove = asyncHandler(async (req, res) => {
  const doc = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: "Enquiry not found" });
  res.json({ ok: true, id: doc._id });
});
