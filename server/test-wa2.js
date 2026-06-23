require("dotenv").config();
const { checkAndNotifyRestock } = require("./utils/restockNotifier");

async function runTest() {
  const mockProduct = {
    _id: "mock_id",
    name: "Test WhatsApp Product",
    sku: "TEST-SKU-1",
    stock: 2,
    minStockLevel: 5,
    unit: "pcs",
    supplier: {
      name: "Test Supplier",
      company: "Test Co",
      notificationPreference: "whatsapp",
      phone: "0766250583" // User's requested number
    }
  };

  try {
    const result = await checkAndNotifyRestock(mockProduct, { force: true });
    console.log("Success! Result:", result);
  } catch (err) {
    console.error("Error during restock trigger:", err);
  }
}

runTest();
