const SupplierPayable = require("../models/SupplierPayable");

const Supplier = require("../models/Supplier");

const Transaction = require("../models/Transaction");

// Add Payable
const addPayable = async (req, res) => {
  try {
    const { supplier, description, totalAmount, paidAmount } = req.body;

    const remainingAmount = totalAmount - paidAmount;

    const payable = new SupplierPayable({
      supplier,
      description,
      totalAmount,
      paidAmount,
      remainingAmount,
      status: remainingAmount === 0 ? "paid" : "pending",
    });

    await payable.save();

    // Update supplier payable
    await Supplier.findByIdAndUpdate(supplier, {
      $inc: {
        payableAmount: remainingAmount,
      },
    });

    res.status(201).json({
      message: "Supplier payable added",
      payable,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Payables
const getPayables = async (req, res) => {
  try {
    const payables = await SupplierPayable.find().populate("supplier").sort({
      createdAt: -1,
    });

    res.status(200).json(payables);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Pay Supplier
const paySupplier = async (req, res) => {
  try {
    const { amount } = req.body;

    const payable = await SupplierPayable.findById(req.params.id).populate(
      "supplier",
    );

    if (!payable) {
      return res.status(404).json({
        message: "Payable not found",
      });
    }

    // Update amounts
    payable.paidAmount += Number(amount);

    payable.remainingAmount = payable.totalAmount - payable.paidAmount;

    // Status
    if (payable.remainingAmount <= 0) {
      payable.status = "paid";

      payable.remainingAmount = 0;
    }

    await payable.save();

    // Create Transaction
    await Transaction.create({
      type: "supplier_payment",

      title: "Supplier Payment",

      personName: payable.supplier?.name || "Supplier",

      amount: Number(amount),

      flow: "expense",

      paymentMethod: "cash",

      description: "Supplier settlement payment",
    });

    // Update supplier payable
    await Supplier.findByIdAndUpdate(payable.supplier._id, {
      $inc: {
        payableAmount: -Number(amount),
      },
    });

    res.status(200).json({
      message: "Supplier payment added",
      payable,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Payable
const updatePayable = async (req, res) => {
  try {
    const { description, totalAmount, paidAmount } = req.body;
    const payable = await SupplierPayable.findById(req.params.id);

    if (!payable) {
      return res.status(404).json({ message: "Payable not found" });
    }

    const newTotal = totalAmount !== undefined ? Number(totalAmount) : payable.totalAmount;
    const newPaid = paidAmount !== undefined ? Number(paidAmount) : payable.paidAmount;
    const newRemaining = newTotal - newPaid;

    const remainingDiff = newRemaining - payable.remainingAmount;

    payable.description = description !== undefined ? description : payable.description;
    payable.totalAmount = newTotal;
    payable.paidAmount = newPaid;
    payable.remainingAmount = newRemaining;
    payable.status = newRemaining <= 0 ? "paid" : "pending";

    await payable.save();

    // Update supplier's payable amount
    if (remainingDiff !== 0) {
      await Supplier.findByIdAndUpdate(payable.supplier, {
        $inc: { payableAmount: remainingDiff },
      });
    }

    res.status(200).json({ message: "Supplier payable updated successfully", payable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Payable
const deletePayable = async (req, res) => {
  try {
    const payable = await SupplierPayable.findById(req.params.id);

    if (!payable) {
      return res.status(404).json({ message: "Payable not found" });
    }

    // Deduct remaining payable from supplier's balance
    if (payable.remainingAmount > 0) {
      await Supplier.findByIdAndUpdate(payable.supplier, {
        $inc: { payableAmount: -payable.remainingAmount },
      });
    }

    await payable.deleteOne();
    res.status(200).json({ message: "Supplier payable deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addPayable,
  getPayables,
  paySupplier,
  updatePayable,
  deletePayable,
};
