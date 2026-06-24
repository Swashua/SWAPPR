(function (root) {
  const app = (root.SWAPPR = root.SWAPPR || {});

  app.openProfilePanel = async function openProfilePanel() {
    try {
      const username = app.state.currentUser.username;
      const data = await app.api.getProfile(username);
      if (!data.success) return;

      const profile = data.profile;
      document.getElementById("profileName").textContent = profile.name;
      document.getElementById("profileUsername").textContent = `@${profile.username}`;
      document.getElementById("profileBio").textContent = profile.bio || "";
      document.getElementById("profilePortfolioCount").textContent =
        profile.portfolios.length;

      const swappCountEl = document.getElementById("profileSwappCount");
      if (swappCountEl) swappCountEl.textContent = profile.matches?.length || 0;

      const initialsEl = document.getElementById("profileInitials");
      if (initialsEl && profile.name) {
        initialsEl.textContent = profile.name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      }

      renderTrustScore(profile);
      renderProfileLists(profile);

      document.getElementById("profilePanel").classList.add("open");
      document.getElementById("profileOverlay").classList.add("active");
      setTimeout(() => root.lucide?.createIcons(), 100);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  function renderTrustScore(profile) {
    const trustScoreValue = profile.trustScore ?? "100%";
    const trustScoreEl = document.getElementById("profileTrustScore");
    if (!trustScoreEl) return;

    trustScoreEl.textContent = trustScoreValue;
    trustScoreEl.classList.remove(
      "text-green-500",
      "dark:text-green-400",
      "text-yellow-500",
      "dark:text-yellow-400",
      "text-red-500",
      "dark:text-red-400",
      "text-purple-700",
      "dark:text-purple-300",
    );

    const numericScore = parseInt(trustScoreValue);
    if (numericScore >= 95) {
      trustScoreEl.classList.add("text-green-500", "dark:text-green-400");
    } else if (numericScore >= 85) {
      trustScoreEl.classList.add("text-yellow-500", "dark:text-yellow-400");
    } else if (numericScore >= 70) {
      trustScoreEl.classList.add("text-red-500", "dark:text-red-400");
    } else {
      trustScoreEl.classList.add("text-purple-700", "dark:text-purple-300");
    }
  }

  function renderProfileLists(profile) {
    const portfolioList = document.getElementById("profilePortfolioList");
    portfolioList.innerHTML = "";
    profile.portfolios.forEach((portfolio) => {
      const div = document.createElement("div");
      div.className =
        "text-sm py-1 border-b border-purple-100 dark:border-white/[0.05]";
      div.textContent = portfolio.title;
      portfolioList.appendChild(div);
    });

    const matchList = document.getElementById("profileMatchList");
    if (!matchList) return;

    matchList.innerHTML = profile.matches?.length
      ? profile.matches
          .map((username) => `<div class="text-xs text-purple-400">@${username}</div>`)
          .join("")
      : `<p class="text-xs text-purple-300">No matches yet.</p>`;
  }

  app.closeProfilePanel = function closeProfilePanel() {
    document.getElementById("profilePanel").classList.remove("open");
    document.getElementById("profileOverlay").classList.remove("active");
  };
})(window);
