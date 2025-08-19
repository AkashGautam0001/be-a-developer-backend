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
const getSingleCourse = async (req, res) => {
  try {
    // const course = await Course.findOne({
    //   $or: [{ slug: req.params.slug }, { _id: req.params.slug }],
    // });

    const course = await Course.findOne({ slug: req.params.slug });
    console.log(course);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Get demo classes
    const demoClasses = await Class.find({
      course: course._id,
      type: "WEBINAR",
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
      message: error.message,
    });
  }
};

module.exports = { getAllActiveCourses, getSingleCourse };
