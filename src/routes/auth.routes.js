import { Router } from "express";
import { sendOtp, verifyOtpHandler, devLogin, me, logout } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpHandler);
router.post("/dev-login", devLogin);
router.get("/me", protect, me);
router.post("/logout", protect, logout);

export default router;
