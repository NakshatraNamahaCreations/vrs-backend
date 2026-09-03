import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    category: { type: String, required: true, index: true },
    brand: { type: String, trim: true, default: "" },
    description: { type: String, default: "" },

    // Optional — some catalogue entries are "price on request".
    price: { type: Number, min: 0 },
    originalPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },

    image: { type: String, default: "" },
    images: [String],

    tag: { type: String, enum: ["Bestseller", "Popular", "New", ""], default: "" },
    features: [String],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.virtual("discountPct").get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

productSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Product", productSchema);
