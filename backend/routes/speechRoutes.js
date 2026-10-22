const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { createSpeech, getSpeeches, updateSpeech, deleteSpeech } = require("../controllers/speechController");
router.route("/").get(protect, getSpeeches).post(protect, createSpeech);
router.route("/:id").put(protect, updateSpeech).delete(protect, deleteSpeech);
module.exports = router;
