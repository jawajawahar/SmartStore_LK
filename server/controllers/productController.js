const Product = require("../models/Product");

// ADD PRODUCT
const addProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      buyingPrice,
      sellingPrice,
      bulkPrice,
      stock,
      barcode,
      productType,
      unit,
      supplier,
      minStockLevel,
    } = req.body;

    const image = req.file ? req.file.path : "";

    const product = new Product({
      name,
      category,
      buyingPrice,
      sellingPrice,
      bulkPrice,
      stock,
      barcode,
      image,
      productType,
      unit,
      supplier: supplier || null,
      minStockLevel: minStockLevel ? Number(minStockLevel) : undefined,
    });

    await product.save();

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "create",
      entity: "Product",
      entityId: product._id,
      description: `Product "${product.name}" created with selling price Rs. ${product.sellingPrice} and stock ${product.stock}.`,
    });

    res.status(201).json({
      message: "Product Added Successfully",

      product,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// BULK ADD PRODUCTS
const bulkAddProducts = async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "No product data provided" });
    }

    // Find highest SKU format in database to start sequential SKU generation
    const lastProduct = await Product.findOne({ sku: /^SKU-\d+$/ }).sort({ sku: -1 });
    let nextNum = 1;
    if (lastProduct && lastProduct.sku) {
      const match = lastProduct.sku.match(/^SKU-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    // Validate required fields per row
    const errors = [];
    const validRows = [];
    const usedSkusInBatch = new Set();

    for (let idx = 0; idx < products.length; idx++) {
      const row = products[idx];
      const missing = [];
      if (!row.name) missing.push("name");
      if (row.buyingPrice === undefined || row.buyingPrice === "") missing.push("buyingPrice");
      if (row.sellingPrice === undefined || row.sellingPrice === "") missing.push("sellingPrice");
      if (row.stock === undefined || row.stock === "") missing.push("stock");

      if (missing.length > 0) {
        errors.push({ row: idx + 1, name: row.name || "(unnamed)", missing });
      } else {
        let sku = row.sku ? row.sku.trim() : "";
        if (!sku) {
          // Find next available SKU
          let skuCandidate = `SKU-${String(nextNum).padStart(6, "0")}`;
          let exists = await Product.findOne({ sku: skuCandidate });
          while (exists || usedSkusInBatch.has(skuCandidate)) {
            nextNum++;
            skuCandidate = `SKU-${String(nextNum).padStart(6, "0")}`;
            exists = await Product.findOne({ sku: skuCandidate });
          }
          sku = skuCandidate;
          nextNum++;
        }
        usedSkusInBatch.add(sku);

        validRows.push({
          name: row.name.trim(),
          category: row.category || "Uncategorized",
          buyingPrice: Number(row.buyingPrice),
          sellingPrice: Number(row.sellingPrice),
          bulkPrice: row.bulkPrice ? Number(row.bulkPrice) : undefined,
          stock: Number(row.stock),
          barcode: row.barcode || undefined,
          unit: row.unit || "pcs",
          productType: row.productType || "fixed",
          sku,
        });
      }
    }

    let inserted = [];
    if (validRows.length > 0) {
      inserted = await Product.insertMany(validRows, { ordered: false });

      const { logAudit } = require("../utils/auditLogger");
      await logAudit({
        req,
        action: "create",
        entity: "Product",
        description: `Bulk imported ${inserted.length} product(s) via file upload.`,
      });
    }

    res.status(201).json({
      message: `${inserted.length} product(s) imported successfully`,
      inserted: inserted.length,
      errors,
    });
  } catch (error) {
    console.error("BULK ADD PRODUCTS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET PRODUCTS
const getProducts = async (req, res) => {
  try {
    const { barcode } = req.query;
    const filter = barcode ? { barcode: barcode.trim() } : {};
    
    let products = await Product.find(filter).populate("supplier").sort({
      createdAt: -1,
    });

    // Strip buyingPrice if user doesn't have view_purchase_prices permission
    const hasPurchasePrice = req.user.role === "admin" || (req.user.permissions && req.user.permissions.includes("view_purchase_prices"));
    if (!hasPurchasePrice) {
      products = products.map(p => {
        const productObj = p.toObject();
        delete productObj.buyingPrice;
        return productObj;
      });
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      buyingPrice,
      sellingPrice,
      bulkPrice,
      stock,
      barcode,
      productType,
      unit,
      supplier,
      minStockLevel,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const resolvedMinStock = minStockLevel !== undefined ? Number(minStockLevel) : product.minStockLevel;
    const resolvedStock = stock !== undefined ? Number(stock) : product.stock;

    const updateData = {
      name,
      category,
      buyingPrice,
      sellingPrice,
      bulkPrice,
      stock,
      barcode,
      productType,
      unit,
      supplier: supplier || null,
      minStockLevel: minStockLevel ? Number(minStockLevel) : undefined,
    };

    // If restocked above the minimum level, reset the restock alert timestamp
    if (resolvedStock > resolvedMinStock) {
      updateData.lastRestockAlertSent = null;
    }

    const oldSellingPrice = product.sellingPrice;
    const oldStock = product.stock;
    const oldBuyingPrice = product.buyingPrice;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
      },
    ).populate("supplier");

    // Check changes and log audit
    if (updatedProduct) {
      const changes = {};
      const descriptionParts = [];

      if (sellingPrice !== undefined && Number(sellingPrice) !== oldSellingPrice) {
        changes.sellingPrice = { old: oldSellingPrice, new: Number(sellingPrice) };
        descriptionParts.push(`selling price from Rs. ${oldSellingPrice} to Rs. ${sellingPrice}`);
      }
      if (stock !== undefined && Number(stock) !== oldStock) {
        changes.stock = { old: oldStock, new: Number(stock) };
        descriptionParts.push(`stock from ${oldStock} to ${stock}`);
      }
      if (buyingPrice !== undefined && Number(buyingPrice) !== oldBuyingPrice) {
        changes.buyingPrice = { old: oldBuyingPrice, new: Number(buyingPrice) };
        descriptionParts.push(`buying price from Rs. ${oldBuyingPrice} to Rs. ${buyingPrice}`);
      }

      if (descriptionParts.length > 0) {
        const { logAudit } = require("../utils/auditLogger");
        await logAudit({
          req,
          action: "update",
          entity: "Product",
          entityId: updatedProduct._id,
          changes,
          description: `Product "${updatedProduct.name}" updated: ${descriptionParts.join(", ")}.`,
        });
      }
    }

    // Check and send restock warning if inventory falls below safety limit
    if (updatedProduct) {
      const { checkAndNotifyRestock } = require("../utils/restockNotifier");
      checkAndNotifyRestock(updatedProduct).catch(err => {
        console.error("Restock alert background trigger error:", err);
      });
    }

    if (updatedProduct && updatedProduct.stock <= 0) {
      await Product.findByIdAndDelete(updatedProduct._id);
      return res.status(200).json({
        message: "Product stock reached 0 and was automatically removed from the system",
        deleted: true,
        productId: req.params.id,
      });
    }

    res.status(200).json({
      message: "Product Updated Successfully",
      updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndDelete(req.params.id);

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "delete",
      entity: "Product",
      entityId: product._id,
      description: `Product "${product.name}" (SKU: ${product.sku}) manually deleted from system.`,
    });

    res.status(200).json({
      message: "Product Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// MANUAL TRIGGER RESTOCK ALERT
const triggerProductRestockAlert = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { checkAndNotifyRestock } = require("../utils/restockNotifier");
    const result = await checkAndNotifyRestock(product, { force: true });

    res.status(200).json({
      message: "Restock alert notification triggered successfully",
      channels: result ? result.channels : [],
    });
  } catch (error) {
    console.error("Manual restock alert trigger error:", error);
    res.status(500).json({
      message: error.message || "Failed to trigger restock alert",
    });
  }
};

// BULK DELETE PRODUCTS
const bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No product IDs provided for deletion" });
    }

    const productsToDelete = await Product.find({ _id: { $in: ids } });
    if (productsToDelete.length === 0) {
      return res.status(404).json({ message: "No products found to delete" });
    }

    const deletedCount = productsToDelete.length;
    await Product.deleteMany({ _id: { $in: ids } });

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "delete",
      entity: "Product",
      description: `Bulk deleted ${deletedCount} product(s).`,
    });

    res.status(200).json({
      message: `${deletedCount} product(s) deleted successfully`,
      deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE PRODUCTS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  bulkAddProducts,
  bulkDeleteProducts,
  triggerProductRestockAlert,
};
