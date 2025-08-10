const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const User = require("../models/user.model");
const Course = require("../models/course.model");
const Enrollment = require("../models/enrollment.model");
const Payment = require("../models/payment.model");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Create JWT token
    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    // Set cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    res.json({
      success: true,
      message: "Login successful",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const logout = (req, res) => {
  res.clearCookie("adminToken");
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// Get dashboard stats
const dashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments({ isActive: true });
    const totalEnrollments = await Enrollment.countDocuments();

    const confirmationFeePaid = await Enrollment.countDocuments({
      confirmationFeePaid: true,
    });
    const confirmationFeePending = await Enrollment.countDocuments({
      confirmationFeePaid: false,
    });

    const activeSubscriptions = await Enrollment.countDocuments({
      status: "active",
    });

    const monthlySubscribers = await Enrollment.countDocuments({
      paymentMethod: "monthly",
      status: "active",
    });

    const fullPaymentSubscribers = await Enrollment.countDocuments({
      paymentMethod: "full",
      status: "active",
    });

    // Revenue calculations
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        confirmationFeePaid,
        confirmationFeePending,
        activeSubscriptions,
        monthlySubscribers,
        fullPaymentSubscribers,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// Get all enrollments with user and course details
const getAllEnrollments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const enrollments = await Enrollment.find()
      .populate("user", "name phone email")
      .populate("course", "title price monthlyPrice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Enrollment.countDocuments();

    res.json({
      success: true,
      enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get payment pending users
const getPaymentPendingUsers = async (req, res) => {
  try {
    const pendingConfirmation = await Enrollment.find({
      confirmationFeePaid: false,
    })
      .populate("user", "name phone email")
      .populate("course", "title")
      .sort({ createdAt: -1 });

    const pendingSubscription = await Enrollment.find({
      confirmationFeePaid: true,
      paymentMethod: null,
    })
      .populate("user", "name phone email")
      .populate("course", "title")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      pendingConfirmation,
      pendingSubscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get monthly payment reminders
const getMonthlyPaymentReminders = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const monthlySubscribers = await Enrollment.find({
      paymentMethod: "monthly",
      status: "active",
    })
      .populate("user", "name phone email")
      .populate("course", "title monthlyPrice");

    const reminders = [];

    for (const enrollment of monthlySubscribers) {
      const hasCurrentMonthPayment = enrollment.monthlyPayments.some(
        (payment) =>
          payment.month === currentMonth &&
          payment.year === currentYear &&
          payment.status === "paid"
      );

      if (!hasCurrentMonthPayment) {
        reminders.push({
          enrollment: enrollment._id,
          user: enrollment.user,
          course: enrollment.course,
          dueAmount: enrollment.course.monthlyPrice,
          dueMonth: currentMonth,
          dueYear: currentYear,
        });
      }
    }

    res.json({
      success: true,
      reminders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create/Update course
const createCourse = async (req, res) => {
  try {
    const { title, description, price, monthlyPrice, duration, image } =
      req.body;

    const course = new Course({
      title,
      description,
      price,
      monthlyPrice,
      duration,
      image,
    });

    await course.save();

    res.json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.json({
      success: true,
      message: "Course deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all courses (admin view)
const getAllCoursesAdminView = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
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

module.exports = {
  getPaymentPendingUsers,
  getMonthlyPaymentReminders,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCoursesAdminView,
  getAllEnrollments,
  login,
  logout,
  dashboardStats,
};
