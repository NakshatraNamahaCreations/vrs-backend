/**
 * One-shot: renumber every order in the DB with a sequential VRS#### code,
 * ordered oldest → newest, and reset the "order" counter so future orders
 * continue from the last assigned number.
 *
 * Run:  npm run backfill:orders
 *
 * Two-pass sequence to avoid unique-index collisions:
 *   1. Unset `orderNumber` on every order.
 *   2. Walk the orders in createdAt ascending order, assigning VRS0001, VRS0002, …
 *   3. Set the Counter for "order" so the next new order continues cleanly.
 */
import "dotenv/config";
import connectDB from "../config/db.js";
import Order from "../models/Order.js";
import Counter from "../models/Counter.js";

function format(n) {
  return `VRS${String(n).padStart(4, "0")}`;
}

(async () => {
  try {
    await connectDB();

    const total = await Order.countDocuments({});
    if (total === 0) {
      console.log("No orders found. Resetting counter to 0.");
      await Counter.findByIdAndUpdate(
        "order",
        { $set: { seq: 0 } },
        { upsert: true }
      );
      process.exit(0);
    }

    console.log(`Renumbering ${total} orders — oldest → newest…`);

    // Pass 1: strip existing numbers so the unique-sparse index can't collide
    // when we start assigning fresh ones.
    await Order.updateMany({}, { $unset: { orderNumber: "" } });

    // Pass 2: assign fresh sequential numbers.
    const cursor = Order.find({}, { _id: 1, createdAt: 1 })
      .sort({ createdAt: 1, _id: 1 })
      .cursor();

    let i = 0;
    for await (const doc of cursor) {
      i += 1;
      await Order.updateOne({ _id: doc._id }, { $set: { orderNumber: format(i) } });
      if (i % 25 === 0) console.log(`  … ${i} / ${total}`);
    }

    // Sync the counter so the next new order picks up right after the last
    // backfilled one.
    await Counter.findByIdAndUpdate(
      "order",
      { $set: { seq: i } },
      { upsert: true }
    );

    console.log(`✔ Done — ${i} orders renumbered. Next new order will be ${format(i + 1)}.`);
    process.exit(0);
  } catch (err) {
    console.error("✖ Backfill failed:", err);
    process.exit(1);
  }
})();
