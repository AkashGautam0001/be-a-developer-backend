const express = require("express");
const paymentControllers = require("../controllers/payments.controller");
const { authenticateUser } = require("../middlewares/auth.middlewares");

const router = express.Router();

router.post(
  "/create-confirmation-order",
  // authenticateUser,
  paymentControllers.createConfirmationOrder
);
router.post(
  "/verify-confirmation-payment",
  // authenticateUser,
  paymentControllers.verifyConfirmationPayment
);
router.post(
  "/create-course-order",
  // authenticateUser,
  paymentControllers.createPaymentOrder
);
router.post(
  "/verify-course-payment",
  // authenticateUser,
  paymentControllers.verifyCoursePayment
);
router.post("/webhook", paymentControllers.razorpayWebhook);

module.exports = router;
