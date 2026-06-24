(function (root) {
  const app = (root.SWAPPR = root.SWAPPR || {});

  app.showToast = function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.className =
      "toast fixed bottom-24 right-6 bg-purple-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 transition-all duration-300";
    toast.style.display = "block";
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => {
        toast.style.display = "none";
      }, 300);
    }, 3000);
  };
})(window);
