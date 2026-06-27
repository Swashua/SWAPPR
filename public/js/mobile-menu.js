(function (root) {
  function getParts() {
    return {
      menu: document.getElementById("mobileMenu"),
      overlay: document.getElementById("mobileMenuOverlay"),
      toggle: document.getElementById("mobileMenuToggle"),
    };
  }

  function setOpen(open) {
    const { menu, overlay, toggle } = getParts();
    if (!menu || !overlay || !toggle) return;

    menu.classList.toggle("active", open);
    overlay.classList.toggle("active", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle
      .querySelector("[data-mobile-menu-icon]")
      ?.setAttribute("data-lucide", open ? "x" : "menu");
    document.body.classList.toggle("mobile-menu-open", open);
    root.lucide?.createIcons();
  }

  root.toggleMobileMenu = function toggleMobileMenu() {
    const { menu } = getParts();
    setOpen(!menu?.classList.contains("active"));
  };

  root.closeMobileMenu = function closeMobileMenu() {
    setOpen(false);
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
})(window);
