const Class = require("../models/class.model");
const Course = require("../models/course.model");

// router.get('/',
const getAllActiveCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true });
    res.json({
      success: true,
      courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get single course
// router.get('/:id',
const getSingleCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Get demo classes
    const demoClasses = await Class.find({
      course: course._id,
      type: "DEMO",
      isActive: true,
    }).sort({ scheduledAt: 1 });

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        demoClasses,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { getAllActiveCourses, getSingleCourse };
