const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "Uncategorized",
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
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

    // Product Type
    productType: {
      type: String,
      enum: ["fixed", "weighted"],
      default: "fixed",
    },

    // Unit
    unit: {
      type: String,
      default: "pcs",
    },

    // SKU Auto-generated
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Stock level thresholds
    minStockLevel: {
      type: Number,
      default: 5,
    },

    maxStockLevel: {
      type: Number,
      default: 1000,
    },

    // Tracking flags
    expiryTracking: {
      type: Boolean,
      default: false,
    },

    batchTracking: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to auto-generate SKU
productSchema.pre("save", async function () {
  if (!this.sku) {
    const count = await mongoose.model("Product").countDocuments();
    this.sku = `SKU-${String(count + 1).padStart(6, "0")}`;
  }
});

// Indexes
productSchema.index({ barcode: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });

module.exports = mongoose.model("Product", productSchema);
