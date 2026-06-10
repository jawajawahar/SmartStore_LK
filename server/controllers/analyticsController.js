const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const SupplierPayable = require("../models/SupplierPayable");
const Transaction = require("../models/Transaction");
const Debt = require("../models/Debt");
const Return = require("../models/Return");

// Dashboard Analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    // Sales
    const sales = await Sale.find();

    // Products
    const totalProducts = await Product.countDocuments();

    // Customers
    const totalCustomers = await Customer.countDocuments();

    // Revenue
    const totalRevenue = sales.reduce((acc, sale) => acc + (sale.netAmount || sale.totalAmount), 0);

    // Paid
    const totalPaid = sales.reduce((acc, sale) => acc + sale.paidAmount, 0);

    // Pending Debts
    const debts = await Debt.find();

    const pendingAmount = debts.reduce(
      (acc, debt) => acc + debt.remainingAmount,
      0
    );

    // Transactions
    const transactions = await Transaction.find();

    // Expenses
    const totalExpenses = transactions
      .filter((t) => t.flow === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    // Supplier Payables
    const payables = await SupplierPayable.find();

    const totalPayables = payables.reduce(
      (acc, payable) => acc + payable.remainingAmount,
      0
    );

    // Recent Transactions
    const recentTransactions = await Transaction.find()
      .sort({
        createdAt: -1,
      })
      .limit(5);

    // Top Products
    const productSalesMap = {};

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (productSalesMap[item.name]) {
          productSalesMap[item.name] += item.quantity;
        } else {
          productSalesMap[item.name] = item.quantity;
        }
      });
    });

    const topProducts = Object.entries(productSalesMap)
      .map(([name, totalSold]) => ({
        name,
        totalSold,
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    // Sales Overview Chart
    const salesOverview = sales.map((sale) => ({
      date: new Date(sale.createdAt).toLocaleDateString(),
      revenue: sale.netAmount || sale.totalAmount,
    }));

    res.status(200).json({
      totalRevenue,
      totalSales: sales.length,
      totalPaid,
      pendingAmount,
      totalProducts,
      totalCustomers,
      totalExpenses,
      totalPayables,
      recentTransactions,
      topProducts,
      salesOverview,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Daily Report
const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Fetch Sales for that day
    const daySales = await Sale.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).populate("customer", "name");

    // 2. Fetch Transactions for that day
    const dayTransactions = await Transaction.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // 3. Fetch Returns for that day
    const dayReturns = await Return.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // Calculate totals
    const totalSalesCount = daySales.length;
    const grossRevenue = daySales.reduce((acc, s) => acc + (s.netAmount || s.totalAmount), 0);
    const cashReceived = daySales.reduce((acc, s) => acc + s.paidAmount, 0);
    const creditExtended = daySales.reduce((acc, s) => acc + s.remainingAmount, 0);

    const totalExpenses = dayTransactions
      .filter((t) => t.flow === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    const totalRefunds = dayReturns.reduce((acc, r) => acc + r.refundAmount, 0);

    // Breakdowns
    const debtCollected = dayTransactions
      .filter((t) => t.type === "debt_payment")
      .reduce((acc, t) => acc + t.amount, 0);

    const supplierPaid = dayTransactions
      .filter((t) => t.type === "supplier_payment")
      .reduce((acc, t) => acc + t.amount, 0);

    const manualExpenses = dayTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    // Calculate historical opening cash balance (before startOfDay)
    const priorIncome = await Transaction.find({
      createdAt: { $lt: startOfDay },
      flow: "income",
      paymentMethod: "cash",
    });
    const priorExpense = await Transaction.find({
      createdAt: { $lt: startOfDay },
      flow: "expense",
      paymentMethod: "cash",
    });
    const openingCashBalance =
      priorIncome.reduce((acc, t) => acc + t.amount, 0) -
      priorExpense.reduce((acc, t) => acc + t.amount, 0);

    // Current Cash Balance in Register
    const dayCashIncome = dayTransactions
      .filter((t) => t.flow === "income" && t.paymentMethod === "cash")
      .reduce((acc, t) => acc + t.amount, 0);
    const dayCashExpense = dayTransactions
      .filter((t) => t.flow === "expense" && t.paymentMethod === "cash")
      .reduce((acc, t) => acc + t.amount, 0);
    const netCashFlow = dayCashIncome - dayCashExpense;
    const closingCashBalance = openingCashBalance + netCashFlow;

    // Payment method breakdown for the day's transactions
    const paymentMethods = {
      cash: dayTransactions
        .filter((t) => t.paymentMethod === "cash")
        .reduce((acc, t) => acc + t.amount, 0),
      card: dayTransactions
        .filter((t) => t.paymentMethod === "card")
        .reduce((acc, t) => acc + t.amount, 0),
      bank_transfer: dayTransactions
        .filter((t) => t.paymentMethod === "bank_transfer")
        .reduce((acc, t) => acc + t.amount, 0),
    };

    res.status(200).json({
      date: startOfDay.toLocaleDateString(),
      totalSalesCount,
      grossRevenue,
      cashReceived,
      creditExtended,
      totalExpenses,
      totalRefunds,
      debtCollected,
      supplierPaid,
      manualExpenses,
      openingCashBalance,
      closingCashBalance,
      netCashFlow,
      paymentMethods,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Low Stock Products
const getLowStockProducts = async (req, res) => {
  try {
    const lowStock = await Product.find({
      $expr: { $lte: ["$stock", "$minStockLevel"] },
    }).populate("brand", "name");

    res.status(200).json(lowStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardAnalytics,
  getDailyReport,
  getLowStockProducts,
};
