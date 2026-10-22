const mongoose = require("mongoose");
const PracticeSession = require("../models/PracticeSession");
const Speech = require("../models/Speech");

async function createPractice(req, res) {
  try {
    const duration = Number(req.body.duration);
    const confidence = Number(req.body.confidence || 3);
    if (!Number.isFinite(duration) || duration < 1) return res.status(400).json({ message: "Practice duration must be at least 1 minute." });
    if (!Number.isFinite(confidence) || confidence < 1 || confidence > 5) return res.status(400).json({ message: "Confidence must be from 1 to 5." });
    let speechId = null;
    if (req.body.speech && req.body.speech !== "none") {
      if (!mongoose.isValidObjectId(req.body.speech)) return res.status(400).json({ message: "Invalid speech." });
      const ownedSpeech = await Speech.findOne({ _id: req.body.speech, user: req.user._id });
      if (!ownedSpeech) return res.status(404).json({ message: "Speech not found." });
      speechId = ownedSpeech._id;
    }
    const session = await PracticeSession.create({
      user: req.user._id, speech: speechId, duration, confidence,
      notes: typeof req.body.notes === "string" ? req.body.notes.trim() : "",
    });
    res.status(201).json({ message: "Practice session saved.", session });
  } catch (error) {
    console.error("Create practice error:", error);
    res.status(500).json({ message: "Could not save practice session." });
  }
}

async function getPractices(req, res) {
  try {
    const sessions = await PracticeSession.find({ user: req.user._id })
      .populate("speech", "title topic").sort({ practicedAt: -1 });
    res.json({ sessions });
  } catch (error) {
    console.error("Get practice sessions error:", error);
    res.status(500).json({ message: "Could not fetch practice sessions." });
  }
}

async function getProgress(req, res) {
  try {
    const sessions = await PracticeSession.find({ user: req.user._id });
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const averageConfidence = sessions.length
      ? Number((sessions.reduce((sum, s) => sum + s.confidence, 0) / sessions.length).toFixed(1))
      : 0;
    res.json({ totalSessions: sessions.length, totalMinutes, averageConfidence });
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({ message: "Could not calculate progress." });
  }
}

module.exports = { createPractice, getPractices, getProgress };
