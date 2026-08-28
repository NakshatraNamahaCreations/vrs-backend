import ContactMessage from "../models/ContactMessage.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/contact
 * body: { name, phone, email?, message? }
 */
export const submitContact = asyncHandler(async (req, res) => {
  const { name, phone, email = "", message = "" } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
  if (!/^\d{10}$/.test(phone || ""))
    return res.status(400).json({ error: "Valid 10-digit phone is required" });

  const doc = await ContactMessage.create({
    name: name.trim(),
    phone,
    email: email.trim(),
    message: String(message).slice(0, 2000),
  });

  res.status(201).json({ ok: true, id: doc._id });
});
