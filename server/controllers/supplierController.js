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

// Bulk Add Suppliers
const bulkAddSuppliers = async (req, res) => {
  try {
    const { suppliers } = req.body;

    if (!Array.isArray(suppliers) || suppliers.length === 0) {
      return res.status(400).json({ message: "No supplier data provided" });
    }

    const errors = [];
    const validRows = [];

    suppliers.forEach((row, idx) => {
      const missing = [];
      if (!row.name) missing.push("name");
      if (!row.phone) missing.push("phone");

      if (missing.length > 0) {
        errors.push({ row: idx + 1, name: row.name || "(unnamed)", missing });
      } else {
        validRows.push({
          name: row.name.trim(),
          company: row.company ? row.company.trim() : "",
          phone: String(row.phone).trim(),
          address: row.address ? row.address.trim() : "",
          payableAmount: row.payableAmount ? Number(row.payableAmount) : 0,
        });
      }
    });

    let inserted = [];
    if (validRows.length > 0) {
      inserted = await Supplier.insertMany(validRows, { ordered: false });
    }

    res.status(201).json({
      message: `${inserted.length} supplier(s) imported successfully`,
      inserted: inserted.length,
      errors,
    });
  } catch (error) {
    console.error("BULK ADD SUPPLIERS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addSupplier,
  getSuppliers,
  bulkAddSuppliers,
};
