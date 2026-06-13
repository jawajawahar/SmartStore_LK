const Sale = require("../models/Sale");

const Transaction = require("../models/Transaction");

// Get Invoice Details
const getInvoiceDetails = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate("customer").populate("items.product");

    if (!sale) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    // Related Transactions
    const transactions = await Transaction.find({
      sale: sale._id,
    }).sort({
      createdAt: 1,
    });

    res.status(200).json({
      sale,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getInvoiceDetails,
};
