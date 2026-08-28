import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

/* ---------- start ---------- */
connectDB()
  .then(() =>
    app.listen(PORT, () =>
      console.log(`✔ VRS backend running on http://localhost:${PORT}`)
    )
  )
  .catch((err) => {
    console.error("✖ Failed to start:", err.message);
    process.exit(1);
  });
