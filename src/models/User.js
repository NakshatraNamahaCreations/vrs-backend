import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    label: { type: String, default: "Home" },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^\d{10}$/,
    },
    name: { type: String, trim: true, default: "" },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      match: [/^$|^\S+@\S+\.\S+$/, "Invalid email"],
    },
    addresses: [addressSchema],

    // OTP fields — hashed, single active OTP at a time
    otpHash: String,
    otpExpiresAt: Date,
    otpAttempts: { type: Number, default: 0 },

    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function () {
  const { _id, phone, name, email, addresses, createdAt } = this;
  return { id: _id, phone, name, email, addresses, createdAt };
};

export default mongoose.model("User", userSchema);
