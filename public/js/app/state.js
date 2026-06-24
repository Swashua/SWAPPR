(function (root) {
  const app = (root.SWAPPR = root.SWAPPR || {});

  app.state = {
    API: "/api",
    currentUser: null,
    currentFilter: "all",
    notebooks: [],
    swapps: [],
    editingNotebookId: null,
    selectedDepartment: null,
    currentPage: 1,
    itemsPerPage: 6,
    departments: [],
    subjects: [],
    titles: {
      all: "All Subjects",
      mine: "My Subjects",
      matched: "SWAPP Matches",
      requests: "Requests",
      top: "Top Departments",
      recent: "Recently Added",
    },
  };
})(window);
