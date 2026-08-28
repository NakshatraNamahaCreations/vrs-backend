import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
    // Snapshot price at add-time — protects users if a product price changes
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
  },
  { _id: false, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.methods.totals = function () {
  const subtotal = this.items.reduce((n, i) => n + i.price * i.qty, 0);
  const mrp = this.items.reduce(
    (n, i) => n + (i.originalPrice || i.price) * i.qty,
    0
  );
  return {
    itemCount: this.items.reduce((n, i) => n + i.qty, 0),
    subtotal,
    mrp,
    savings: Math.max(0, mrp - subtotal),
  };
};

export default mongoose.model("Cart", cartSchema);
