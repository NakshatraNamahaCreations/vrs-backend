import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/user/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

/**
 * PATCH /api/user/profile
 * body: { name?, email? }
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body || {};
  if (name !== undefined) req.user.name = String(name).trim();
  if (email !== undefined) req.user.email = String(email).trim().toLowerCase();
  await req.user.save();
  res.json({ user: req.user.toPublic() });
});

/**
 * POST /api/user/addresses
 *
 * Uses atomic $push (and a follow-up $set when needed) instead of the
 * load-modify-save pattern so concurrent requests can't clobber each other,
 * and Mongoose subdoc-tracking edge cases never come into play.
 */
export const addAddress = asyncHandler(async (req, res) => {
  const {
    fullName,
    phone,
    label,
    line1,
    line2,
    city,
    state,
    pincode,
    landmark,
    isDefault,
  } = req.body || {};

  if (!line1 || !city || !state || !pincode) {
    return res.status(400).json({ error: "line1, city, state and pincode are required" });
  }

  console.log("[addAddress] user", String(req.user._id), "existing count:", (req.user.addresses || []).length);

  const hasAny = (req.user.addresses || []).length > 0;
  const makeDefault = isDefault === true || !hasAny;

  if (makeDefault && hasAny) {
    await User.updateOne(
      { _id: req.user._id },
      { $set: { "addresses.$[].isDefault": false } }
    );
  }

  const newAddress = {
    fullName: fullName || "",
    phone: phone || "",
    label: label || "Home",
    line1,
    line2: line2 || "",
    city,
    state,
    pincode,
    landmark: landmark || "",
    isDefault: makeDefault,
  };

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $push: { addresses: newAddress } },
    { new: true, runValidators: true }
  ).select("addresses");

  if (!updated) return res.status(404).json({ error: "User not found" });

  console.log("[addAddress] after push, count:", updated.addresses.length);

  res.status(201).json({ addresses: updated.addresses });
});

/**
 * PATCH /api/user/addresses/:id
 */
export const updateAddress = asyncHandler(async (req, res) => {
  const addr = req.user.addresses.id(req.params.id);
  if (!addr) return res.status(404).json({ error: "Address not found" });

  const editable = ["fullName", "phone", "label", "line1", "line2", "city", "state", "pincode", "landmark"];
  const set = {};
  editable.forEach((k) => {
    if (req.body[k] !== undefined) set[`addresses.$.${k}`] = req.body[k];
  });

  const promotingDefault = req.body.isDefault === true;

  if (promotingDefault) {
    // Two-step atomic promote: clear everyone, then set this one as default
    await User.updateOne(
      { _id: req.user._id },
      { $set: { "addresses.$[].isDefault": false } }
    );
    set["addresses.$.isDefault"] = true;
  }

  if (Object.keys(set).length > 0) {
    await User.updateOne(
      { _id: req.user._id, "addresses._id": req.params.id },
      { $set: set }
    );
  }

  const fresh = await User.findById(req.user._id).select("addresses");
  res.json({ addresses: fresh?.addresses || [] });
});

/**
 * DELETE /api/user/addresses/:id
 */
export const removeAddress = asyncHandler(async (req, res) => {
  const addr = req.user.addresses.id(req.params.id);
  if (!addr) return res.status(404).json({ error: "Address not found" });

  const wasDefault = addr.isDefault;

  // Atomic pull
  await User.updateOne(
    { _id: req.user._id },
    { $pull: { addresses: { _id: req.params.id } } }
  );

  const fresh = await User.findById(req.user._id).select("addresses");

  // If we removed the default, promote the first remaining address
  if (wasDefault && fresh && fresh.addresses.length > 0 && !fresh.addresses.some((a) => a.isDefault)) {
    await User.updateOne(
      { _id: req.user._id, "addresses._id": fresh.addresses[0]._id },
      { $set: { "addresses.$.isDefault": true } }
    );
    const promoted = await User.findById(req.user._id).select("addresses");
    return res.json({ addresses: promoted?.addresses || [] });
  }

  res.json({ addresses: fresh?.addresses || [] });
});
