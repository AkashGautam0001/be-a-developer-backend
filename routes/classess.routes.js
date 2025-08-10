const express = require("express");
const {
  authenticateUser,
  authenticateAdmin,
} = require("../middlewares/auth.middlewares");
const classesControllers = require("../controllers/classess.controller");
const router = express.Router();

router.get(
  "/my-classes/:courseId",
  authenticateUser,
  classesControllers.getClassesOfEnrollmentsByCourseId
);
router.post("/", authenticateAdmin, classesControllers.createClass);
router.put("/:id", authenticateAdmin, classesControllers.updateClass);
router.delete("/:id", authenticateAdmin, classesControllers.deleteClass);
router.get(
  "/course/:courseId",
  authenticateAdmin,
  classesControllers.getAllClassesForACourse
);
module.exports = router;
