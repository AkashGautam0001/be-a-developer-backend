const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    confirmationFeePaid: {
      type: Boolean,
      default: false,
    },
    confirmationFeeAmount: {
      type: Number,
      default: 99,
    },
    confirmationPaymentId: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ["MONTHLY", "FULL", null],
      default: null,
    },
    fullPaymentCompleted: {
      type: Boolean,
      default: false,
    },
    monthlyPayments: [
      {
        month: Number,
        year: Number,
        amount: Number,
        paymentId: String,
        paidAt: Date,
        status: {
          type: String,
          enum: ["PENDING", "PAID", "FAILED"],
          default: "PENDING",
        },
      },
    ],
    totalAmountPaid: {
      type: Number,
      default: 0,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        "PENDING_CONFIRMATION",
        "CONFIRMED",
        "ACTIVE",
        "SUSPENDED",
        "CANCELLED",
      ],
      default: "PENDING_CONFIRMATION",
    },
  },
  { timestamps: true }
);

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

module.exports = Enrollment;
