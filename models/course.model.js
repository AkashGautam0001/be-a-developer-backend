const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      // required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    demoClasses: [
      {
        title: String,
        zoomLink: String,
        scheduledAt: Date,
        duration: Number, // in minutes
      },
    ],
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
