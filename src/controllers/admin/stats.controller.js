import User from "../../models/User.js";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import ContactMessage from "../../models/ContactMessage.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/** GET /api/admin/stats — dashboard overview */
export const overview = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    userCount,
    productCount,
    orderCount,
    enquiryCount,
    newEnquiries,
    recentOrders,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    ContactMessage.countDocuments(),
    ContactMessage.countDocuments({ status: "new" }),
    Order.find().sort("-createdAt").limit(5).populate("user", "name phone"),
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, paymentStatus: { $ne: "refunded" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);

  res.json({
    counts: {
      users: userCount,
      products: productCount,
      orders: orderCount,
      enquiries: enquiryCount,
      newEnquiries,
    },
    revenue30d: revenueAgg[0]?.total || 0,
    recentOrders,
  });
});
