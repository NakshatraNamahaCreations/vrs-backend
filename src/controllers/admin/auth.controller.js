import Admin from "../../models/Admin.js";
import { signToken } from "../../utils/token.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** POST /api/admin/auth/login  body: { email, password } */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await admin.comparePassword(password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken({ aid: admin._id.toString(), role: "admin" });
  res.json({ ok: true, token, admin: admin.toPublic() });
});

/** GET /api/admin/auth/me */
export const me = asyncHandler(async (req, res) => {
  res.json({ admin: req.admin.toPublic() });
});
