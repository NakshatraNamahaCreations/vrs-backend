import User from "../models/User.js";
import { signToken } from "../utils/token.js";
import { generateOtp, hashOtp, otpExpiryDate, verifyOtp } from "../utils/otp.js";
import { sendSms, otpMessage } from "../utils/sms.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/auth/send-otp
 * body: { phone }
 */
export const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body || {};
  if (!/^\d{10}$/.test(phone || "")) {
    return res.status(400).json({ error: "Enter a valid 10-digit mobile number" });
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const otpExpiresAt = otpExpiryDate();

  const user = await User.findOneAndUpdate(
    { phone },
    { $set: { otpHash, otpExpiresAt, otpAttempts: 0 }, $setOnInsert: { phone } },
    { new: true, upsert: true }
  );

  await sendSms(phone, otpMessage(otp));

  res.json({
    ok: true,
    message: "OTP sent",
    // Never return the OTP in production — helpful only in local dev
    ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
    userId: user._id,
    expiresAt: user.otpExpiresAt,
  });
});

/**
 * POST /api/auth/verify-otp
 * body: { phone, otp }
 */
export const verifyOtpHandler = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body || {};
  if (!/^\d{10}$/.test(phone || "") || !/^\d{6}$/.test(otp || "")) {
    return res.status(400).json({ error: "Invalid phone or OTP" });
  }

  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({ error: "No OTP requested for this number" });

  if (user.otpAttempts >= 5) {
    return res.status(429).json({ error: "Too many attempts. Request a new OTP." });
  }

  const ok = await verifyOtp(otp, user.otpHash, user.otpExpiresAt);
  if (!ok) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();
    return res.status(400).json({ error: "OTP is invalid or expired" });
  }

  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ uid: user._id.toString() });

  res.json({ ok: true, token, user: user.toPublic() });
});

/**
 * POST /api/auth/dev-login
 * body: { phone }
 *
 * Bypasses OTP verification — issues a JWT directly from a phone number.
 * Meant for development / demo use only.
 */
export const devLogin = asyncHandler(async (req, res) => {
  const { phone } = req.body || {};
  if (!/^\d{10}$/.test(phone || "")) {
    return res.status(400).json({ error: "Enter a valid 10-digit mobile number" });
  }

  const user = await User.findOneAndUpdate(
    { phone },
    { $set: { lastLoginAt: new Date() }, $setOnInsert: { phone } },
    { new: true, upsert: true }
  );

  const token = signToken({ uid: user._id.toString() });
  res.json({ ok: true, token, user: user.toPublic() });
});

/**
 * GET /api/auth/me
 */
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

/**
 * POST /api/auth/logout — stateless; client discards token
 */
export const logout = asyncHandler(async (req, res) => {
  res.json({ ok: true });
});
