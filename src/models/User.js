import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    // Never returned to the client. `select: false` keeps it out of default
    // queries — the auth controller explicitly selects it when verifying.
    passwordHash: { type: String, select: false },

    name: { type: String, trim: true, default: "" },
    phone: {
      type: String,
      trim: true,
      default: "",
      // Sparse + optional so email-only users don't collide on empty string.
      sparse: true,
      match: [/^$|^\d{10}$/, "Invalid phone"],
    },
    addresses: [addressSchema],

    // Legacy OTP fields — kept so pre-existing docs still validate, but no
    // longer used by the email/password flow.
    otpHash: String,
    otpExpiresAt: Date,
    otpAttempts: { type: Number, default: 0 },

    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(String(password), 10);
};

userSchema.methods.verifyPassword = async function (password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(String(password), this.passwordHash);
};

userSchema.methods.toPublic = function () {
  const { _id, email, name, phone, addresses, createdAt } = this;
  return { id: _id, email, name, phone, addresses, createdAt };
};

export default mongoose.model("User", userSchema);
