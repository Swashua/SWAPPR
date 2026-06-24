// Cleans dirty department_reserved values scraped (uncleaned) into courses.db:
// splits compound "(N)"-joined rows, maps known abbreviations, Title Cases,
// dedupes case-insensitively, and sorts.

const SMALL_WORDS = new Set([
  "of", "and", "the", "in", "for", "to", "a", "an", "or",
]);

const ABBREVIATIONS = {
  // "DCISM - ..." is the same unit as the full department name below.
  DCISM: "Department of Computer, Information Sciences and Mathematics",
};

function titleCaseDept(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) =>
      i > 0 && SMALL_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function cleanDepartments(rawValues) {
  const seen = new Map(); // lowercase key -> display name
  for (const raw of rawValues) {
    if (!raw) continue;
    for (const part of raw.split(/\s*\(\d+\)\s*/)) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const abbrevKey = trimmed.split(/[\s-]+/)[0].toUpperCase();
      const name = ABBREVIATIONS[abbrevKey] || titleCaseDept(trimmed);

      const key = name.toLowerCase();
      if (!seen.has(key)) seen.set(key, name);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

module.exports = { cleanDepartments };
