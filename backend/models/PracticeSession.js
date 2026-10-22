const mongoose = require("mongoose");

const practiceSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  speech: { type: mongoose.Schema.Types.ObjectId, ref: "Speech", default: null },
  duration: { type: Number, required: true, min: 1 },
  confidence: { type: Number, min: 1, max: 5, default: 3 },
  notes: { type: String, default: "", trim: true },
  practicedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("PracticeSession", practiceSessionSchema);
