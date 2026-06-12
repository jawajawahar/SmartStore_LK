const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Debt = require("../models/Debt");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");

// Create Sale
const createSale = async (req, res) => {
  try {
    const {
      customer,
      items,
      totalAmount,
      paidAmount,
      paymentMethod,
      discountType,
      discountValue,
      discountAmount,
      taxRate,
      taxAmount,
      netAmount,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const total = Number(totalAmount);
    const rawPaid = Number(paidAmount) || 0;
    const discount = Number(discountAmount) || 0;
    const tax = Number(taxAmount) || 0;
    const net = Number(netAmount) || total;
    const remainingAmount = Math.max(0, net - rawPaid);
    const paid = remainingAmount > 0 ? rawPaid : net;

    // Validate outstanding balance restrictions: if there is any unpaid amount, a registered customer is required
    if (remainingAmount > 0 && !customer) {
      return res.status(400).json({
        message: "Registered Customer is required when there is an outstanding balance / unpaid amount.",
      });
    }

    // Validate stock levels before writing to DB
    for (const item of items) {
      const prod = await Product.findById(item.product);
      if (!prod) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${prod.name}". Available: ${prod.stock} ${prod.unit}, Cart: ${item.quantity} ${prod.unit}`,
        });
      }
    }

    // Fetch customer name for transaction logging
    let customerName = "Walk-in Customer";
    if (customer) {
      const customerDoc = await Customer.findById(customer);
      if (customerDoc) {
        customerName = customerDoc.name;
      }
    }

    // Create Sale
    const sale = new Sale({
      customer: customer || null,
      items,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remainingAmount,
      paymentMethod,
      discountType: discountType || null,
      discountValue: Number(discountValue) || 0,
      discountAmount: discount,
      taxRate: Number(taxRate) || 0,
      taxAmount: tax,
      netAmount: net,
    });

    await sale.save();

    // Create Transaction for the payment received
    if (paid > 0) {
      const txPaymentMethod =
        paymentMethod === "partial" || paymentMethod === "credit" ? "cash" : paymentMethod;

      await Transaction.create({
        type: "sale",
        title: "POS Sale",
        personName: customerName,
        amount: paid,
        flow: "income",
        paymentMethod: txPaymentMethod,
        description: `POS billing payment — ${items.length} item(s)`,
        sale: sale._id,
      });
    }

    // Reduce Product Stock & Remove if stock becomes 0
    for (const item of items) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: { stock: -item.quantity },
        },
        { new: true }
      );

      if (updatedProduct && updatedProduct.stock <= 0) {
        await Product.findByIdAndDelete(item.product);
        console.log(`Product "${updatedProduct.name}" automatically removed because stock reached 0.`);
      }
    }

    // Create Debt if needed (any transaction with remaining balance)
    if (remainingAmount > 0) {
      // Always create a new distinct pending debt record for each sale (not merged)
      await Debt.create({
        customer,
        sale: sale._id,
        description: `POS Invoice Debt — ${items.length} item(s)`,
        totalAmount: net,
        paidAmount: paid,
        remainingAmount,
        status: "pending",
      });

      // Update customer's total debt balance
      if (customer) {
        await Customer.findByIdAndUpdate(customer, {
          $inc: {
            currentDebt: remainingAmount,
          },
        });
      }
    }

    res.status(201).json({
      message: "Sale completed successfully",
      sale,
    });
  } catch (error) {
    console.error("CREATE SALE ERROR:", error);
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

// Get Single Sale
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("customer")
      .populate("items.product");

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.status(200).json(sale);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
};
