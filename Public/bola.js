  window.addEventListener("load", () => {
    const preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.style.opacity = "0";
      setTimeout(() => preloader.remove(), 500);
    }
  });
   const favicon = document.getElementById("dynamic-favicon");
  const originalIcon = "R.png";
  const awayIcon = "R-alert.png";

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      favicon.href = awayIcon;
    } else {
      favicon.href = originalIcon;
    }
  });