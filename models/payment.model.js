const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["CREATED", "ATTEMPTED", "PAID", "FAILED"],
      default: "CREATED",
    },
    paymentType: {
      type: String,
      enum: ["CONFIRMATION", "FULL", "MONTHLY", "OFFLINE"],
      required: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
    },
    invoiceSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
