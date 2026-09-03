import User from "../models/User.js";
import { signToken } from "../utils/token.js";
import { generateOtp, hashOtp, otpExpiryDate, verifyOtp } from "../utils/otp.js";
import { sendSms, otpMessage } from "../utils/sms.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/**
 * POST /api/auth/signup
 * body: { email, password, name?, phone? }
 * Creates a customer account and issues a JWT so the client is logged in
 * immediately on success.
 */
export const signup = asyncHandler(async (req, res) => {
  const { email, password, name = "", phone = "" } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!EMAIL_RE.test(normalizedEmail)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (phone && !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: "Phone must be a 10-digit number" });
  }

  const trimmedPhone = String(phone).trim();

  // Explicit pre-checks so we can return a targeted 409 instead of relying
  // solely on the duplicate-key error below.
  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }
  if (trimmedPhone) {
    const existingPhone = await User.findOne({ phone: trimmedPhone });
    if (existingPhone) {
      return res.status(409).json({
        error: "This phone number is already linked to another account. Enter a different number.",
      });
    }
  }

  const user = new User({
    email: normalizedEmail,
    name: String(name).trim(),
    phone: trimmedPhone,
    lastLoginAt: new Date(),
  });
  await user.setPassword(password);

  try {
    await user.save();
  } catch (err) {
    // Race between the pre-check and save — turn Mongo's raw duplicate-key
    // error into a friendly message so it never leaks to the UI.
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
      if (field === "phone") {
        return res.status(409).json({
          error: "This phone number is already linked to another account. Enter a different number.",
        });
      }
      if (field === "email") {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
      return res.status(409).json({ error: "That value is already taken." });
    }
    throw err;
  }

  const token = signToken({ uid: user._id.toString() });
  res.status(201).json({ ok: true, token, user: user.toPublic() });
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!EMAIL_RE.test(normalizedEmail) || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Explicitly select the passwordHash field (schema hides it by default).
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ uid: user._id.toString() });
  res.json({ ok: true, token, user: user.toPublic() });
});

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
