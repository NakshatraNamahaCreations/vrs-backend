import { Router } from "express";
import {
  placeOrder,
  listOrders,
  getOrder,
  verifyPayment,
  markPaymentFailed,
} from "../controllers/order.controller.js";
import { resolveUser } from "../middleware/auth.middleware.js";

const router = Router();

router.use(resolveUser);

router.post("/", placeOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/:id/verify-payment", verifyPayment);
router.post("/:id/payment-failed", markPaymentFailed);

export default router;
