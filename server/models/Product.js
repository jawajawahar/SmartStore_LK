const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
    },

    buyingPrice: {
      type: Number,
      required: true,
    },

    sellingPrice: {
      type: Number,
      required: true,
    },

    bulkPrice: {
      type: Number,
    },

    stock: {
      type: Number,
      required: true,
    },

    barcode: {
      type: String,
    },

    image: {
      type: String,
    },

    // NEW
    productType: {
      type: String,

      enum: ["fixed", "weighted"],

      default: "fixed",
    },

    // NEW
    unit: {
      type: String,

      default: "pcs",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Product", productSchema);
