/**
 * Bootstrap the first admin account from env vars.
 * Run:  npm run seed:admin
 */
import "dotenv/config";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";

(async () => {
  try {
    await connectDB();

    const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || "";
    const name = process.env.ADMIN_NAME || "Admin";

    if (!email || !password) {
      console.error("✖ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
      process.exit(1);
    }

    let admin = await Admin.findOne({ email });
    if (admin) {
      await admin.setPassword(password);
      admin.name = name;
      await admin.save();
      console.log(`✔ Admin password reset for ${email}`);
    } else {
      admin = new Admin({ email, name, role: "superadmin" });
      await admin.setPassword(password);
      await admin.save();
      console.log(`✔ Admin created — ${email}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Admin seed failed:", err.message);
    process.exit(1);
  }
})();
