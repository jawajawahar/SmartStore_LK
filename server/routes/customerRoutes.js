const express = require("express");

const {
  addCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  bulkAddCustomers,
  bulkDeleteCustomers,
} = require("../controllers/customerController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.post("/bulk", protect, bulkAddCustomers);
router.post("/bulk-delete", protect, bulkDeleteCustomers);

router.post("/", protect, addCustomer);

router.get("/", protect, getCustomers);

router.put("/:id", protect, updateCustomer);

router.delete("/:id", protect, deleteCustomer);

module.exports = router;
