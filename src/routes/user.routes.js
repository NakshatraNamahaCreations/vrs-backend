import { Router } from "express";
import {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  removeAddress,
} from "../controllers/user.controller.js";
import { resolveUser } from "../middleware/auth.middleware.js";

const router = Router();

router.use(resolveUser);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.post("/addresses", addAddress);
router.patch("/addresses/:id", updateAddress);
router.delete("/addresses/:id", removeAddress);

export default router;
