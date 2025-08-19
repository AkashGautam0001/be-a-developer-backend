const express = require("express");
const courseControllers = require("../controllers/courses.controller");
const router = express.Router();

router.get("/", courseControllers.getAllActiveCourses);
router.get("/:slug", courseControllers.getSingleCourse);

module.exports = router;
