import Admin from "../models/Admin.js";
import { verifyToken } from "../utils/token.js";

export async function protectAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded?.aid || decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const admin = await Admin.findById(decoded.aid).select("-passwordHash");
    if (!admin) return res.status(401).json({ error: "Admin not found" });

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
