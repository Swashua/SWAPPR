(function (root) {
  const app = (root.SWAPPR = root.SWAPPR || {});

  app.loadSidebar = async function loadSidebar() {
    await app.loadTop();
    await app.loadRecent();
  };

  app.loadTop = async function loadTop() {
    try {
      const data = await app.api.getTopPortfolios();
      const container = document.getElementById("sidebarTop");
      if (!container) return;

      container.innerHTML = "";
      data.portfolios?.forEach((notebook) => {
        const div = document.createElement("div");
        div.className =
          "text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition cursor-pointer";
        div.textContent = notebook.title;
        container.appendChild(div);
      });
    } catch {}
  };

  app.loadRecent = async function loadRecent() {
    try {
      const data = await app.api.getRecentPortfolios();
      const container = document.getElementById("sidebarRecent");
      if (!container) return;

      container.innerHTML = "";
      data.portfolios?.forEach((notebook) => {
        const div = document.createElement("div");
        div.className = "text-xs";
        div.textContent = notebook.title;
        container.appendChild(div);
      });
    } catch {}
  };
})(window);
