const Debt = require("../models/Debt");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
const Sale = require("../models/Sale");

// Add Debt
const addDebt = async (req, res) => {
  try {
    const { customer, description, totalAmount, paidAmount, sale } = req.body;

    const total = Number(totalAmount);
    const paid = Number(paidAmount) || 0;
    const remainingAmount = total - paid;

    let debt = new Debt({
      customer,
      description,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
      sale: sale || null,
      status: remainingAmount > 0 ? "pending" : "paid",
      user: req.user.id,
    });
    await debt.save();

    // Update Related Sale if linked
    if (sale) {
      const linkedSale = await Sale.findById(sale);
      if (linkedSale) {
        linkedSale.paidAmount += paid;
        linkedSale.remainingAmount = Math.max(0, linkedSale.totalAmount - linkedSale.paidAmount);
        await linkedSale.save();
      }
    }

    // Update customer debt balance
    if (remainingAmount > 0) {
      await Customer.findByIdAndUpdate(customer, {
        $inc: {
          currentDebt: remainingAmount,
        },
      });
    }

    // Create income transaction if any payment was made upfront
    if (paid > 0) {
      const customerDoc = await Customer.findById(customer);
      await Transaction.create({
        type: "debt_payment",
        title: "Debt Upfront Payment",
        personName: customerDoc?.name || "Customer",
        amount: paid,
        flow: "income",
        paymentMethod: "cash",
        description: `Upfront payment for: ${description}`,
        sale: sale || null,
        user: req.user.id,
      });
    }

    res.status(201).json({
      message: "Debt record processed successfully",
      debt,
    });

    const { logAudit } = require("../utils/auditLogger");
    logAudit({
      req,
      action: "create",
      entity: "Debt",
      entityId: debt._id,
      description: `Debt record created. Total: Rs.${total.toLocaleString()}, Paid upfront: Rs.${paid.toLocaleString()}, Remaining: Rs.${remainingAmount.toLocaleString()}. Description: "${description}".`,
    }).catch(err => console.error("Debt create audit failed:", err));
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
    const payAmount = Number(amount);

    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({
        message: "Invalid payment amount",
      });
    }

    const debt = await Debt.findById(req.params.id).populate("customer");

    if (!debt) {
      return res.status(404).json({
        message: "Debt not found",
      });
    }

    if (debt.status === "paid") {
      return res.status(400).json({
        message: "Debt is already fully paid",
      });
    }

    // Cap payment at remaining amount
    const actualPayment = Math.min(payAmount, debt.remainingAmount);

    // Update amounts
    debt.paidAmount += actualPayment;
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;

    // Status
    if (debt.remainingAmount <= 0) {
      debt.status = "paid";
      debt.remainingAmount = 0;
    }

    await debt.save();

    // Update related sale if linked
    if (debt.sale) {
      const sale = await Sale.findById(debt.sale);
      if (sale) {
        sale.paidAmount += actualPayment;
        sale.remainingAmount = sale.totalAmount - sale.paidAmount;
        if (sale.remainingAmount <= 0) {
          sale.remainingAmount = 0;
          sale.paymentMethod = "cash";
        }
        await sale.save();
      }
    }

    // Create Transaction
    await Transaction.create({
      type: "debt_payment",
      title: "Customer Debt Payment",
      personName: debt.customer?.name || "Customer",
      amount: actualPayment,
      flow: "income",
      paymentMethod: "cash",
      description: `Debt settlement: ${debt.description}`,
      sale: debt.sale,
      user: req.user.id,
    });

    // Update customer debt
    await Customer.findByIdAndUpdate(debt.customer._id, {
      $inc: {
        currentDebt: -actualPayment,
      },
    });

    res.status(200).json({
      message: "Payment added",
      debt,
    });

    const { logAudit } = require("../utils/auditLogger");
    logAudit({
      req,
      action: "update",
      entity: "Debt",
      entityId: debt._id,
      description: `Debt payment of Rs.${actualPayment.toLocaleString()} received from "${debt.customer?.name || "Customer"}". Status: ${debt.status}. Remaining: Rs.${debt.remainingAmount.toLocaleString()}.`,
    }).catch(err => console.error("Debt payment audit failed:", err));
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Debt
const deleteDebt = async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);

    if (!debt) {
      return res.status(404).json({
        message: "Debt not found",
      });
    }

    // Restore customer debt balance
    if (debt.remainingAmount > 0) {
      await Customer.findByIdAndUpdate(debt.customer, {
        $inc: {
          currentDebt: -debt.remainingAmount,
        },
      });
    }

    const debtDesc = debt.description;
    const debtTotal = debt.totalAmount;
    const debtRemaining = debt.remainingAmount;
    await debt.deleteOne();

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "delete",
      entity: "Debt",
      entityId: req.params.id,
      description: `Debt record deleted. Description: "${debtDesc}". Total: Rs.${debtTotal.toLocaleString()}, Remaining was: Rs.${debtRemaining.toLocaleString()}.`,
    }).catch(err => console.error("Debt delete audit failed:", err));

    res.status(200).json({
      message: "Debt deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Debt
const updateDebt = async (req, res) => {
  try {
    const { description, totalAmount, paidAmount } = req.body;
    const debt = await Debt.findById(req.params.id);

    if (!debt) {
      return res.status(404).json({ message: "Debt record not found" });
    }

    const newTotal = totalAmount !== undefined ? Number(totalAmount) : debt.totalAmount;
    const newPaid = paidAmount !== undefined ? Number(paidAmount) : debt.paidAmount;
    const newRemaining = newTotal - newPaid;

    const remainingDiff = newRemaining - debt.remainingAmount;

    debt.description = description !== undefined ? description : debt.description;
    debt.totalAmount = newTotal;
    debt.paidAmount = newPaid;
    debt.remainingAmount = newRemaining;
    debt.status = newRemaining <= 0 ? "paid" : "pending";

    await debt.save();

    if (remainingDiff !== 0) {
      await Customer.findByIdAndUpdate(debt.customer, {
        $inc: { currentDebt: remainingDiff },
      });
    }

    res.status(200).json({ message: "Debt record updated successfully", debt });

    const { logAudit } = require("../utils/auditLogger");
    logAudit({
      req,
      action: "update",
      entity: "Debt",
      entityId: debt._id,
      description: `Debt record updated. New Total: Rs.${newTotal.toLocaleString()}, Paid: Rs.${newPaid.toLocaleString()}, Remaining: Rs.${newRemaining.toLocaleString()}.`,
    }).catch(err => console.error("Debt update audit failed:", err));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addDebt,
  getDebts,
  payDebt,
  deleteDebt,
  updateDebt,
};
