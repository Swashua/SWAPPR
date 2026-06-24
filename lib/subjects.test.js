// Run: node lib/subjects.test.js
const assert = require("assert");
const { codePrefix, filterSubjects, subjectsForCourse } = require("./subjects");

// prefix extraction
assert.strictEqual(codePrefix("CIS 1201"), "CIS");
assert.strictEqual(codePrefix("CS 3106N"), "CS");
assert.strictEqual(codePrefix("cs 3106n"), "CS");
assert.strictEqual(codePrefix(""), "");
assert.strictEqual(codePrefix(null), "");

const rows = [
  { course_code: "CS 3106", course_description: "INFORMATION ASSURANCE AND SECURITY" },
  { course_code: "CS 3106N", course_description: "INFORMATION ASSURANCE AND SECURITY" },
  { course_code: "CIS 1201", course_description: "PROGRAMMING II" },
  { course_code: "IT 3101N", course_description: "PLATFORM TECHNOLOGIES" },
];

// Filter to CS + CIS only; IT excluded.
const out = filterSubjects(rows, ["CS", "CIS"]);
const codes = out.map((r) => r.code);
assert.ok(!codes.includes("IT 3101N"), "IT excluded");
assert.ok(codes.includes("CIS 1201"), "CIS kept");

// N-suffix dedupe keeps the suffixed variant, drops the bare one.
assert.ok(codes.includes("CS 3106N"), "suffixed variant kept");
assert.ok(!codes.includes("CS 3106"), "bare variant dropped");

// Output shape and sort order.
assert.deepStrictEqual(out, [
  { code: "CIS 1201", description: "PROGRAMMING II" },
  { code: "CS 3106N", description: "INFORMATION ASSURANCE AND SECURITY" },
]);

// Empty prefix list = all-subjects fallback (deduped).
const all = filterSubjects(rows, []);
assert.strictEqual(all.length, 3, "fallback returns all, deduped (3)");

// Feed subjects must be scoped to a known registered program.
const csSubjects = subjectsForCourse(rows, "Bachelor of Science in Computer Science");
assert.deepStrictEqual(
  csSubjects.map((r) => r.code),
  ["CIS 1201", "CS 3106N"],
  "known course returns only its mapped subject prefixes"
);
assert.deepStrictEqual(
  subjectsForCourse(rows, "BS Computer Science"),
  [],
  "unknown/stale course names must not fall back to all subjects"
);
assert.deepStrictEqual(
  subjectsForCourse(rows, ""),
  [],
  "missing course must not fall back to all subjects"
);

// Universal subjects appear for a real program alongside its own subjects;
// excluded SHS/grad prefixes do not.
const uniRows = [
  { course_code: "CS 3101", course_description: "DATA STRUCTURES" },
  { course_code: "NSTP 1", course_description: "NATIONAL SERVICE TRAINING PROGRAM 1" },
  { course_code: "GE-ETHICS", course_description: "ETHICS" },
  { course_code: "TPE 1101", course_description: "PATH-FIT 1 - MOVEMENT ENHANCEMENT" },
  { course_code: "EDM 1", course_description: "THE CAROLINIAN MISSIONARY" },
  { course_code: "PDEV 01", course_description: "PERSONAL DEVELOPMENT" },
  { course_code: "FIL 02", course_description: "PAGBASA AT PAGSUSURI" },
];
const uniOut = subjectsForCourse(
  uniRows,
  "Bachelor of Science in Computer Science"
).map((r) => r.code);

for (const code of ["CS 3101", "NSTP 1", "GE-ETHICS", "TPE 1101", "EDM 1"]) {
  assert.ok(uniOut.includes(code), `universal/own subject ${code} present`);
}
for (const code of ["PDEV 01", "FIL 02"]) {
  assert.ok(!uniOut.includes(code), `excluded SHS subject ${code} absent`);
}

console.log("subjects.test.js OK");
