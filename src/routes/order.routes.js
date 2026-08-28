import { Router } from "express";
import { placeOrder, listOrders, getOrder } from "../controllers/order.controller.js";
import { resolveUser } from "../middleware/auth.middleware.js";

const router = Router();

router.use(resolveUser);

router.post("/", placeOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);

export default router;
