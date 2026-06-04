const Supplier = require("../models/Supplier");

// Add Supplier
const addSupplier = async (req, res) => {
  try {
    const { name, company, phone, address } = req.body;

    const supplier = new Supplier({
      name,
      company,
      phone,
      address,
    });

    await supplier.save();

    res.status(201).json({
      message: "Supplier added successfully",
      supplier,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Suppliers
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({
      createdAt: -1,
    });

    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addSupplier,
  getSuppliers,
};
