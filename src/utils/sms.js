/**
 * Thin SMS sender.
 * - In dev (no SMS_PROVIDER), logs OTP to console.
 * - Swap in your provider (MSG91, Twilio, Fast2SMS, etc.) inside sendSms.
 */
export async function sendSms(phone, message) {
  const provider = process.env.SMS_PROVIDER;

  if (!provider) {
    console.log(`[SMS→+91${phone}] ${message}`);
    return { ok: true, provider: "console" };
  }

  // TODO: implement your gateway here
  //
  // Example (Fast2SMS):
  // const res = await fetch("https://www.fast2sms.com/dev/bulkV2", { ... });
  // return { ok: res.ok, provider };
  //
  return { ok: true, provider };
}

export const otpMessage = (otp) =>
  `Your VRS Water Purifiers OTP is ${otp}. It expires in ${
    process.env.OTP_TTL_MINUTES || 10
  } minutes. Never share this with anyone.`;
