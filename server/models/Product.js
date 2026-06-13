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

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },

    lastRestockAlertSent: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to auto-generate SKU
productSchema.pre("save", async function () {
  if (!this.sku) {
    const lastProduct = await mongoose
      .model("Product")
      .findOne({ sku: /^SKU-\d+$/ })
      .sort({ sku: -1 });

    let nextNum = 1;
    if (lastProduct && lastProduct.sku) {
      const match = lastProduct.sku.match(/^SKU-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    let skuCandidate = `SKU-${String(nextNum).padStart(6, "0")}`;
    let exists = await mongoose.model("Product").findOne({ sku: skuCandidate });
    while (exists) {
      nextNum++;
      skuCandidate = `SKU-${String(nextNum).padStart(6, "0")}`;
      exists = await mongoose.model("Product").findOne({ sku: skuCandidate });
    }

    this.sku = skuCandidate;
  }
});

// Indexes
productSchema.index({ barcode: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ supplier: 1 });

module.exports = mongoose.model("Product", productSchema);
