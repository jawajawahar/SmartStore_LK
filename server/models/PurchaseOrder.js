const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    sku: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
    },

    buyingPrice: {
      type: Number,
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "shipped", "completed", "cancelled"],
      default: "pending",
    },

    pdfPath: {
      type: String,
      default: "",
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    shippedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
purchaseOrderSchema.index({ supplier: 1 });
purchaseOrderSchema.index({ product: 1 });
purchaseOrderSchema.index({ token: 1 });
purchaseOrderSchema.index({ status: 1 });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
