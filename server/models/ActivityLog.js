const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userName: {
      type: String,
      required: true,
    },

    userRole: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "login",
        "logout",
        "sale",
        "product_add",
        "product_update",
        "product_delete",
        "stock_update",
        "customer_add",
        "customer_update",
        "debt_payment",
        "supplier_add",
        "supplier_payment",
        "category_add",
        "category_update",
        "brand_add",
        "brand_update",
        "user_add",
        "settings_change",
        "other",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true },
);

// Indexes for filtering and querying
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ type: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
