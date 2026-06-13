const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    payableAmount: {
      type: Number,
      default: 0,
    },

    notificationPreference: {
      type: String,
      enum: ["email", "sms", "whatsapp", "all", "none"],
      default: "email",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Supplier", supplierSchema);
