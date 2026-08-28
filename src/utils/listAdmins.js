/**
 * Debug helper — lists every admin currently in the DB.
 * Run:  node src/utils/listAdmins.js
 */
import "dotenv/config";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";

(async () => {
  try {
    await connectDB();
    const admins = await Admin.find().sort("-createdAt");
    if (admins.length === 0) {
      console.log("\n⚠  No admins found in the database.");
      console.log("   Run:  npm run seed:admin\n");
    } else {
      console.log(`\n${admins.length} admin(s):\n`);
      admins.forEach((a, i) =>
        console.log(`  ${i + 1}.  ${a.email}   ·  ${a.name}   ·  ${a.role}   ·  created ${a.createdAt.toLocaleString("en-IN")}`)
      );
      console.log();
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
