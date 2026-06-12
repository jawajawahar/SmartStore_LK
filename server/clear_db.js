const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const Product = require("./models/Product");
const Customer = require("./models/Customer");
const Supplier = require("./models/Supplier");
const SupplierPayable = require("./models/SupplierPayable");
const Transaction = require("./models/Transaction");
const Sale = require("./models/Sale");
const Debt = require("./models/Debt");
const Expense = require("./models/Expense");
const Return = require("./models/Return");
const AuditLog = require("./models/AuditLog");
const ActivityLog = require("./models/ActivityLog");
const Brand = require("./models/Brand");
const Category = require("./models/Category");

if (!process.env.MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in the environment variables (.env).");
  process.exit(1);
}

console.log("Connecting to database to clear testing collections...");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      console.log("Connected successfully. Clearing collections (User credentials will NOT be deleted)...");

      const collectionsToClear = [
        { model: Product, name: "Products" },
        { model: Customer, name: "Customers" },
        { model: Supplier, name: "Suppliers" },
        { model: SupplierPayable, name: "SupplierPayables" },
        { model: Transaction, name: "Transactions" },
        { model: Sale, name: "Sales" },
        { model: Debt, name: "Debts" },
        { model: Expense, name: "Expenses" },
        { model: Return, name: "Returns" },
        { model: AuditLog, name: "AuditLogs" },
        { model: ActivityLog, name: "ActivityLogs" },
        { model: Brand, name: "Brands" },
        { model: Category, name: "Categories" }
      ];

      for (const col of collectionsToClear) {
        const count = await col.model.countDocuments();
        if (count > 0) {
          await col.model.deleteMany({});
          console.log(`Cleared ${count} document(s) from ${col.name}.`);
        } else {
          console.log(`${col.name} collection is already empty.`);
        }
      }

      console.log("\nDatabase reset successfully! All master & transactional data has been cleared.");
    } catch (err) {
      console.error("Error clearing database:", err);
    } finally {
      mongoose.connection.close();
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });
