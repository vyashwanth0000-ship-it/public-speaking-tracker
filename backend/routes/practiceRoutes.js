const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { createPractice, getPractices, getProgress } = require("../controllers/practiceController");
router.get("/progress", protect, getProgress);
router.route("/").get(protect, getPractices).post(protect, createPractice);
module.exports = router;
