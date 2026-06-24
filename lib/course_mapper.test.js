// Run: node lib/course_mapper.test.js
const assert = require("assert");
const {
  subjectPrefixesFor,
  PROGRAM_PREFIXES,
  DEPARTMENT_SHARED_PREFIXES,
} = require("./course_mapper");

// CS program gets its own prefix AND the DCISM shared core, not sibling prefixes.
const cs = subjectPrefixesFor("Bachelor of Science in Computer Science");
assert.ok(cs.includes("CS"), "CS own prefix present");
assert.ok(cs.includes("CIS"), "CIS shared prefix present");
assert.ok(!cs.includes("IT"), "must not include sibling IT prefix");
assert.ok(!cs.includes("IS"), "must not include sibling IS prefix");

// Shared prefix appears for EVERY program in the department.
const it = subjectPrefixesFor("Bachelor of Science in Information Technology");
const is = subjectPrefixesFor("Bachelor of Science in Information Systems");
assert.ok(it.includes("CIS") && is.includes("CIS"), "CIS shared across DCISM");
assert.ok(it.includes("IT") && !it.includes("CS"), "IT own, no CS");

// Result is de-duplicated (no prefix twice).
assert.strictEqual(new Set(cs).size, cs.length, "no duplicate prefixes");

// Unknown program -> empty array (triggers the all-subjects fallback downstream).
assert.deepStrictEqual(subjectPrefixesFor("No Such Program"), []);

// Data integrity: every program key in PROGRAM_PREFIXES exists in courseMap.
const { courseMap } = require("./course_mapper");
for (const program of Object.keys(PROGRAM_PREFIXES)) {
  assert.ok(courseMap[program], `PROGRAM_PREFIXES key not in courseMap: ${program}`);
}
// Every department key in DEPARTMENT_SHARED_PREFIXES is a real department.
const realDepts = new Set(Object.values(courseMap).map((e) => e.department));
for (const dept of Object.keys(DEPARTMENT_SHARED_PREFIXES)) {
  assert.ok(realDepts.has(dept), `shared-prefix dept not in courseMap: ${dept}`);
}

// Universal subjects (NSTP, GE, TPE, EDM) are added to every known program.
const { UNIVERSAL_PREFIXES } = require("./course_mapper");
assert.deepStrictEqual(
  UNIVERSAL_PREFIXES,
  ["NSTP", "GE", "TPE", "EDM"],
  "universal prefix set is exactly these four"
);
for (const p of UNIVERSAL_PREFIXES) {
  assert.ok(cs.includes(p), `CS program includes universal prefix ${p}`);
}

// Excluded prefixes (SHS / grad / mislabeled) must never be universal.
for (const bad of ["PDEV", "FIL", "PEL", "EDMA"]) {
  assert.ok(!UNIVERSAL_PREFIXES.includes(bad), `${bad} is not universal`);
}

// A program whose own prefixes are [] still gets shared + universal prefixes.
const ds = subjectPrefixesFor("Bachelor of Science in Data Science");
assert.ok(ds.includes("CIS"), "Data Science keeps DCISM shared CIS");
assert.ok(ds.includes("GE") && ds.includes("NSTP"), "Data Science gets universals");

// Unknown program STILL returns [] — universals are not added to stale courses.
assert.deepStrictEqual(
  subjectPrefixesFor("No Such Program"),
  [],
  "unknown program returns empty, no universals"
);

console.log("course_mapper.test.js OK");
