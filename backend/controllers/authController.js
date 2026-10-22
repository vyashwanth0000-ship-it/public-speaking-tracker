const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== "string" || !name.trim() ||
        typeof email !== "string" || !email.trim() ||
        typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Provide a name, valid email, and password of at least 6 characters." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: "Email is already registered." });
    }
    const user = await User.create({
      name: name.trim(), email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
    });
    return res.status(201).json({
      message: "Registration successful",
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Email is already registered." });
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error during registration." });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
      return res.status(400).json({ message: "Provide email and password." });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    return res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login." });
  }
}

module.exports = { registerUser, loginUser };
