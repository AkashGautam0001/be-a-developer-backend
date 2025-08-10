const Class = require("../models/class.model");
const Course = require("../models/course.model");
const Enrollment = require("../models/enrollment.model");

// Get classes for enrolled course (user)

//router.get("/my-classes/:courseId", authenticateUser,
const getClassesOfEnrollmentsByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if user is enrolled and has access
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
      status: { $in: ["confirmed", "active"] },
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Please enroll first.",
      });
    }

    let classes;

    if (enrollment.status === "confirmed" && !enrollment.paymentMethod) {
      // Show only demo classes
      classes = await Class.find({
        course: courseId,
        type: "DEMO",
        isActive: true,
      }).sort({ scheduledAt: 1 });
    } else if (enrollment.status === "ACTIVE") {
      // Show all classes
      classes = await Class.find({
        course: courseId,
        isActive: true,
      }).sort({ scheduledAt: 1 });
    }

    res.json({
      success: true,
      classes,
      enrollmentStatus: enrollment.status,
      paymentMethod: enrollment.paymentMethod,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// Create class (admin)
// router.post("/", authenticateAdmin,

const createClass = async (req, res) => {
  try {
    const { courseId, title, zoomLink, scheduledAt, duration, type } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const newClass = new Class({
      course: courseId,
      title,
      zoomLink,
      scheduledAt: new Date(scheduledAt),
      duration,
      type: type || "regular",
    });

    await newClass.save();

    res.json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update class (admin)
// router.put("/:id", authenticateAdmin,
const updateClass = async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.json({
      success: true,
      message: "Class updated successfully",
      class: updatedClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete class (admin)
// router.delete("/:id", authenticateAdmin,
const deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!deletedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all classes for a course (admin)
// router.get("/course/:courseId", authenticateAdmin,
const getAllClassesForACourse = async (req, res) => {
  try {
    const classes = await Class.find({
      course: req.params.courseId,
    }).sort({ scheduledAt: 1 });

    res.json({
      success: true,
      classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getClassesOfEnrollmentsByCourseId,
  createClass,
  updateClass,
  deleteClass,
  getAllClassesForACourse,
};
