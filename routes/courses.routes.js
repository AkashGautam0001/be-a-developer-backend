const express = require("express");
const courseControllers = require("../controllers/courses.controller");
const router = express.Router();

router.get("/", courseControllers.getAllActiveCourses);
router.get("/:id", courseControllers.getSingleCourse);

module.exports = router;
