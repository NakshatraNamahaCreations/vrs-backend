import mongoose from "mongoose";

/**
 * Storefront categories rendered in the homepage "Shop by category" grid.
 * Kept independent of Product.category (which is a free-form string) so the
 * marketing site can maintain a curated ordered list with a hero image per
 * tile, without every product creating an implicit category.
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, trim: true, index: true },
    image: { type: String, default: "" },
    order: { type: Number, default: 0, index: true }, // lower = appears first
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-slug the name if the admin doesn't set one explicitly.
categorySchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = String(this.name)
      .toLowerCase()
      .replace(/[+&/\\]/g, "-")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

export default mongoose.model("Category", categorySchema);
