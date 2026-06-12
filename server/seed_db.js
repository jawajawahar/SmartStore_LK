const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const Product = require("./models/Product");
const Customer = require("./models/Customer");
const Supplier = require("./models/Supplier");
const SupplierPayable = require("./models/SupplierPayable");

if (!process.env.MONGO_URI) {
  console.error("Error: MONGO_URI is not defined.");
  process.exit(1);
}

// Simple CSV parser supporting quotes
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const headers = lines[0].split(",").map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let inQuotes = false;
    let currentVal = "";
    
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(currentVal.trim());
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index] : "";
    });
    data.push(row);
  }
  return data;
}

async function run() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected. Seeding test data...");

    // 1. Seed Suppliers & payables
    const suppliersCSV = path.join(__dirname, "..", "test-data", "suppliers.csv");
    if (fs.existsSync(suppliersCSV)) {
      const parsedSuppliers = parseCSV(suppliersCSV);
      console.log(`Parsed ${parsedSuppliers.length} suppliers.`);
      
      const savedSuppliers = [];
      for (const row of parsedSuppliers) {
        const s = new Supplier({
          name: row.name,
          company: row.company,
          phone: row.phone,
          address: row.address,
          payableAmount: Number(row.payableAmount) || 0
        });
        await s.save();
        savedSuppliers.push(s);

        if (s.payableAmount > 0) {
          const payable = new SupplierPayable({
            supplier: s._id,
            description: "Imported outstanding balance",
            totalAmount: s.payableAmount,
            paidAmount: 0,
            remainingAmount: s.payableAmount,
            status: "pending"
          });
          await payable.save();
        }
      }
      console.log("Suppliers and payables seeded successfully.");
    }

    // 2. Seed Customers
    const customersCSV = path.join(__dirname, "..", "test-data", "customers.csv");
    if (fs.existsSync(customersCSV)) {
      const parsedCustomers = parseCSV(customersCSV);
      console.log(`Parsed ${parsedCustomers.length} customers.`);
      
      for (const row of parsedCustomers) {
        const c = new Customer({
          name: row.name,
          phone: row.phone,
          address: row.address,
          customerType: row.customerType || "normal",
          currentDebt: 0
        });
        await c.save();
      }
      console.log("Customers seeded successfully.");
    }

    // 3. Seed Products
    const productsCSV = path.join(__dirname, "..", "test-data", "products.csv");
    if (fs.existsSync(productsCSV)) {
      const parsedProducts = parseCSV(productsCSV);
      console.log(`Parsed ${parsedProducts.length} products.`);
      
      let count = 0;
      for (const row of parsedProducts) {
        count++;
        const p = new Product({
          name: row.name,
          category: row.category || "Uncategorized",
          buyingPrice: Number(row.buyingPrice),
          sellingPrice: Number(row.sellingPrice),
          bulkPrice: row.bulkPrice ? Number(row.bulkPrice) : undefined,
          stock: Number(row.stock),
          barcode: row.barcode || undefined,
          unit: row.unit || "pcs",
          productType: row.productType || "fixed",
          sku: `SKU-${String(count).padStart(6, "0")}`
        });
        await p.save();
      }
      console.log("Products seeded successfully.");
    }

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
