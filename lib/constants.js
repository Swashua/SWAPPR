/**
 * Shared constants for the SWAPPR application.
 */

const { courseMap } = require("./course_mapper");

const COURSE_TO_DEPARTMENT = Object.fromEntries(
  Object.entries(courseMap).map(([course, details]) => [
    course,
    details.department,
  ]),
);

module.exports = {
  COURSE_TO_DEPARTMENT,
};
