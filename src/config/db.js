import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  mongoose.set("strictQuery", true);

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });

  console.log(`✔ Mongo connected — ${conn.connection.host}/${conn.connection.name}`);

  mongoose.connection.on("error", (err) =>
    console.error("Mongo error:", err.message)
  );
  mongoose.connection.on("disconnected", () =>
    console.warn("Mongo disconnected")
  );

  return conn;
}
