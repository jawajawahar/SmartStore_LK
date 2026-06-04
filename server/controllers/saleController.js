const Sale = require("../models/Sale");

const Product = require("../models/Product");

const Debt = require("../models/Debt");

const Customer = require("../models/Customer");

const Transaction = require("../models/Transaction");

// Create Sale
const createSale = async (req, res) => {
  try {
    const { customer, items, totalAmount, paidAmount, paymentMethod } =
      req.body;

    const remainingAmount = totalAmount - paidAmount;

    // Create Sale
    const sale = new Sale({
      customer,
      items,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentMethod,
    });

    await sale.save();

    // Create Transaction
    await Transaction.create({
      type: "sale",

      title: "POS Sale",

      personName: customer?.name || "Walk-in Customer",

      amount: paidAmount,

      flow: "income",

      paymentMethod,

      description: "POS billing payment",

      sale: sale._id,
    });

    // Reduce Product Stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          stock: -item.quantity,
        },
      });
    }

    // Create Debt if needed
    if (paymentMethod === "partial" || paymentMethod === "credit") {
      await Debt.create({
        customer,

        sale: sale._id,

        description: "POS Invoice Debt",

        totalAmount,

        paidAmount,

        remainingAmount: totalAmount - paidAmount,

        status: totalAmount - paidAmount === 0 ? "paid" : "pending",
      });
    }

    res.status(201).json({
      message: "Sale completed successfully",
      sale,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Sales
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("customer")
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createSale,
  getSales,
};
