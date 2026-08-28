import User from "../models/User.js";
import { verifyToken } from "../utils/token.js";

/**
 * Strict auth — must have a valid JWT. Used for endpoints where identity is
 * mission-critical (e.g. /auth/me).
 */
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.uid).select(
      "-otpHash -otpExpiresAt -otpAttempts"
    );
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Permissive user resolver — used on the cart/orders/address routes where we
 * accept either:
 *   1. A JWT (via `Authorization: Bearer …`), OR
 *   2. A plain phone number (via `x-vrs-phone: 9876543210`).
 *
 * For option 2 we upsert the user by phone so a purely mock-logged-in client
 * (no real OTP flow) can still transact against the backend.
 */
export async function resolveUser(req, res, next) {
  try {
    // Try JWT first — if it works, done.
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme === "Bearer" && token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.uid).select(
          "-otpHash -otpExpiresAt -otpAttempts"
        );
        if (user) {
          req.user = user;
          return next();
        }
      } catch { /* fall through to phone header */ }
    }

    // Fall back to phone header — upsert by phone.
    const phone = String(req.headers["x-vrs-phone"] || "").trim();
    if (/^\d{10}$/.test(phone)) {
      const user = await User.findOneAndUpdate(
        { phone },
        { $set: { lastLoginAt: new Date() }, $setOnInsert: { phone } },
        { new: true, upsert: true }
      ).select("-otpHash -otpExpiresAt -otpAttempts");
      req.user = user;
      return next();
    }

    return res.status(401).json({ error: "Not authenticated" });
  } catch (err) {
    return res.status(401).json({ error: "Auth resolution failed" });
  }
}
