require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const { checkAndNotifyRestock } = require("./utils/restockNotifier");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Find a product with a supplier that has whatsapp enabled
  const product = await Product.findOne({ stock: { $lte: 5 } }).populate("supplier");
  if (product) {
    if (product.supplier) {
      product.supplier.notificationPreference = "whatsapp";
    }
    console.log(`Testing restock for: ${product.name}, stock: ${product.stock}`);
    try {
      const result = await checkAndNotifyRestock(product, { force: true });
      console.log("Result:", result);
    } catch (err) {
      console.error("Error:", err);
    }
  } else {
    console.log("No low stock product found");
  }
  process.exit(0);
});
