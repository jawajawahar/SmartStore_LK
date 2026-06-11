const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const SupplierPayable = require("../models/SupplierPayable");
const Transaction = require("../models/Transaction");
const Debt = require("../models/Debt");
const Return = require("../models/Return");
// Register all ref-schemas so Mongoose doesn't throw MissingSchemaError
require("../models/Brand");
require("../models/Category");

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

// Get Comprehensive Report Data for AI Agent
const getReportData = async (req, res) => {
  try {
    const { from, to } = req.query;

    const startDate = from ? new Date(from) : new Date(new Date().setDate(1));
    startDate.setHours(0, 0, 0, 0);

    const endDate = to ? new Date(to) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };

    // Fetch all relevant data in parallel
    const [sales, transactions, products, returnRecords, debts, suppliers, payables] =
      await Promise.all([
        Sale.find(dateFilter),
        Transaction.find(dateFilter),
        Product.find(),
        Return.find(dateFilter),
        Debt.find(),
        Supplier.find(),
        SupplierPayable.find(),
      ]);

    // --- SALES SUMMARY ---
    const totalSalesCount = sales.length;
    const grossRevenue = sales.reduce(
      (acc, s) => acc + (s.netAmount || s.totalAmount || 0),
      0
    );
    const totalPaid = sales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const totalCredit = sales.reduce((acc, s) => acc + (s.remainingAmount || 0), 0);
    const totalDiscount = sales.reduce((acc, s) => acc + (s.discountAmount || 0), 0);
    const totalTax = sales.reduce((acc, s) => acc + (s.taxAmount || 0), 0);

    // Product-wise sales breakdown
    const productSalesMap = {};
    sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const name = item.name || "Unknown";
        if (!productSalesMap[name]) {
          productSalesMap[name] = { name, qty: 0, revenue: 0 };
        }
        productSalesMap[name].qty += item.quantity || 0;
        productSalesMap[name].revenue += item.total || 0;
      });
    });
    const productSales = Object.values(productSalesMap).sort(
      (a, b) => b.revenue - a.revenue
    );

    // Payment method breakdown
    const paymentMethodBreakdown = {
      cash: sales.filter((s) => s.paymentMethod === "cash").reduce((a, s) => a + (s.paidAmount || 0), 0),
      card: sales.filter((s) => s.paymentMethod === "card").reduce((a, s) => a + (s.paidAmount || 0), 0),
      bank_transfer: sales.filter((s) => s.paymentMethod === "bank_transfer").reduce((a, s) => a + (s.paidAmount || 0), 0),
      credit: sales.filter((s) => s.paymentMethod === "credit").reduce((a, s) => a + (s.paidAmount || 0), 0),
    };

    // Daily sales trend
    const dailySalesMap = {};
    sales.forEach((sale) => {
      const day = new Date(sale.createdAt).toLocaleDateString("en-CA");
      if (!dailySalesMap[day]) dailySalesMap[day] = { date: day, revenue: 0, count: 0 };
      dailySalesMap[day].revenue += sale.netAmount || sale.totalAmount || 0;
      dailySalesMap[day].count += 1;
    });
    const dailySalesTrend = Object.values(dailySalesMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // --- FINANCIAL SUMMARY ---
    const incomeTransactions = transactions.filter((t) => t.flow === "income");
    const expenseTransactions = transactions.filter((t) => t.flow === "expense");
    const totalIncome = incomeTransactions.reduce((a, t) => a + (t.amount || 0), 0);
    const totalExpenses = expenseTransactions.reduce((a, t) => a + (t.amount || 0), 0);
    const netProfit = grossRevenue - totalExpenses;

    // Expense categories
    const expenseCategoryMap = {};
    expenseTransactions.forEach((t) => {
      const cat = t.type || "other";
      expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + (t.amount || 0);
    });

    // --- INVENTORY SUMMARY ---
    const totalProducts = products.length;
    const totalStockValue = products.reduce(
      (acc, p) => acc + ((p.stock || 0) * (p.buyingPrice || 0)),
      0
    );
    const totalRetailValue = products.reduce(
      (acc, p) => acc + ((p.stock || 0) * (p.sellingPrice || 0)),
      0
    );
    const lowStockProducts = products.filter(
      (p) => (p.stock || 0) <= (p.minStockLevel || 5) && (p.stock || 0) > 0
    );
    const outOfStockProducts = products.filter((p) => (p.stock || 0) === 0);
    const categoryStockMap = {};
    products.forEach((p) => {
      const cat = p.category || "Uncategorized";
      if (!categoryStockMap[cat])
        categoryStockMap[cat] = { category: cat, items: 0, stockValue: 0 };
      categoryStockMap[cat].items += 1;
      categoryStockMap[cat].stockValue += (p.stock || 0) * (p.buyingPrice || 0);
    });

    // --- RETURNS SUMMARY ---
    const totalReturns = returnRecords.length;
    const totalRefundAmount = returnRecords.reduce((a, r) => a + (r.refundAmount || 0), 0);

    // --- DEBT SUMMARY ---
    const totalOutstandingDebt = debts.reduce(
      (a, d) => a + (d.remainingAmount || 0),
      0
    );
    const totalDebtCustomers = debts.filter((d) => (d.remainingAmount || 0) > 0).length;

    // --- SUPPLIER PAYABLE SUMMARY ---
    const totalOutstandingPayable = payables.reduce(
      (a, p) => a + (p.remainingAmount || 0),
      0
    );

    res.status(200).json({
      period: {
        from: startDate.toLocaleDateString(),
        to: endDate.toLocaleDateString(),
      },
      sales: {
        totalSalesCount,
        grossRevenue,
        totalPaid,
        totalCredit,
        totalDiscount,
        totalTax,
        productSales,
        paymentMethodBreakdown,
        dailySalesTrend,
      },
      financial: {
        grossRevenue,
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin:
          grossRevenue > 0
            ? ((netProfit / grossRevenue) * 100).toFixed(2)
            : "0.00",
        expenseCategoryBreakdown: expenseCategoryMap,
      },
      inventory: {
        totalProducts,
        totalStockValue,
        totalRetailValue,
        potentialProfit: totalRetailValue - totalStockValue,
        lowStockProducts: lowStockProducts.map((p) => ({
          name: p.name,
          sku: p.sku || "",
          category: p.category || "Uncategorized",
          stock: p.stock || 0,
          minStockLevel: p.minStockLevel || 5,
        })),
        outOfStockProducts: outOfStockProducts.map((p) => ({
          name: p.name,
          sku: p.sku || "",
          category: p.category || "Uncategorized",
        })),
        categoryBreakdown: Object.values(categoryStockMap),
      },
      returns: {
        totalReturns,
        totalRefundAmount,
      },
      debts: {
        totalOutstandingDebt,
        totalDebtCustomers,
      },
      suppliers: {
        totalSuppliers: suppliers.length,
        totalOutstandingPayable,
      },
    });
  } catch (error) {
    console.error("getReportData error:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

module.exports = {
  getDashboardAnalytics,
  getDailyReport,
  getLowStockProducts,
  getReportData,
};
