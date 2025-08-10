const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Admin = require("../models/admin.model");

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    // Check if user session is still valid
    if (user.currentSessionId !== decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No admin token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid admin token.",
    });
  }
};

module.exports = { authenticateUser, authenticateAdmin };
