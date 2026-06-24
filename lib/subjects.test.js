// Run: node lib/subjects.test.js
const assert = require("assert");
const { codePrefix, filterSubjects } = require("./subjects");

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

console.log("subjects.test.js OK");
