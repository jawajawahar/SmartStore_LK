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

    await customer.deleteOne();

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

module.exports = {
  addCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  bulkAddCustomers,
};
