const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
  {
    originalSale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
        },
        price: Number,
        total: Number,
      },
    ],
    reason: {
      type: String,
      default: "",
    },
    refundAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "pending"],
      default: "completed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Return", returnSchema);
