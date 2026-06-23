const Supplier = require("../models/Supplier");
const SupplierPayable = require("../models/SupplierPayable");
const Product = require("../models/Product");

// Add Supplier
const addSupplier = async (req, res) => {
  try {
    const { name, company, phone, email, address, notificationPreference } = req.body;

    const supplier = new Supplier({
      name,
      company,
      phone,
      email,
      address,
      notificationPreference,
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
          email: row.email ? row.email.trim() : "",
          address: row.address ? row.address.trim() : "",
          payableAmount: row.payableAmount ? Number(row.payableAmount) : 0,
          notificationPreference: row.notificationPreference ? row.notificationPreference.trim().toLowerCase() : "email",
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
    const { name, company, phone, email, address, notificationPreference } = req.body;
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    supplier.name = name || supplier.name;
    supplier.company = company !== undefined ? company : supplier.company;
    supplier.phone = phone || supplier.phone;
    supplier.email = email !== undefined ? email : supplier.email;
    supplier.address = address !== undefined ? address : supplier.address;
    supplier.notificationPreference = notificationPreference !== undefined ? notificationPreference : supplier.notificationPreference;

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

// Bulk Delete Suppliers
const bulkDeleteSuppliers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No supplier IDs provided for deletion" });
    }

    const suppliersToDelete = await Supplier.find({ _id: { $in: ids } });
    if (suppliersToDelete.length === 0) {
      return res.status(404).json({ message: "No suppliers found to delete" });
    }

    const deletedCount = suppliersToDelete.length;
    await Supplier.deleteMany({ _id: { $in: ids } });

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "delete",
      entity: "Supplier",
      description: `Bulk deleted ${deletedCount} supplier(s). Names: [${suppliersToDelete.map(s => s.name).join(", ")}]`,
    });

    res.status(200).json({
      message: `${deletedCount} supplier(s) deleted successfully`,
      deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Supplier Products
const getSupplierProducts = async (req, res) => {
  try {
    const products = await Product.find({ supplier: req.params.id })
      .select("name sku stock buyingPrice sellingPrice unit")
      .sort({ createdAt: -1 });
    res.status(200).json(products);
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
  bulkDeleteSuppliers,
  getSupplierProducts,
};
