#!/usr/bin/env node

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSITY COURSE → DEPARTMENT MAP
// University of San Carlos (USC)
// ─────────────────────────────────────────────────────────────────────────────

const courseMap = {

  // ── School of Architecture, Fine Arts and Design ─────────────────────────

  "Bachelor of Science in Architecture": {
    school: "School of Architecture, Fine Arts and Design",
    department: "Department of Architecture",
  },
  "Bachelor of Landscape Architecture": {
    school: "School of Architecture, Fine Arts and Design",
    department: "Department of Architecture",
  },
  "Bachelor of Science in Interior Design": {
    school: "School of Architecture, Fine Arts and Design",
    department: "Department of Architecture",
  },
  "Bachelor of Fine Arts major in Advertising Arts": {
    school: "School of Architecture, Fine Arts and Design",
    department: "Department of Fine Arts",
  },
  "Bachelor of Fine Arts major in Cinema": {
    school: "School of Architecture, Fine Arts and Design",
    department: "Department of Fine Arts",
  },

  // ── School of Arts and Sciences ──────────────────────────────────────────

  "Bachelor of Arts in Anthropology": {
    school: "School of Arts and Sciences",
    department: "Department of Sociology, Anthropology and History",
  },
  "Bachelor of Science in Biology": {
    school: "School of Arts and Sciences",
    department: "Department of Biology",
  },
  "Bachelor of Science in Marine Biology": {
    school: "School of Arts and Sciences",
    department: "Department of Biology",
  },
  "Bachelor of Science in Chemistry": {
    school: "School of Arts and Sciences",
    department: "Department of Chemistry",
  },
  "Bachelor of Arts in English Language Studies": {
    school: "School of Arts and Sciences",
    department: "Department of Communications, Linguistics and Literature",
  },
  "Bachelor of Arts in Literary and Cultural Studies with Creative Writing": {
    school: "School of Arts and Sciences",
    department: "Department of Communications, Linguistics and Literature",
  },
  "Bachelor of Arts in Communication major in Media": {
    school: "School of Arts and Sciences",
    department: "Department of Communications, Linguistics and Literature",
  },
  "Bachelor of Science in Computer Science": {
    school: "School of Arts and Sciences",
    department: "Department of Computer, Information Sciences and Mathematics",
  },
  "Bachelor of Science in Information Systems": {
    school: "School of Arts and Sciences",
    department: "Department of Computer, Information Sciences and Mathematics",
  },
  "Bachelor of Science in Information Technology": {
    school: "School of Arts and Sciences",
    department: "Department of Computer, Information Sciences and Mathematics",
  },
  "Bachelor of Science in Data Science": {
    school: "School of Arts and Sciences",
    department: "Department of Computer, Information Sciences and Mathematics",
  },
  "Bachelor of Philosophy": {
    school: "School of Arts and Sciences",
    department: "Department of Philosophy",
  },
  "Bachelor of Science in Applied Physics": {
    school: "School of Arts and Sciences",
    department: "Department of Physics",
  },
  "Bachelor of Science in Psychology": {
    school: "School of Arts and Sciences",
    department: "Department of Psychology",
  },

  // ── School of Health Care Professions ────────────────────────────────────

  "Bachelor of Science in Nursing": {
    school: "School of Health Care Professions",
    department: "Department of Nursing",
  },
  "Bachelor of Science in Nutrition and Dietetics": {
    school: "School of Health Care Professions",
    department: "Department of Nutrition and Dietetics",
  },
  "Bachelor of Science in Pharmacy": {
    school: "School of Health Care Professions",
    department: "Department of Pharmacy",
  },

  // ── School of Business and Economics ─────────────────────────────────────

  "Bachelor of Science in Accountancy": {
    school: "School of Business and Economics",
    department: "Department of Accountancy",
  },
  "Bachelor of Science in Management Accounting": {
    school: "School of Business and Economics",
    department: "Department of Accountancy",
  },
  "Bachelor of Science in Internal Auditing": {
    school: "School of Business and Economics",
    department: "Department of Accountancy",
  },
  "Bachelor of Science in Business Administration major in Financial Management": {
    school: "School of Business and Economics",
    department: "Department of Business Administration",
  },
  "Bachelor of Science in Business Administration major in Human Resource Management": {
    school: "School of Business and Economics",
    department: "Department of Business Administration",
  },
  "Bachelor of Science in Business Administration major in Marketing Management": {
    school: "School of Business and Economics",
    department: "Department of Business Administration",
  },
  "Bachelor of Science in Business Administration major in Operations Management": {
    school: "School of Business and Economics",
    department: "Department of Business Administration",
  },
  "Bachelor of Science in Entrepreneurship": {
    school: "School of Business and Economics",
    department: "Department of Business Administration",
  },
  "Bachelor of Science in Economics": {
    school: "School of Business and Economics",
    department: "Department of Economics",
  },
  "Bachelor of Science in Hospitality Management": {
    school: "School of Business and Economics",
    department: "Department of Hospitality and Tourism",
  },
  "Bachelor of Science in Tourism Management": {
    school: "School of Business and Economics",
    department: "Department of Hospitality and Tourism",
  },
  "Diploma in Culinary Arts": {
    school: "School of Business and Economics",
    department: "Department of Hospitality and Tourism",
  },

  // ── School of Education ───────────────────────────────────────────────────

  "Bachelor of Secondary Education major in Science": {
    school: "School of Education",
    department: "Department of Teacher Education",
  },
  "Bachelor of Secondary Education major in Mathematics": {
    school: "School of Education",
    department: "Department of Teacher Education",
  },
  "Bachelor of Special Needs Education specialization in Early Childhood Education-Montessori Education": {
    school: "School of Education",
    department: "Department of Teacher Education",
  },

  // ── School of Engineering ─────────────────────────────────────────────────

  "Bachelor of Science in Chemical Engineering": {
    school: "School of Engineering",
    department: "Department of Chemical Engineering",
  },
  "Bachelor of Science in Civil Engineering": {
    school: "School of Engineering",
    department: "Department of Civil Engineering",
  },
  "Bachelor of Science in Computer Engineering": {
    school: "School of Engineering",
    department: "Department of Computer Engineering",
  },
  "Bachelor of Science in Electrical Engineering": {
    school: "School of Engineering",
    department: "Department of Electrical & Electronics Engineering",
  },
  "Bachelor of Science in Electronics Engineering": {
    school: "School of Engineering",
    department: "Department of Electrical & Electronics Engineering",
  },
  "Bachelor of Science in Industrial Engineering": {
    school: "School of Engineering",
    department: "Department of Industrial Engineering",
  },
  "Bachelor of Science in Mechanical Engineering": {
    school: "School of Engineering",
    department: "Department of Mechanical and Manufacturing Engineering",
  },

  // ── School of Law and Governance ─────────────────────────────────────────

  "Bachelor of Arts in Political Science major in International Relations and Foreign Service": {
    school: "School of Law and Governance",
    department: "Department of Political Science",
  },
  "Bachelor of Arts in Political Science major in Law and Policy Studies": {
    school: "School of Law and Governance",
    department: "Department of Political Science",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** Return the entry for an exact course name, or null. */
function lookup(courseName) {
  return courseMap[courseName] ?? null;
}

/** Return all courses belonging to a given department. */
function byDepartment(deptName) {
  return Object.entries(courseMap)
    .filter(([, v]) => v.department === deptName)
    .map(([course, v]) => ({ course, ...v }));
}

/** Return all courses belonging to a given school. */
function bySchool(schoolName) {
  return Object.entries(courseMap)
    .filter(([, v]) => v.school === schoolName)
    .map(([course, v]) => ({ course, ...v }));
}

/** Print a formatted summary of the full map, grouped by school → department. */
function printFullMap() {
  // Build school → dept → [courses] tree
  const tree = {};
  for (const [course, { school, department }] of Object.entries(courseMap)) {
    if (!tree[school]) tree[school] = {};
    if (!tree[school][department]) tree[school][department] = [];
    tree[school][department].push({ course });
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║         UNIVERSITY OF SAN CARLOS — COURSE MAP               ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  for (const [school, depts] of Object.entries(tree)) {
    console.log(`🏫  ${school}`);
    for (const [dept, courses] of Object.entries(depts)) {
      console.log(`  📂  ${dept}`);
      for (const { course } of courses) {
        console.log(`       • ${course}`);
      }
    }
    console.log();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE CLI
// ─────────────────────────────────────────────────────────────────────────────

const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function searchFlow() {
  const query = (await ask("\n  Enter course name (or part of it): ")).trim().toLowerCase();
  const matches = Object.entries(courseMap).filter(([name]) =>
    name.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    console.log("  ⚠️  No matching courses found.");
    return;
  }

  console.log(`\n  Found ${matches.length} result(s):\n`);
  for (const [course, { school, department }] of matches) {
    console.log(`  📘  ${course}`);
    console.log(`      School     : ${school}`);
    console.log(`      Department : ${department}\n`);
  }
}

async function deptFlow() {
  const query = (await ask("\n  Enter department name (or part of it): ")).trim().toLowerCase();
  const results = Object.entries(courseMap)
    .filter(([, v]) => v.department.toLowerCase().includes(query))
    .map(([course, v]) => ({ course, ...v }));

  if (results.length === 0) {
    console.log("  ⚠️  No courses found for that department.");
    return;
  }

  const dept = results[0].department;
  console.log(`\n  Courses under "${dept}":\n`);
  for (const { course, school } of results) {
    console.log(`  • ${course}`);
    console.log(`    School : ${school}\n`);
  }
}

async function mainMenu() {
  while (true) {
    console.log("\n════════════════════════════════════════════════");
    console.log("  USC COURSE MAPPER");
    console.log("════════════════════════════════════════════════");
    console.log("  1. Search for a course");
    console.log("  2. Browse by department");
    console.log("  3. Print full map");
    console.log("  4. Exit");
    console.log("────────────────────────────────────────────────");

    const choice = (await ask("  Choose (1-4): ")).trim();
    switch (choice) {
      case "1": await searchFlow(); break;
      case "2": await deptFlow();   break;
      case "3": printFullMap();     break;
      case "4":
        console.log("\n  Goodbye! 👋\n");
        rl.close();
        process.exit(0);
        break;
      default:
        console.log("  ⚠️  Enter 1–4.");
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS  (for use as a module)
// ─────────────────────────────────────────────────────────────────────────────

module.exports = { courseMap, lookup, byDepartment, bySchool };

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT  (only when run directly)
// ─────────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const total = Object.keys(courseMap).length;
  console.log(`\n  ${total} courses loaded across 7 schools.\n`);
  mainMenu();
}
