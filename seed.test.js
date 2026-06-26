// Run: node seed.test.js
const assert = require("assert");
const { COURSE_TO_DEPARTMENT } = require("./lib/constants");
const { NOTEBOOKS, USERS, assertKnownCourses } = require("./seed");

assert.doesNotThrow(assertKnownCourses);

for (const user of USERS) {
  assert.ok(
    COURSE_TO_DEPARTMENT[user.course],
    `${user.username} uses a canonical mapped course`,
  );
  assert.ok(
    user.course.startsWith("Bachelor ") || user.course.startsWith("Diploma "),
    `${user.username} uses a full program name`,
  );
}

for (const notebook of NOTEBOOKS) {
  assert.ok(
    COURSE_TO_DEPARTMENT[notebook.course],
    `${notebook.title} uses a canonical mapped course`,
  );
  assert.ok(
    !("department" in notebook),
    `${notebook.title} derives department from course`,
  );
}

console.log("seed.test.js OK");
