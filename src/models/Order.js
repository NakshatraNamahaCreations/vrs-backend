import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: String,
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Uniform display code (e.g. "VRS0001"). Assigned atomically on create via
    // the Counter model. Optional so pre-existing orders keep loading; the
    // frontend falls back to a short-ObjectId format when this is missing.
    orderNumber: { type: String, unique: true, sparse: true, index: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },

    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    delivery: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    promoCode: { type: String, default: "" },

    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },

    paymentMethod: { type: String, enum: ["RAZORPAY", "UPI", "CARD", "NETBANKING", "WALLET"], default: "RAZORPAY" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },

    razorpay: {
      orderId: { type: String, index: true },
      paymentId: String,
      signature: String,
    },
    orderStatus: {
      type: String,
      enum: ["placed", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"],
      default: "placed",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
