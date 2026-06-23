const Expense = require("../models/Expense");
const Transaction = require("../models/Transaction");

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate("user", "name email role").sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  const { category, amount, description, date, paymentMethod } = req.body;

  if (!category || !amount) {
    return res.status(400).json({ message: "Category and amount are required" });
  }

  try {
    const expense = new Expense({
      category,
      amount: Number(amount),
      description,
      date: date || new Date(),
      paymentMethod,
      user: req.user.id,
    });

    const savedExpense = await expense.save();

    // Create corresponding transaction
    const transaction = new Transaction({
      type: "expense",
      title: `Expense: ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      personName: "Store Expense",
      amount: Number(amount),
      flow: "expense",
      paymentMethod: paymentMethod || "cash",
      category,
      description: description || `Expense for ${category}`,
      expense: savedExpense._id,
      user: req.user.id,
    });

    await transaction.save();

    res.status(201).json(savedExpense);

    const { logAudit } = require("../utils/auditLogger");
    logAudit({
      req,
      action: "create",
      entity: "Expense",
      entityId: savedExpense._id,
      description: `Expense created: Category "${category}", Amount Rs.${Number(amount).toLocaleString()}, Payment: ${paymentMethod || "cash"}. ${description || ""}`,
    }).catch(err => console.error("Expense create audit failed:", err));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(444).json({ message: "Expense not found" });
    }

    const expenseCategory = expense.category;
    const expenseAmount = expense.amount;

    // Delete corresponding transaction
    await Transaction.deleteMany({ expense: req.params.id });

    // Delete expense
    await expense.deleteOne();

    const { logAudit } = require("../utils/auditLogger");
    await logAudit({
      req,
      action: "delete",
      entity: "Expense",
      entityId: req.params.id,
      description: `Expense deleted: Category "${expenseCategory}", Amount Rs.${expenseAmount.toLocaleString()}.`,
    }).catch(err => console.error("Expense delete audit failed:", err));

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
};
