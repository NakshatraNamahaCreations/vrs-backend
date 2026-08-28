import app from "../src/app.js";
import connectDB from "../src/config/db.js";

/**
 * Vercel serverless entry — every request rewritten to /api by vercel.json
 * lands here. We share the same Express app used for local dev, but ensure
 * the Mongo connection is established once per warm container.
 *
 * A cached promise is used so concurrent invocations wait on the same
 * in-flight connect; on failure we clear it so the next invocation retries
 * instead of dead-lettering.
 */
let dbPromise = null;
function ensureDb() {
  if (!dbPromise) {
    dbPromise = connectDB().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export default async function handler(req, res) {
  try {
    await ensureDb();
  } catch (err) {
    console.error("DB connect failed:", err);
    res.status(500).json({ error: "Database not reachable" });
    return;
  }
  return app(req, res);
}
