const { addDebt, getDebts, payDebt, deleteDebt, updateDebt } = require("../controllers/debtController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes
router.post("/", protect, addDebt);

router.get("/", protect, getDebts);

router.put("/:id/pay", protect, payDebt);

router.put("/:id", protect, updateDebt);

router.delete("/:id", protect, deleteDebt);

module.exports = router;
