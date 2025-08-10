const Course = require("../models/course.model");
const Enrollment = require("../models/enrollment.model");
const User = require("../models/user.model");

//router.post("/", authenticateUser, createEnrollment);
const createEnrollment = async (req, res) => {
  try {
    const { courseId, name, phone, email, address, city, state, pincode, age } =
      req.body;

    // Validate required fields
    if (
      !courseId ||
      !name ||
      !phone ||
      !email ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !age
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if user already exists
    let user = await User.findOne({ phone });

    if (user) {
      // Check if already enrolled in this course
      const existingEnrollment = await Enrollment.findOne({
        user: user._id,
        course: courseId,
      });

      if (existingEnrollment) {
        return res.status(400).json({
          success: false,
          message: "Already enrolled in this course",
        });
      }
    } else {
      // Create new user
      user = new User({
        name,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        age,
      });
      await user.save();
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: user._id,
      course: courseId,
      status: "PENDING_CONFIRMATION",
    });
    await enrollment.save();

    res.json({
      success: true,
      message: "Registration successful. Please proceed to payment.",
      enrollmentId: enrollment._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get user enrollments
// router.get("/my-enrollments", authenticateUser,
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      user: "6898581a5cb7409300a71f0d",
    })
      .populate("course")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      enrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { createEnrollment, getMyEnrollments };
