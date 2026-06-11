const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes");
const debtRoutes = require("./routes/debtRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const supplierPayableRoutes = require("./routes/supplierPayableRoutes");
const saleRoutes = require("./routes/saleRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const returnRoutes = require("./routes/returnRoutes");
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/customers", customerRoutes);
app.use("/api/debts", debtRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/supplier-payables", supplierPayableRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/invoices", invoiceRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("SmartStore LK Backend Running...");
});

app.use("/api/transactions", transactionRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/returns", returnRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");

    // Reconcile supplier balances with transaction payables
    try {
      const { reconcileSupplierBalances } = require("./utils/reconcile");
      await reconcileSupplierBalances();
    } catch (reconcileError) {
      console.error("Reconciliation error during startup:", reconcileError);
    }

    const PORT =
      process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  })
  .catch((err) =>
    console.log(err)
  );