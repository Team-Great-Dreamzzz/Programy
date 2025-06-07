  // === MÚSICA DE FONDO ===
  const musica = new Audio("musica-fondo.mp3");
  musica.volume = 0.2;
  musica.loop = true;

  const muteBtn = document.createElement("button");
  muteBtn.id = "mute-btn";
  muteBtn.innerHTML = "🔊";
  muteBtn.style.position = "fixed";
  muteBtn.style.bottom = "20px";
  muteBtn.style.right = "20px";
  muteBtn.style.padding = "10px 14px";
  muteBtn.style.border = "none";
  muteBtn.style.borderRadius = "50%";
  muteBtn.style.background = "#531b1b";
  muteBtn.style.color = "white";
  muteBtn.style.fontSize = "1.2rem";
  muteBtn.style.cursor = "pointer";
  muteBtn.style.zIndex = "1000";
  document.body.appendChild(muteBtn);

  muteBtn.addEventListener("click", () => {
    if (musica.muted) {
      musica.muted = false;
      muteBtn.innerHTML = "🔊";
    } else {
      musica.muted = true;
      muteBtn.innerHTML = "🔇";
    }
  });

  musica.play().catch(() => {
    document.body.addEventListener("click", () => {
      musica.play();
    }, { once: true });
  });
