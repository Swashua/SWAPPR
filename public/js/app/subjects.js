(function (root) {
  const app = (root.SWAPPR = root.SWAPPR || {});

  app.loadDepartments = async function loadDepartments() {
    try {
      const data = await app.api.getDepartments();
      app.state.departments = data.departments || [];
      app.populateDeptDropdown();
      app.renderNotebooks();
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  app.loadSubjects = async function loadSubjects() {
    try {
      const course = app.state.currentUser?.course || "";
      const data = await app.api.getSubjects(course);
      app.state.subjects = data.subjects || [];
      app.renderNotebooks();
    } catch (err) {
      console.error("Failed to load subjects:", err);
      app.state.subjects = [];
    }
  };

  app.populateDeptDropdown = function populateDeptDropdown() {
    const select = document.getElementById("newDept");
    if (!select) return;

    select.innerHTML =
      `<option value="">- Select department -</option>` +
      app.state.departments
        .map((department) => `<option value="${department}">${department}</option>`)
        .join("");
  };

  app.renderSubjectCards = function renderSubjectCards() {
    const grid = document.getElementById("notebookGrid");
    if (!grid) return;

    grid.innerHTML = "";
    grid.className = "subjects-list";

    const sectionTitle = document.getElementById("sectionTitle");
    if (sectionTitle) sectionTitle.textContent = "All Subjects";

    const sectionSubtitle = document.getElementById("sectionSubtitle");
    if (sectionSubtitle) {
      sectionSubtitle.textContent =
        "Subjects in your program. Browse shared study resources.";
    }

    if (app.state.subjects.length === 0) {
      grid.innerHTML = `<p class="text-sm text-purple-400">No subjects found for your program.</p>`;
      app.renderPagination(0);
      return;
    }

    const visibleSubjects = app.getPaginatedItems(app.state.subjects);
    app.renderPagination(app.state.subjects.length);

    visibleSubjects.forEach((subject) => {
      const card = document.createElement("div");
      card.className = "subject-card fade-in";
      card.innerHTML = `
        <div class="subject-card-inner">
          <div>
            <h3 class="subject-title">${subject.code}</h3>
            <p class="subject-desc">${subject.description || ""}</p>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  };
})(window);
