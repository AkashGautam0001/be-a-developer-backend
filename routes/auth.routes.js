const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/auth.controller");
const { authenticateUser } = require("../middlewares/auth.middlewares");

router.post("/send-otp", authControllers.sendOtp);
router.post("/verify-otp", authControllers.verifyOtp);
router.post("logout", authenticateUser, authControllers.logout);
router.get("/me", authenticateUser, authControllers.getCurrentUser);

module.exports = router;
