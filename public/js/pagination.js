(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SWAPPRPagination = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function paginationItems(currentPage, totalPages, maxVisible = 7) {
    const page = Math.min(Math.max(Number(currentPage) || 1, 1), totalPages);
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages]);
    for (let n = page - 1; n <= page + 1; n += 1) {
      if (n > 1 && n < totalPages) pages.add(n);
    }
    if (page <= 2) pages.add(3);
    if (page >= totalPages - 1) pages.add(totalPages - 2);

    const sorted = [...pages].sort((a, b) => a - b);
    const tokens = [];
    for (const n of sorted) {
      const previous = tokens[tokens.length - 1];
      if (typeof previous === "number" && n - previous > 1) {
        tokens.push("ellipsis");
      }
      tokens.push(n);
    }
    return tokens;
  }

  return { paginationItems };
});
