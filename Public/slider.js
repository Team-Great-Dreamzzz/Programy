
document.addEventListener("DOMContentLoaded", () => {
  // === HERO SLIDER ===
  const frases = [
    { texto: "Descubre el talento estudiantil", fondo: "banner1.jpg" },
    { texto: "Impulsa tus ideas con pasión", fondo: "banner2.jpg" },
    { texto: "Únete a ProgramyX AU", fondo: "banner3.jpg" }
  ];

  const hero = document.querySelector(".hero-slider");
  const titulo = document.querySelector(".hero-slider .hero-title");
  let indice = 0;

  if (hero && titulo) {
    function cambiarSlide() {
      titulo.classList.remove("show");
      setTimeout(() => {
        indice = (indice + 1) % frases.length;
        titulo.textContent = frases[indice].texto;
        document.getElementById("hero-bg").style.backgroundImage = `url('${frases[indice].fondo}')`;
        titulo.classList.add("show");
      }, 500);
    }
    setInterval(cambiarSlide, 2100);
  }

  // === FADE IN ===
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el, i) => {
    el.style.animationDelay = `${i * 0}s`;
    el.classList.add("animated");
  });

  // === JUEGO ATRAPA EL LOGO ===
  const logo = document.getElementById("game-logo");
  const container = document.getElementById("game-container");
  const scoreDisplay = document.getElementById("score");

  if (logo && container && scoreDisplay) {
    let score = 0;
    let moveInterval = 700;
    let moveTimer;

    function randomPosition() {
      const maxX = container.clientWidth - logo.clientWidth;
      const maxY = container.clientHeight - logo.clientHeight;
      const x = Math.random() * maxX;
      const y = Math.random() * maxY;
      logo.style.left = `${x}px`;
      logo.style.top = `${y}px`;
    }

    function updateScore() {
      score++;
      scoreDisplay.textContent = `Puntaje: ${score}`;

      if (score % 5 === 0 && moveInterval > 250) {
        moveInterval -= 50;
        restartMovement();
      }

      logo.style.transform = "scale(1.3)";
      setTimeout(() => logo.style.transform = "scale(1)", 100);

      if (score === 20) {
        confettiCelebration();
      }
    }

    function startMovement() {
      moveTimer = setInterval(randomPosition, moveInterval);
    }

    function restartMovement() {
      clearInterval(moveTimer);
      startMovement();
    }

    function confettiCelebration() {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.textContent = "🎉 ¡Nivel PRO Desbloqueado! 🎉";
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 4000);

      const videoWrapper = document.createElement("div");
      videoWrapper.id = "video-celebracion";
      videoWrapper.style.position = "fixed";
      videoWrapper.style.top = "0";
      videoWrapper.style.left = "0";
      videoWrapper.style.width = "100vw";
      videoWrapper.style.height = "100vh";
      videoWrapper.style.zIndex = "10000";
      videoWrapper.style.display = "flex";
      videoWrapper.style.alignItems = "center";
      videoWrapper.style.justifyContent = "center";
      videoWrapper.style.background = "rgba(0, 0, 0, 0.7)";

      const video = document.createElement("video");
      video.src = "celebracion.webm";
      video.autoplay = true;
      video.muted = false;
      video.playsInline = true;
      video.style.maxWidth = "80vw";
      video.style.maxHeight = "80vh";
      video.style.mixBlendMode = "screen";
      video.style.filter = "brightness(1.2) contrast(1.2) saturate(1.2)";

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✖";
      closeBtn.style.position = "absolute";
      closeBtn.style.top = "1rem";
      closeBtn.style.right = "1rem";
      closeBtn.style.background = "#fff";
      closeBtn.style.border = "none";
      closeBtn.style.borderRadius = "50%";
      closeBtn.style.fontSize = "1.2rem";
      closeBtn.style.padding = "0.4rem 0.6rem";
      closeBtn.style.cursor = "pointer";
      closeBtn.onclick = () => videoWrapper.remove();

      videoWrapper.appendChild(video);
      videoWrapper.appendChild(closeBtn);
      document.body.appendChild(videoWrapper);

      video.onended = () => videoWrapper.remove();
    }

    logo.addEventListener("click", () => {
      updateScore();
      randomPosition();
    });

    randomPosition();
    startMovement();
  }
});
