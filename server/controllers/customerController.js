const Customer = require("../models/Customer");

// Add Customer
const addCustomer = async (req, res) => {
  try {
    const { name, phone, address, customerType } = req.body;

    const customer = new Customer({
      name,
      phone,
      address,
      customerType,
    });

    await customer.save();

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "create",
      entity: "Customer",
      entityId: customer._id,
      description: `Customer "${customer.name}" added (Phone: ${customer.phone || "N/A"}, Type: ${customer.customerType || "normal"}).`,
    }).catch(err => console.error("Customer create audit failed:", err));

    res.status(201).json({
      message: "Customer added successfully",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({
      createdAt: -1,
    });

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    customer.name = req.body.name || customer.name;

    customer.phone = req.body.phone || customer.phone;

    customer.address = req.body.address || customer.address;

    await customer.save();

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "update",
      entity: "Customer",
      entityId: customer._id,
      description: `Customer "${customer.name}" updated (Phone: ${customer.phone}, Address: ${customer.address || "N/A"}).`,
    }).catch(err => console.error("Customer update audit failed:", err));

    res.status(200).json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const customerName = customer.name;
    const customerPhone = customer.phone;
    await customer.deleteOne();

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "delete",
      entity: "Customer",
      entityId: req.params.id,
      description: `Customer "${customerName}" (Phone: ${customerPhone}) deleted.`,
    }).catch(err => console.error("Customer delete audit failed:", err));

    res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Bulk Add Customers
const bulkAddCustomers = async (req, res) => {
  try {
    const { customers } = req.body;

    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ message: "No customer data provided" });
    }

    const errors = [];
    const validRows = [];

    customers.forEach((row, idx) => {
      const missing = [];
      if (!row.name) missing.push("name");
      if (!row.phone) missing.push("phone");

      if (missing.length > 0) {
        errors.push({ row: idx + 1, name: row.name || "(unnamed)", missing });
      } else {
        validRows.push({
          name: row.name.trim(),
          phone: String(row.phone).trim(),
          address: row.address ? row.address.trim() : "",
          customerType: row.customerType && ["normal", "bulk"].includes(row.customerType.trim().toLowerCase()) 
            ? row.customerType.trim().toLowerCase() 
            : "normal",
          currentDebt: row.currentDebt ? Number(row.currentDebt) : 0,
        });
      }
    });

    let inserted = [];
    if (validRows.length > 0) {
      inserted = await Customer.insertMany(validRows, { ordered: false });
    }

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "create",
      entity: "Customer",
      description: `Bulk import: ${inserted.length} customer(s) added. Names: [${inserted.map(c => c.name).join(", ")}].`,
    }).catch(err => console.error("Customer bulk audit failed:", err));

    res.status(201).json({
      message: `${inserted.length} customer(s) imported successfully`,
      inserted: inserted.length,
      errors,
    });
  } catch (error) {
    console.error("BULK ADD CUSTOMERS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// BULK DELETE CUSTOMERS
const bulkDeleteCustomers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No customer IDs provided for deletion" });
    }

    const customersToDelete = await Customer.find({ _id: { $in: ids } });
    if (customersToDelete.length === 0) {
      return res.status(404).json({ message: "No customers found to delete" });
    }

    const deletedCount = customersToDelete.length;
    await Customer.deleteMany({ _id: { $in: ids } });

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "delete",
      entity: "Customer",
      description: `Bulk deleted ${deletedCount} customer(s). Names: [${customersToDelete.map(c => c.name).join(", ")}]`,
    });

    res.status(200).json({
      message: `${deletedCount} customer(s) deleted successfully`,
      deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE CUSTOMERS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  bulkAddCustomers,
  bulkDeleteCustomers,
};
