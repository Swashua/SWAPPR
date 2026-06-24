/**
 * Pure subject-filtering helpers. No DB access - operates on plain row objects
 * shaped { course_code, course_description }.
 */

/** Leading letters of a course code, upper-cased. "" for empty/missing. */
function codePrefix(courseCode) {
  const m = String(courseCode || "").trim().match(/^[A-Za-z]+/);
  return m ? m[0].toUpperCase() : "";
}

/**
 * Filter rows to those whose code prefix is in `prefixes` (empty `prefixes`
 * keeps everything), de-duplicate N-suffix variants, and return
 * { code, description } sorted by code.
 */
function filterSubjects(rows, prefixes) {
  const want = new Set(prefixes);
  const keep = (r) => want.size === 0 || want.has(codePrefix(r.course_code));

  // Dedupe key = numeric stem (trailing letters after the number stripped)
  // + description. Two rows collide only when they are the same subject with
  // and without a trailing letter (e.g. "CS 3106" vs "CS 3106N").
  const byKey = new Map();
  for (const r of rows) {
    if (!keep(r)) continue;
    const code = String(r.course_code || "").trim();
    const stem = code.replace(/[A-Za-z]+$/, "").trim(); // drop trailing letters
    const key = stem + "|" + String(r.course_description || "").trim().toUpperCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, r);
      continue;
    }
    const existingHasSuffix = /[A-Za-z]$/.test(String(existing.course_code || "").trim());
    const currentHasSuffix = /[A-Za-z]$/.test(code);
    if (currentHasSuffix && !existingHasSuffix) byKey.set(key, r);
  }

  return [...byKey.values()]
    .map((r) => ({
      code: String(r.course_code || "").trim(),
      description: String(r.course_description || "").trim(),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

module.exports = { codePrefix, filterSubjects };
