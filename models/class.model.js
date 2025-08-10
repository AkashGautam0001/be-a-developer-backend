const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    zoomLink: {
      type: String,
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true, // in minutes
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ["DEMO", "REGULAR"],
      default: "REGULAR",
    },
  },
  { timestamps: true }
);

const Class = mongoose.model("Class", classSchema);

module.exports = Class;
