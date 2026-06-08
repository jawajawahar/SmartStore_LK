const mongoose = require("mongoose");
const Product = require("./models/Product");
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const count = await Product.countDocuments();
    console.log("Total Products:", count);
    const lastProducts = await Product.find().sort({ createdAt: -1 }).limit(3);
    console.log("Latest Products:", lastProducts);
  } catch (err) {
    console.log(err);
  } finally {
    mongoose.connection.close();
  }
});
