// Run: node lib/cleanDepartments.test.js
const assert = require("assert");
const { cleanDepartments } = require("./cleanDepartments");

// Compound "(N)" rows split into separate departments
const split = cleanDepartments([
  "DEPARTMENT OF TEACHER EDUCATION (20) DEPARTMENT OF SCIENCE AND MATHEMATICS EDUCATION",
]);
assert.deepStrictEqual(split, [
  "Department of Science and Mathematics Education",
  "Department of Teacher Education",
]);

// DCISM abbreviation maps to canonical full name
assert.deepStrictEqual(cleanDepartments(["DCISM - MATHEMATICS SECTION"]), [
  "Department of Computer, Information Sciences and Mathematics",
]);

// All-caps -> Title Case, small words stay lowercase
assert.deepStrictEqual(cleanDepartments(["DEPARTMENT OF BIOLOGY"]), [
  "Department of Biology",
]);

// Duplicate after cleaning collapses to one (DCISM == full name row)
assert.deepStrictEqual(
  cleanDepartments([
    "DCISM - MATHEMATICS SECTION",
    "DEPARTMENT OF COMPUTER, INFORMATION SCIENCES AND MATHEMATICS",
  ]),
  ["Department of Computer, Information Sciences and Mathematics"],
);

// Ampersand and commas preserved
assert.deepStrictEqual(
  cleanDepartments(["DEPARTMENT OF ELECTRICAL & ELECTRONICS ENGINEERING"]),
  ["Department of Electrical & Electronics Engineering"],
);

console.log("ok - cleanDepartments self-check passed");
