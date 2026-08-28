import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, match: /^\d{10}$/ },
    email: { type: String, trim: true, lowercase: true, default: "" },
    message: { type: String, default: "" },

    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ContactMessage", contactSchema);
