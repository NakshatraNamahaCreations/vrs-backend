import Razorpay from "razorpay";

let instance = null;

/**
 * Lazy singleton for the Razorpay SDK. Instantiating early would crash the
 * server in environments where the keys aren't set yet (CI, tests, first
 * deploy); deferring the check to first use keeps the rest of the API usable.
 */
export function razorpay() {
  if (instance) return instance;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    );
  }

  instance = new Razorpay({ key_id, key_secret });
  return instance;
}
