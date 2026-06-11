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

      // NEW
      productType,
      unit,
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

      // NEW
      productType,
      unit,
    });

    await product.save();

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

    // Fetch current product count to start sequential SKU generation
    const count = await Product.countDocuments();
    let currentCount = count;

    // Validate required fields per row
    const errors = [];
    const validRows = [];

    products.forEach((row, idx) => {
      const missing = [];
      if (!row.name) missing.push("name");
      if (row.buyingPrice === undefined || row.buyingPrice === "") missing.push("buyingPrice");
      if (row.sellingPrice === undefined || row.sellingPrice === "") missing.push("sellingPrice");
      if (row.stock === undefined || row.stock === "") missing.push("stock");

      if (missing.length > 0) {
        errors.push({ row: idx + 1, name: row.name || "(unnamed)", missing });
      } else {
        currentCount++;
        const sku = row.sku ? row.sku.trim() : `SKU-${String(currentCount).padStart(6, "0")}`;
        
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
    });

    let inserted = [];
    if (validRows.length > 0) {
      inserted = await Product.insertMany(validRows, { ordered: false });
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
    
    const products = await Product.find(filter).sort({
      createdAt: -1,
    });

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

      // NEW
      productType,
      unit,
    } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        buyingPrice,
        sellingPrice,
        bulkPrice,
        stock,
        barcode,

        // NEW
        productType,
        unit,
      },
      {
        new: true,
      },
    );

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
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Product Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  bulkAddProducts,
};
