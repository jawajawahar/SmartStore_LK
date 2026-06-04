const Debt = require("../models/Debt");

const Customer = require("../models/Customer");

const Transaction = require("../models/Transaction");

const Sale = require("../models/Sale");

// Add Debt
const addDebt = async (req, res) => {
  try {
    const { customer, description, totalAmount, paidAmount } = req.body;

    const remainingAmount = totalAmount - paidAmount;

    const debt = new Debt({
      customer,
      description,
      totalAmount,
      paidAmount,
      remainingAmount,
      status: remainingAmount === 0 ? "paid" : "pending",
    });

    await debt.save();

    // Update Related Sale
    if (debt.sale) {
      const sale = await Sale.findById(debt.sale);

      if (sale) {
        sale.paidAmount += Number(amount);

        sale.remainingAmount = sale.totalAmount - sale.paidAmount;

        await sale.save();
      }
    }

    // Update customer debt
    await Customer.findByIdAndUpdate(customer, {
      $inc: {
        currentDebt: remainingAmount,
      },
    });

    res.status(201).json({
      message: "Debt record added",
      debt,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Debts
const getDebts = async (req, res) => {
  try {
    const debts = await Debt.find().populate("customer").sort({
      createdAt: -1,
    });

    res.status(200).json(debts);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Pay Debt
const payDebt = async (req, res) => {
  try {
    const { amount } = req.body;

    const debt = await Debt.findById(req.params.id).populate("customer");

    if (!debt) {
      return res.status(404).json({
        message: "Debt not found",
      });
    }

    // Update amounts
    debt.paidAmount += Number(amount);

    debt.remainingAmount = debt.totalAmount - debt.paidAmount;

    // Status
    if (debt.remainingAmount <= 0) {
      debt.status = "paid";

      debt.remainingAmount = 0;
    }

    await debt.save();

    // Create Transaction
    await Transaction.create({
      type: "debt_payment",

      title: "Customer Debt Payment",

      personName: debt.customer?.name || "Customer",

      amount: Number(amount),

      flow: "income",

      paymentMethod: "cash",

      description: "Debt settlement received",

      sale: debt.sale,
    });

    // Update customer debt
    await Customer.findByIdAndUpdate(debt.customer._id, {
      $inc: {
        currentDebt: -Number(amount),
      },
    });

    res.status(200).json({
      message: "Payment added",
      debt,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addDebt,
  getDebts,
  payDebt,
};
