const Return = require("../models/Return");
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const Customer = require("../models/Customer");

// @desc    Get all returns
// @route   GET /api/returns
// @access  Private
const getReturns = async (req, res) => {
  try {
    const returns = await Return.find()
      .populate({
        path: "originalSale",
        populate: { path: "customer", select: "name" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process a new return
// @route   POST /api/returns
// @access  Private
const createReturn = async (req, res) => {
  const { originalSaleId, items, reason, refundAmount } = req.body;

  if (!originalSaleId || !items || items.length === 0) {
    return res.status(400).json({ message: "Sale ID and returned items are required" });
  }

  try {
    const sale = await Sale.findById(originalSaleId).populate("customer");
    if (!sale) {
      return res.status(404).json({ message: "Original sale not found" });
    }

    // Process each item and adjust product stocks
    const processedItems = [];
    for (const item of items) {
      // Find sale item by itemId first, fallback to product ID comparison
      const saleItem = sale.items.find(
        (si) => (item.itemId && si._id.toString() === item.itemId.toString()) || 
                (si.product && item.product && si.product.toString() === item.product.toString())
      );

      if (!saleItem) {
        return res.status(400).json({
          message: `Product ${item.name || item.product} was not part of original sale`,
        });
      }

      if (item.quantity > saleItem.quantity) {
        return res.status(400).json({
          message: `Returned quantity for ${item.name} (${item.quantity}) exceeds sold quantity (${saleItem.quantity})`,
        });
      }

      const actualProductId = saleItem.product;

      // Restock the product (recreate if auto-deleted when stock reached 0)
      if (actualProductId) {
        const prodExists = await Product.findById(actualProductId);
        if (!prodExists) {
          const newProd = new Product({
            _id: actualProductId,
            name: item.name || saleItem.name || "Restocked Product",
            stock: Number(item.quantity),
            buyingPrice: Number(item.price || saleItem.price || 0),
            sellingPrice: Number(item.price || saleItem.price || 0),
            category: "Restocked",
            unit: "pcs",
          });
          await newProd.save();
        } else {
          prodExists.stock += Number(item.quantity);
          await prodExists.save();
        }
      }

      processedItems.push({
        product: actualProductId || item.product,
        name: item.name || saleItem.name,
        quantity: Number(item.quantity),
        price: Number(item.price || saleItem.price),
        total: Number(item.quantity) * Number(item.price || saleItem.price),
      });
    }

    // Create the Return document
    const newReturn = new Return({
      originalSale: originalSaleId,
      items: processedItems,
      reason: reason || "Customer satisfaction return",
      refundAmount: Number(refundAmount) || 0,
      status: "completed",
    });

    const savedReturn = await newReturn.save();

    // Create corresponding Transaction for the refund payout
    if (Number(refundAmount) > 0) {
      let customerName = "Walk-in Customer";
      if (sale.customer) {
        customerName = sale.customer.name;
      }

      const transaction = new Transaction({
        type: "refund",
        title: `Refund: Return for Sale #${sale._id.toString().slice(-6)}`,
        personName: customerName,
        amount: Number(refundAmount),
        flow: "expense",
        paymentMethod: "cash", // default to cash refund
        description: reason || `Refund for return of ${processedItems.length} item(s)`,
        sale: sale._id,
      });

      await transaction.save();
    }

    res.status(201).json(savedReturn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReturns,
  createReturn,
};
