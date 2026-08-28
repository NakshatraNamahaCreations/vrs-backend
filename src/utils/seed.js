/**
 * Seed products for local dev.
 * Run:  npm run seed
 */
import "dotenv/config";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";

const seed = [
  { name: "Aquaguard Astor RO UV Kit", category: "Aquaguard Spare Parts", brand: "Aquaguard", price: 3999, originalPrice: 5070, image: "/images/product1.jpg", tag: "Bestseller", stock: 40 },
  { name: "Aquaguard PF Candle Sleek ARP", category: "Aquaguard Spare Parts", brand: "Aquaguard", price: 375, originalPrice: 475, image: "/images/product2.png", tag: "Popular", stock: 200 },
  { name: "AquaGuard Enance RO Kit", category: "Aquaguard Spare Parts", brand: "Aquaguard", price: 3600, originalPrice: 4890, image: "/images/product3.png", tag: "Popular", stock: 30 },
  { name: "Aquaguard Prefilter Assembly", category: "Aquaguard Spare Parts", brand: "Aquaguard", price: 4499, originalPrice: 5999, image: "/images/product4.png", tag: "New", stock: 25 },
  { name: "Aquaguard Magna RO Kit PL4", category: "Aquaguard Spare Parts", brand: "Aquaguard", price: 3800, originalPrice: 5070, image: "/images/product5.png", tag: "Bestseller", stock: 22 },
  { name: "Aquaguard Universal RO Filter Kit", category: "Aquaguard Spare Parts", brand: "Aquaguard", price: 4500, originalPrice: 7445, image: "/images/product6.png", tag: "Bestseller", stock: 60 },
  { name: "50 LPH RO with Inbuilt Stainless Steel Tank", category: "Commercial RO", brand: "VRS", price: 48900, originalPrice: 64000, image: "/images/product7.png", tag: "Popular", stock: 6 },
  { name: "30 LPH RO with Mega Sediment Filter Copper + Alkaline", category: "Commercial Water Purifier", brand: "VRS", price: 15500, originalPrice: 25000, image: "/images/product8.png", tag: "New", stock: 12 },
  { name: "Aquaguard Aspire Blaze Insta WS RO+UV SS Hot & Ambient Copper", category: "Hot & Ambient", brand: "Aquaguard", price: 23500, originalPrice: 37000, image: "/images/product9.png", tag: "Popular", stock: 15 },
  { name: "KENT Elegant RO UV UF TDS Controller", category: "RO UV UF MTDS", brand: "Kent", price: 16500, originalPrice: 23500, image: "/images/product11.png", tag: "Popular", stock: 20 },
  { name: "KENT Grand Plus RO Water Purifier", category: "RO UV UF MTDS", brand: "Kent", price: 23500, originalPrice: 37000, image: "/images/product12.png", tag: "Popular", stock: 10 },
  { name: "Aquaguard Aspire Nova RO + UV Copper + Alkaline SS 2X", category: "RO + UV Water Purifier", brand: "Aquaguard", price: 24000, originalPrice: 36000, image: "/images/product13.png", tag: "Popular", stock: 18 },
  { name: "Kent Sapphire", category: "RO + UV Water Purifier", brand: "Kent", price: 18000, originalPrice: 25000, image: "/images/product14.png", tag: "Popular", stock: 14 },
  { name: "Aquaguard Designo UTC RO+UV 2X Water Purifier", category: "Under Sink Models", brand: "Aquaguard", price: 25900, originalPrice: 39500, image: "/images/product15.png", tag: "Popular", stock: 8 },
  { name: "Aquaguard Nova UV+UF 2X Copper Water Purifier", category: "UV + UF Water Purifier", brand: "Aquaguard", price: 14490, originalPrice: 17000, image: "/images/product16.png", tag: "Popular", stock: 22 },
  { name: "Water Purifier 1/4 Connector", category: "Water Purifier Accessories", brand: "Generic", price: 20, originalPrice: 35, image: "/images/product17.png", tag: "Popular", stock: 500 },
  { name: "KENT Bathroom Water Softener", category: "Water Softeners", brand: "Kent", price: 14400, originalPrice: 18000, image: "/images/product-18.png", tag: "Popular", stock: 12 },
];

(async () => {
  try {
    await connectDB();
    const count = await Product.countDocuments();
    if (count > 0) {
      console.log(`⚠  Products collection has ${count} docs. Clearing…`);
      await Product.deleteMany({});
    }
    const created = await Product.insertMany(seed);
    console.log(`✔ Seeded ${created.length} products.`);
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
})();
