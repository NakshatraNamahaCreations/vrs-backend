import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import userRoutes from "./routes/user.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const app = express();

/* ---------- middleware ---------- */
app.use(
  helmet({
    // Allow images served from /uploads to be embedded on other origins
    // (customer site, admin panel).
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
const allowedOrigins = [
  ...(process.env.CLIENT_ORIGIN?.split(",") || []),
  ...(process.env.ADMIN_ORIGIN?.split(",") || []),
].filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : "*",
    credentials: true,
    // Allow the mock-login phone header alongside the standard ones.
    allowedHeaders: ["Content-Type", "Authorization", "x-vrs-phone"],
  })
);
app.use(express.json({ limit: "1mb" }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

/* ---------- static: uploaded images ---------- */
app.use("/uploads", express.static("uploads", { maxAge: "7d" }));

/* ---------- global rate-limit on /api/auth ---------- */
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  })
);

/* ---------- routes ---------- */
app.get("/", (req, res) => res.json({ ok: true, service: "vrs-backend" }));
app.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/user", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);

/* ---------- 404 + error handler ---------- */
app.use(notFound);
app.use(errorHandler);

export default app;
