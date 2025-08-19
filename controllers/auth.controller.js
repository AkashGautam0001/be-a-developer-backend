const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const generateOTP = require("../utils/generateOTP");
const sendOTP = require("../utils/sendSMS");
const User = require("../models/user.model");

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Send OTP
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit phone number",
      });
    }

    const otp = generateOTP();

    // Store OTP with expiration (5 minutes)
    otpStore.set(phone, {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    });

    // Send OTP via SMS
    // const smsResult = await sendOTP(phone, otp);

    // if (!smsResult.success) {
    //   return res.status(500).json({
    //     success: false,
    //     message: "Failed to send OTP",
    //     error: smsResult.error,
    //   });
    // }

    res.json({
      success: true,
      message: "OTP sent successfully",
      otp: otp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Verify OTP and Login
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const storedOTP = otpStore.get(phone);

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (Date.now() > storedOTP.expires) {
      otpStore.delete(phone);
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Find or create user
    let user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }

    // Generate session ID and logout other sessions
    const sessionId = uuidv4();

    // Update user with new session
    user.currentSessionId = sessionId;
    user.isActive = true;
    user.lastLogin = new Date();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        sessionId: sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Clear OTP
    otpStore.delete(phone);

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // Clear user session
    req.user.currentSessionId = null;
    req.user.isActive = false;
    await req.user.save();

    res.clearCookie("token");
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      email: req.user.email,
    },
  });
};

module.exports = { sendOtp, verifyOtp, getCurrentUser, logout };
