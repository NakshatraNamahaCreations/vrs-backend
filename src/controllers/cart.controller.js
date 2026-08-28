import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cartFor = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "name image category"
  );
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const serialize = (cart) => ({
  items: cart.items,
  ...cart.totals(),
});

/**
 * GET /api/cart
 */
export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartFor(req.user._id);
  res.json(serialize(cart));
});

/**
 * POST /api/cart/items
 * body: { productId, qty? }
 */
export const addItem = asyncHandler(async (req, res) => {
  const { productId, qty = 1 } = req.body || {};
  const product = await Product.findById(productId);
  if (!product || !product.isActive)
    return res.status(404).json({ error: "Product not found" });

  const cart = await cartFor(req.user._id);
  const existing = cart.items.find(
    (i) => i.product.equals?.(product._id) || String(i.product?._id || i.product) === String(product._id)
  );

  if (existing) {
    existing.qty = Math.min(99, existing.qty + Number(qty));
  } else {
    cart.items.push({
      product: product._id,
      qty: Math.max(1, Number(qty)),
      price: product.price,
      originalPrice: product.originalPrice,
    });
  }
  await cart.save();
  await cart.populate("items.product", "name image category");

  res.status(201).json(serialize(cart));
});

/**
 * PATCH /api/cart/items/:productId
 * body: { qty }
 */
export const updateItem = asyncHandler(async (req, res) => {
  const { qty } = req.body || {};
  const q = Number(qty);
  const cart = await cartFor(req.user._id);
  const item = cart.items.find(
    (i) => String(i.product?._id || i.product) === String(req.params.productId)
  );
  if (!item) return res.status(404).json({ error: "Item not in cart" });

  if (q <= 0) {
    cart.items = cart.items.filter(
      (i) => String(i.product?._id || i.product) !== String(req.params.productId)
    );
  } else {
    item.qty = Math.min(99, q);
  }
  await cart.save();
  await cart.populate("items.product", "name image category");

  res.json(serialize(cart));
});

/**
 * DELETE /api/cart/items/:productId
 */
export const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartFor(req.user._id);
  cart.items = cart.items.filter(
    (i) => String(i.product?._id || i.product) !== String(req.params.productId)
  );
  await cart.save();
  await cart.populate("items.product", "name image category");

  res.json(serialize(cart));
});

/**
 * DELETE /api/cart
 */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartFor(req.user._id);
  cart.items = [];
  await cart.save();
  res.json(serialize(cart));
});
