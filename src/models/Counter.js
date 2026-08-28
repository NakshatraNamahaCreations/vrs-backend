import mongoose from "mongoose";

/**
 * Generic atomic counter. One document per named sequence (e.g. "order").
 * Used to generate uniform, monotonic order numbers like VRS0001.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.model("Counter", counterSchema);
