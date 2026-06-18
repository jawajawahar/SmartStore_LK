const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "sale",
        "debt_payment",
        "supplier_payment",
        "supplier_purchase",
        "expense",
        "income",
        "refund",
        "return",
      ],
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

    expense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
    },

    category: {
      type: String,
      default: "general",
    },

    description: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true },
);

// Indexes for performance
transactionSchema.index({ flow: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ category: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
