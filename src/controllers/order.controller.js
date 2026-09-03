import crypto from "crypto";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { razorpay } from "../config/razorpay.js";
import { sendMail } from "../utils/mailer.js";
import { renderOrderConfirmation } from "../utils/emails/orderConfirmation.js";

/**
 * Atomically claim the next order number in the "order" sequence and format
 * it as `VRS####` (4 zero-padded digits, extending naturally past 9999).
 */
async function nextOrderNumber() {
  const doc = await Counter.findByIdAndUpdate(
    "order",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `VRS${String(doc.seq).padStart(4, "0")}`;
}

/**
 * POST /api/orders
 * body: { shippingAddress, paymentMethod, promoCode?, discount? }
 *
 * Creates a pending order from the user's cart and, for RAZORPAY payments,
 * also creates a matching Razorpay order so the frontend can open Checkout.
 * The cart is NOT cleared here — that happens after payment verification, so
 * a dropped checkout leaves the user's cart intact for a retry.
 */
export const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = "RAZORPAY", promoCode = "", discount = 0 } = req.body || {};

  if (!shippingAddress || !shippingAddress.pincode) {
    return res.status(400).json({ error: "Shipping address is required" });
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "name image"
  );
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const items = cart.items.map((i) => ({
    product: i.product._id || i.product,
    name: i.product.name,
    image: i.product.image,
    qty: i.qty,
    price: i.price,
    originalPrice: i.originalPrice,
  }));

  const { subtotal } = cart.totals();
  // const delivery = subtotal >= 999 ? 0 : 79;
  const delivery = 0;
  const total = Math.max(0, subtotal - Number(discount || 0) + delivery);

  const orderNumber = await nextOrderNumber();

  const order = await Order.create({
    orderNumber,
    user: req.user._id,
    items,
    subtotal,
    discount,
    delivery,
    total,
    promoCode,
    shippingAddress,
    paymentMethod,
  });

  // Kick off a Razorpay order so the frontend can open Checkout immediately.
  // Amount is in the smallest currency unit (paise for INR).
  let razorpayOrder = null;
  try {
    razorpayOrder = await razorpay().orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: orderNumber,
      notes: {
        orderId: String(order._id),
        userId: String(req.user._id),
      },
    });

    order.razorpay = { orderId: razorpayOrder.id };
    await order.save();
  } catch (err) {
    // Roll back the DB order so the user doesn't end up with an orphan
    // pending row they can't pay for.
    await Order.deleteOne({ _id: order._id });
    return res.status(502).json({
      error: err.message || "Couldn't initiate payment. Please try again.",
    });
  }

  res.status(201).json({
    order,
    razorpay: {
      key: process.env.RAZORPAY_KEY_ID,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    },
  });
});

/**
 * POST /api/orders/:id/verify-payment
 * body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Verifies the HMAC signature returned by Razorpay Checkout and, on success,
 * marks the order paid and clears the cart.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment details" });
  }

  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.razorpay?.orderId !== razorpay_order_id) {
    return res.status(400).json({ error: "Payment does not match this order" });
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    order.paymentStatus = "failed";
    await order.save();
    return res.status(400).json({ error: "Invalid payment signature" });
  }

  order.razorpay.paymentId = razorpay_payment_id;
  order.razorpay.signature = razorpay_signature;
  order.paymentStatus = "paid";
  order.orderStatus = "confirmed";
  await order.save();

  // Clear the server-side cart now that payment is confirmed.
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });

  // Send confirmation email. Wrapped so any SMTP hiccup never fails the
  // payment-verification response — the order is confirmed either way.
  if (req.user?.email) {
    try {
      const { subject, html, text } = renderOrderConfirmation({ order, user: req.user });
      await sendMail({ to: req.user.email, subject, html, text });
    } catch (err) {
      console.warn(
        `[email] Order confirmation to ${req.user.email} failed:`,
        err.message
      );
    }
  }

  res.json({ ok: true, order });
});

/**
 * POST /api/orders/:id/payment-failed
 * Called from the frontend when Razorpay Checkout reports a failure or the
 * user dismisses the modal. Marks the order as failed so the paper trail
 * matches what the user saw.
 */
export const markPaymentFailed = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.paymentStatus === "pending") {
    order.paymentStatus = "failed";
    await order.save();
  }
  res.json({ ok: true, order });
});

/**
 * GET /api/orders
 */
export const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
  res.json({ items: orders });
});

/**
 * GET /api/orders/:id
 */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});
