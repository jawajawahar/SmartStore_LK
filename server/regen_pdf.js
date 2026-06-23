const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const PO = require('./models/PurchaseOrder');
  const Product = require('./models/Product');
  const Supplier = require('./models/Supplier');
  const { generatePOPdf } = require('./utils/poGenerator');
  const path = require('path');
  
  const po = await PO.findById('6a3515f0e916c53715355d86');
  if (!po) {
    console.log('PO not found!');
    process.exit(1);
  }
  
  let prod = await Product.findById(po.product);
  if (!prod) {
    // mock product
    prod = { name: po.productName, sku: po.sku, unit: 'pcs' };
  }
  
  let supp = await Supplier.findById(po.supplier);
  if (!supp) {
    // mock supplier
    supp = { name: 'Unknown Supplier', company: 'Unknown', email: 'none', phone: 'none' };
  }
  
  const poFilename = `po-${po._id}.pdf`;
  const poLocalPath = path.join(__dirname, 'uploads/purchase_orders', poFilename);
  
  await generatePOPdf(po, prod, supp, poLocalPath);
  console.log('Generated PDF at', poLocalPath);
  mongoose.disconnect();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
