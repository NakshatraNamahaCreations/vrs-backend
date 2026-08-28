import Order from "../../models/Order.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** GET /api/admin/orders */
export const list = asyncHandler(async (req, res) => {
  const { status, q, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;

  const p = Math.max(1, Number(page));
  const l = Math.min(200, Math.max(1, Number(limit)));

  let query = Order.find(filter)
    .populate("user", "name phone email")
    .sort("-createdAt")
    .skip((p - 1) * l)
    .limit(l);

  const [items, total] = await Promise.all([
    query,
    Order.countDocuments(filter),
  ]);

  const filtered = q
    ? items.filter((o) => {
        const s = q.toLowerCase();
        return (
          o._id.toString().includes(s) ||
          o.user?.phone?.includes(s) ||
          o.user?.name?.toLowerCase().includes(s)
        );
      })
    : items;

  res.json({ items: filtered, total, page: p, limit: l });
});

/** GET /api/admin/orders/:id */
export const detail = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name phone email"
  );
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

/** PATCH /api/admin/orders/:id/status  body: { orderStatus, paymentStatus? } */
export const updateStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body || {};
  const update = {};
  if (orderStatus) update.orderStatus = orderStatus;
  if (paymentStatus) update.paymentStatus = paymentStatus;

  const order = await Order.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).populate("user", "name phone email");

  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});
