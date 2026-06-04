const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["sale", "debt_payment", "supplier_payment", "supplier_purchase"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    personName: {
      type: String,
    },

    amount: {
      type: Number,
      required: true,
    },

    flow: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },

    paymentMethod: {
      type: String,
      default: "cash",
    },

    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
    },

    description: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Transaction", transactionSchema);
