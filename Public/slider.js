document.addEventListener("DOMContentLoaded", () => {
  // === MANTENEMOS el slider original ===
  const frases = [
    { texto: "Descubre el talento estudiantil"},
    { texto: "Impulsa tus ideas con pasión"},
    { texto: "Únete a ProgramyX"}
  ];

  const heroBG = document.getElementById("hero-bg");
  const titulo = document.querySelector(".hero-slider .hero-title");
  let indice = 0;

  if (heroBG && titulo) {
    function cambiarSlide() {
      titulo.classList.remove("show");
      setTimeout(() => {
        indice = (indice + 1) % frases.length;
        titulo.textContent = frases[indice].texto;
        titulo.classList.add("show");
      }, 500);
    }
    setInterval(cambiarSlide, 2100);
  }

  // === ANIMACIÓN DE BOLITAS ===
  const hero = document.querySelector(".hero-slider");
  const colores = ["#F37878", "#ACF69E", "#9EBEF6"];
  const totalStages = 4;
  const bolasPorEtapa = 50;

  function crearBolita(color) {
    const bola = document.createElement("div");
    bola.classList.add("bola");
    const size = Math.floor(Math.random() * 50) + 30; // 20px a 60px
    const duracion = (Math.random() * 0.9 + 1.4).toFixed(2); // 1.2s a 1.9s
    const left = Math.random() * 100;
    const delay = (Math.random() * 1.5).toFixed(2);

    bola.style.width = bola.style.height = `${size}px`;
    bola.style.background = color;
    bola.style.left = `${left}%`;
    bola.style.animationDuration = `${duracion}s`;
    bola.style.animationDelay = `${delay}s`;

    hero.appendChild(bola);

    setTimeout(() => bola.remove(), duracion * 1000 + delay * 1000);
  }

  function lanzarBolas(color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
      crearBolita(color);
    }
  }

  function iniciarEtapa(etapa) {
    let color;
    if (etapa < 3) color = colores[etapa];
    else color = null; // mezcla

    for (let i = 0; i < bolasPorEtapa; i++) {
      const c = color || colores[Math.floor(Math.random() * colores.length)];
      crearBolita(c);
    }
  }

  function animarEtapas(etapa = 0) {
    iniciarEtapa(etapa);
    setTimeout(() => {
      const siguiente = (etapa + 1) % totalStages;
      animarEtapas(siguiente);
    }, 3200);
  }

  animarEtapas();

  // === FADE IN ===
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el, i) => {
    el.style.animationDelay = `${i * 0}s`;
    el.classList.add("animated");
  });
});
