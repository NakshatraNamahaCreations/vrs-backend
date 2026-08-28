import { Router } from "express";
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} from "../controllers/cart.controller.js";
import { resolveUser } from "../middleware/auth.middleware.js";

const router = Router();

router.use(resolveUser);

router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items/:productId", updateItem);
router.delete("/items/:productId", removeItem);
router.delete("/", clearCart);

export default router;
