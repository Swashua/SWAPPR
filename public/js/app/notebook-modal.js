(function (root) {
  const app = (root.SWAPPR = root.SWAPPR || {});

  app.clearPortfolioForm = function clearPortfolioForm() {
    const titleInput = document.getElementById("newTitle");
    const descriptionInput = document.getElementById("newDescription");
    const subjectInput = document.getElementById("newSubject");
    const fileUrlInput = document.getElementById("newFileUrl");
    const actionBtn = document.getElementById("portfolioActionBtn");

    if (titleInput) titleInput.value = "";
    if (descriptionInput) descriptionInput.value = "";
    if (subjectInput) subjectInput.value = "";
    if (fileUrlInput) fileUrlInput.value = "";
    if (actionBtn) actionBtn.textContent = "Publish Notebook";
  };

  app.openAddModal = function openAddModal() {
    app.state.editingNotebookId = null;
    document.getElementById("modalHeading").textContent = "New Notebook";
    app.clearPortfolioForm();

    // Pre-select the subject the user drilled into, if any.
    if (app.state.selectedSubject) {
      selectSubject(app.state.selectedSubject);
    }

    document.getElementById("addModal").classList.remove("hidden");
    setTimeout(() => root.lucide?.createIcons(), 100);
  };

  // Form-prefill helper: set the upload form's subject select to `code`,
  // adding an option if the code isn't already in the list.
  function selectSubject(code) {
    const subjectInput = document.getElementById("newSubject");
    if (!subjectInput || !code) return;

    const existingOption = Array.from(subjectInput.options).find(
      (option) => option.value === code,
    );

    if (existingOption) {
      subjectInput.value = code;
      return;
    }

    const customOption = document.createElement("option");
    customOption.value = code;
    customOption.text = code;
    subjectInput.appendChild(customOption);
    subjectInput.value = code;
  }

  app.openEditNotebookModal = function openEditNotebookModal(notebook) {
    app.state.editingNotebookId = notebook.id;
    document.getElementById("modalHeading").textContent = "Edit Notebook";
    document.getElementById("newTitle").value = notebook.title || "";
    document.getElementById("newDescription").value = notebook.description || "";
    selectSubject(notebook.course_code || "");
    document.getElementById("newFileUrl").value = notebook.file_url || "";

    const actionBtn = document.getElementById("portfolioActionBtn");
    if (actionBtn) actionBtn.textContent = "Save Changes";

    document.getElementById("addModal").classList.remove("hidden");
    setTimeout(() => root.lucide?.createIcons(), 100);
  };

  app.closeAddModal = function closeAddModal(event) {
    if (!event || event.target.id === "addModal") {
      document.getElementById("addModal").classList.add("hidden");
      app.state.editingNotebookId = null;
      app.clearPortfolioForm();
    }
  };
})(window);
