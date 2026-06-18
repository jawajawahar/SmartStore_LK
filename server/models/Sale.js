const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },

        name: String,

        quantity: Number,

        price: Number,

        total: Number,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      required: true,
    },

    remainingAmount: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "partial", "credit"],
      default: "cash",
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed", null],
      default: null,
    },

    discountValue: {
      type: Number,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    taxRate: {
      type: Number,
      default: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    netAmount: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Sale", saleSchema);
