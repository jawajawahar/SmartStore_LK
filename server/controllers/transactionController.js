const Transaction = require("../models/Transaction");

// Get Transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({
      createdAt: -1,
    });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Add Manual Transaction (for manual expenses/income entries)
const addTransaction = async (req, res) => {
  try {
    const { type, title, personName, amount, flow, paymentMethod, category, description } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const transaction = await Transaction.create({
      type: type || flow,
      title,
      personName: personName || "",
      amount: Number(amount),
      flow,
      paymentMethod: paymentMethod || "cash",
      category: category || "general",
      description,
    });

    res.status(201).json({
      message: "Transaction added",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Transaction
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    await transaction.deleteOne();

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "delete",
      entity: "Transaction",
      entityId: transaction._id,
      description: `Transaction deleted: type: "${transaction.type}", title: "${transaction.title}", person: "${transaction.personName}", amount: Rs. ${transaction.amount}, flow: "${transaction.flow}".`,
      changes: transaction.toObject(),
    });

    res.status(200).json({
      message: "Transaction deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getTransactions,
  addTransaction,
  deleteTransaction,
};
