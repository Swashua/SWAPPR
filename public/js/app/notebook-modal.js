(function (root) {
  const app = (root.SWAPPR = root.SWAPPR || {});

  app.clearPortfolioForm = function clearPortfolioForm() {
    const titleInput = document.getElementById("newTitle");
    const descriptionInput = document.getElementById("newDescription");
    const deptInput = document.getElementById("newDept");
    const fileUrlInput = document.getElementById("newFileUrl");
    const actionBtn = document.getElementById("portfolioActionBtn");

    if (titleInput) titleInput.value = "";
    if (descriptionInput) descriptionInput.value = "";
    if (deptInput) deptInput.value = "";
    if (fileUrlInput) fileUrlInput.value = "";
    if (actionBtn) actionBtn.textContent = "Publish Notebook";
  };

  app.openAddModal = function openAddModal() {
    app.state.editingNotebookId = null;
    document.getElementById("modalHeading").textContent = "New Notebook";
    app.clearPortfolioForm();

    if (app.state.selectedDepartment) {
      selectDepartment(app.state.selectedDepartment);
    }

    document.getElementById("addModal").classList.remove("hidden");
    setTimeout(() => root.lucide?.createIcons(), 100);
  };

  function selectDepartment(selectedDepartment) {
    const deptInput = document.getElementById("newDept");
    if (!deptInput) return;

    const existingOption = Array.from(deptInput.options).find(
      (option) =>
        option.value.toLowerCase() === selectedDepartment.toLowerCase() ||
        option.text.toLowerCase().includes(selectedDepartment.toLowerCase()),
    );

    if (existingOption) {
      deptInput.value = existingOption.value;
      return;
    }

    const customOption = document.createElement("option");
    customOption.value = selectedDepartment;
    customOption.text = selectedDepartment;
    deptInput.appendChild(customOption);
    deptInput.value = selectedDepartment;
  }

  app.openEditNotebookModal = function openEditNotebookModal(notebook) {
    app.state.editingNotebookId = notebook.id;
    document.getElementById("modalHeading").textContent = "Edit Notebook";
    document.getElementById("newTitle").value = notebook.title || "";
    document.getElementById("newDescription").value = notebook.description || "";
    document.getElementById("newDept").value = notebook.department || "";
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
