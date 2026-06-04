const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const SupplierPayable = require("../models/SupplierPayable");
const Transaction = require("../models/Transaction");
const Debt = require("../models/Debt");

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
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);

    // Paid
    const totalPaid = sales.reduce((acc, sale) => acc + sale.paidAmount, 0);

    
    // Pending Debts
const debts = await Debt.find();

const pendingAmount = debts.reduce(
  (acc, debt) => acc + debt.remainingAmount,
  0,
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
      0,
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

      revenue: sale.totalAmount,
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

module.exports = {
  getDashboardAnalytics,
};
