const express = require("express");
const { authenticateUser } = require("../middlewares/auth.middlewares");
const enrollmentControllers = require("../controllers/enrollments.controller");
const router = express.Router();

router.post("/create-enrollment", enrollmentControllers.createEnrollment);

router.get(
  "/my-enrollments",
  authenticateUser,
  enrollmentControllers.getMyEnrollments
);

module.exports = router;
