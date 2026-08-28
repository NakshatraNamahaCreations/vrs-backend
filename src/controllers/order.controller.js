import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
 */
export const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = "COD", promoCode = "", discount = 0 } = req.body || {};

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
  const delivery = subtotal >= 999 ? 0 : 79;
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

  // clear the cart after placing the order
  cart.items = [];
  await cart.save();

  res.status(201).json(order);
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
