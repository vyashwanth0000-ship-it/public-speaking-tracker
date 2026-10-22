const mongoose = require("mongoose");

const speechSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  topic: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  duration: { type: Number, default: 5, min: 1 },
  category: { type: String, default: "General", trim: true },
}, { timestamps: true });

module.exports = mongoose.model("Speech", speechSchema);
