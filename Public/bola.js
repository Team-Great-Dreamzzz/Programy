window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    // Asegurar que el preloader ocupe toda la pantalla
    preloader.style.position = 'fixed';
    preloader.style.top = '0';
    preloader.style.left = '0';
    preloader.style.right = '0';
    preloader.style.bottom = '0';
    preloader.style.display = 'flex';
    preloader.style.flexDirection = 'column';
    preloader.style.alignItems = 'center';
    preloader.style.justifyContent = 'center';
    preloader.style.zIndex = '9999';
    
    preloader.style.opacity = "0";
    setTimeout(() => {
      preloader.style.display = "none";
    }, 500);
  }});
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