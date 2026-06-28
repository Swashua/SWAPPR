(function (root) {
  const app = (root.SWAPPR = root.SWAPPR || {});
  const auth = app.auth;

  app.loadUser = async function loadUser() {
    app.state.currentUser = (await auth?.getUser()) || null;

    const currentUser = app.state.currentUser;
    if (currentUser && currentUser.username) {
      document.getElementById("userBadge")?.classList.remove("hidden");
      document.getElementById("addPortfolioBtn")?.classList.remove("hidden");

      const userBadgeName = document.getElementById("userBadgeName");
      if (userBadgeName) userBadgeName.textContent = currentUser.name;
      return;
    }

    window.location.replace("login.html");
  };

  app.handleLogout = async function handleLogout() {
    await auth?.clearUser();
    window.location.replace("login.html");
  };
})(window);
