const express = require("express");

const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");

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
router.post("/", protect, upload.single("image"), addProduct);

router.get("/", protect, getProducts);

router.put("/:id", protect, updateProduct);

router.delete("/:id", protect, deleteProduct);

module.exports = router;
