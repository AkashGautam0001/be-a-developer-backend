const express = require("express");
const adminControllers = require("../controllers/admin.controller");
const { authenticateAdmin } = require("../middlewares/auth.middlewares");
const router = express.Router();

router.post("/register", adminControllers.register);
router.post("/login", adminControllers.login);
router.post("/logout", authenticateAdmin, adminControllers.logout);
router.get("/me", authenticateAdmin, adminControllers.getCurrentAdmin);
router.get(
  "/dashboard-stats",
  authenticateAdmin,
  adminControllers.dashboardStats
);
router.get(
  "/enrollments",
  authenticateAdmin,
  adminControllers.getAllEnrollments
);
router.get(
  "/payment-pending",
  authenticateAdmin,
  adminControllers.getPaymentPendingUsers
);
router.get(
  "/monthly-remainders",
  authenticateAdmin,
  adminControllers.getMonthlyPaymentReminders
);
router.post("/courses", adminControllers.createCourse);
router.put("/courses/:id", adminControllers.updateCourse);
// router.delete("/courses/:id", authenticateAdmin.deleteCourse);
router.get(
  "/courses",
  // authenticateAdmin,
  adminControllers.getAllCoursesAdminView
);

module.exports = router;
