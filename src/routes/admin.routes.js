import { Router } from "express";
import { protectAdmin } from "../middleware/admin.middleware.js";

import * as authCtrl from "../controllers/admin/auth.controller.js";
import * as productCtrl from "../controllers/admin/product.controller.js";
import * as userCtrl from "../controllers/admin/user.controller.js";
import * as orderCtrl from "../controllers/admin/order.controller.js";
import * as enquiryCtrl from "../controllers/admin/enquiry.controller.js";
import * as statsCtrl from "../controllers/admin/stats.controller.js";
import * as uploadCtrl from "../controllers/admin/upload.controller.js";
import { uploadImage } from "../middleware/upload.middleware.js";

const router = Router();

/* ---------- auth (public) ---------- */
router.post("/auth/login", authCtrl.login);

/* ---------- everything below requires an admin token ---------- */
router.use(protectAdmin);

router.get("/auth/me", authCtrl.me);

router.get("/stats", statsCtrl.overview);

router.post("/upload", uploadImage.single("file"), uploadCtrl.uploadFile);

router.get("/products", productCtrl.list);
router.post("/products", productCtrl.create);
router.patch("/products/:id", productCtrl.update);
router.delete("/products/:id", productCtrl.remove);

router.get("/users", userCtrl.list);
router.get("/users/:id", userCtrl.detail);

router.get("/orders", orderCtrl.list);
router.get("/orders/:id", orderCtrl.detail);
router.patch("/orders/:id/status", orderCtrl.updateStatus);

router.get("/enquiries", enquiryCtrl.list);
router.patch("/enquiries/:id", enquiryCtrl.updateStatus);
router.delete("/enquiries/:id", enquiryCtrl.remove);

export default router;
