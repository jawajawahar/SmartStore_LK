const Supplier = require("../models/Supplier");
const SupplierPayable = require("../models/SupplierPayable");

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

      // Create SupplierPayable records for imported suppliers with payableAmount > 0
      const payablesToCreate = inserted
        .filter((s) => s.payableAmount > 0)
        .map((s) => ({
          supplier: s._id,
          description: "Imported outstanding balance",
          totalAmount: s.payableAmount,
          paidAmount: 0,
          remainingAmount: s.payableAmount,
          status: "pending",
        }));

      if (payablesToCreate.length > 0) {
        await SupplierPayable.insertMany(payablesToCreate);
      }
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

// Update Supplier
const updateSupplier = async (req, res) => {
  try {
    const { name, company, phone, address } = req.body;
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    supplier.name = name || supplier.name;
    supplier.company = company !== undefined ? company : supplier.company;
    supplier.phone = phone || supplier.phone;
    supplier.address = address !== undefined ? address : supplier.address;

    await supplier.save();
    res.status(200).json({ message: "Supplier updated successfully", supplier });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Supplier
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    await supplier.deleteOne();
    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addSupplier,
  getSuppliers,
  bulkAddSuppliers,
  updateSupplier,
  deleteSupplier,
};
