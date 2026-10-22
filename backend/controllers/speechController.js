const mongoose = require("mongoose");
const Speech = require("../models/Speech");

async function createSpeech(req, res) {
  try {
    const { title, topic, description = "", duration = 5, category = "General" } = req.body;
    if (typeof title !== "string" || !title.trim() || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ message: "Speech title and topic are required." });
    }
    const minutes = Number(duration);
    if (!Number.isFinite(minutes) || minutes < 1) return res.status(400).json({ message: "Duration must be at least 1 minute." });
    const speech = await Speech.create({
      user: req.user._id, title: title.trim(), topic: topic.trim(),
      description: typeof description === "string" ? description.trim() : "",
      duration: minutes, category: typeof category === "string" && category.trim() ? category.trim() : "General",
    });
    res.status(201).json({ message: "Speech created successfully", speech });
  } catch (error) {
    console.error("Create speech error:", error);
    res.status(500).json({ message: "Failed to create speech." });
  }
}

async function getSpeeches(req, res) {
  try {
    const speeches = await Speech.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ speeches });
  } catch (error) {
    console.error("Get speeches error:", error);
    res.status(500).json({ message: "Failed to fetch speeches." });
  }
}

async function updateSpeech(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid speech ID." });
    const speech = await Speech.findOne({ _id: req.params.id, user: req.user._id });
    if (!speech) return res.status(404).json({ message: "Speech not found." });
    const { title, topic, description, duration, category } = req.body;
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) return res.status(400).json({ message: "Title cannot be empty." });
      speech.title = title.trim();
    }
    if (topic !== undefined) {
      if (typeof topic !== "string" || !topic.trim()) return res.status(400).json({ message: "Topic cannot be empty." });
      speech.topic = topic.trim();
    }
    if (description !== undefined && typeof description === "string") speech.description = description.trim();
    if (duration !== undefined) {
      const minutes = Number(duration);
      if (!Number.isFinite(minutes) || minutes < 1) return res.status(400).json({ message: "Duration must be at least 1 minute." });
      speech.duration = minutes;
    }
    if (category !== undefined && typeof category === "string") speech.category = category.trim() || "General";
    await speech.save();
    res.json({ message: "Speech updated successfully", speech });
  } catch (error) {
    console.error("Update speech error:", error);
    res.status(500).json({ message: "Failed to update speech." });
  }
}

async function deleteSpeech(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid speech ID." });
    const speech = await Speech.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!speech) return res.status(404).json({ message: "Speech not found." });
    res.json({ message: "Speech deleted successfully." });
  } catch (error) {
    console.error("Delete speech error:", error);
    res.status(500).json({ message: "Failed to delete speech." });
  }
}

module.exports = { createSpeech, getSpeeches, updateSpeech, deleteSpeech };
