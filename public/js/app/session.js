(function (root) {
  const app = (root.SWAPPR = root.SWAPPR || {});

  app.loadUser = function loadUser() {
    const stored = sessionStorage.getItem("currentUser");
    if (stored && stored !== "undefined" && stored !== "null") {
      try {
        app.state.currentUser = JSON.parse(stored);
      } catch {
        app.state.currentUser = null;
      }
    }

    const currentUser = app.state.currentUser;
    if (currentUser && currentUser.username) {
      document.getElementById("userBadge")?.classList.remove("hidden");
      document.getElementById("addPortfolioBtn")?.classList.remove("hidden");

      const userBadgeName = document.getElementById("userBadgeName");
      if (userBadgeName) userBadgeName.textContent = currentUser.name;
      return;
    }

    window.location.href = "login.html";
  };

  app.handleLogout = function handleLogout() {
    sessionStorage.removeItem("currentUser");
    window.location.href = "login.html";
  };
})(window);
