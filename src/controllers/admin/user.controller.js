import User from "../../models/User.js";
import Order from "../../models/Order.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** GET /api/admin/users */
export const list = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const p = Math.max(1, Number(page));
  const l = Math.min(200, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("-otpHash -otpExpiresAt -otpAttempts")
      .sort("-createdAt")
      .skip((p - 1) * l)
      .limit(l),
    User.countDocuments(filter),
  ]);

  res.json({ items, total, page: p, limit: l });
});

/** GET /api/admin/users/:id — includes order history */
export const detail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-otpHash -otpExpiresAt -otpAttempts"
  );
  if (!user) return res.status(404).json({ error: "User not found" });

  const orders = await Order.find({ user: user._id }).sort("-createdAt").limit(20);
  res.json({ user, orders });
});
