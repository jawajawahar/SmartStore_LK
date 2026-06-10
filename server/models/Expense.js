const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["rent", "utilities", "salaries", "transport", "marketing", "supplies", "misc"],
      default: "misc",
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer"],
      default: "cash",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
