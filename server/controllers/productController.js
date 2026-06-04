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

// GET PRODUCTS
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({
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
};
