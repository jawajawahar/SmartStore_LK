const express = require("express");

const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  bulkAddProducts,
  bulkDeleteProducts,
  triggerProductRestockAlert,
} = require("../controllers/productController");

const { protect, checkPermission } = require("../middleware/authMiddleware");

const multer = require("multer");

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Routes
router.post("/bulk", protect, checkPermission("edit_products"), bulkAddProducts);
router.post("/bulk-delete", protect, checkPermission("edit_products"), bulkDeleteProducts);

router.post("/", protect, checkPermission("edit_products"), upload.single("image"), addProduct);

router.get("/", protect, getProducts);

router.put("/:id", protect, checkPermission("edit_products"), updateProduct);

router.delete("/:id", protect, checkPermission("edit_products"), deleteProduct);

router.post("/:id/alert", protect, triggerProductRestockAlert);

module.exports = router;
