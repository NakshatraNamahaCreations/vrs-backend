import bcrypt from "bcryptjs";
import crypto from "crypto";

const TTL_MIN = Number(process.env.OTP_TTL_MINUTES || 10);

export function generateOtp() {
  // 6-digit numeric OTP, never leading-zero-stripped (padStart safe)
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, "0");
}

export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

export function otpExpiryDate() {
  return new Date(Date.now() + TTL_MIN * 60 * 1000);
}

export async function verifyOtp(otp, hash, expiresAt) {
  if (!hash || !expiresAt || Date.now() > new Date(expiresAt).getTime()) return false;
  return bcrypt.compare(otp, hash);
}
