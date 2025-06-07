document.addEventListener("DOMContentLoaded", () => {
  // Menú hamburguesa
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.querySelectorAll("a").forEach(link =>
      link.addEventListener("click", () => nav.classList.remove("open"))
    );
  }

  // Crear modal global
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-modal">&times;</button>
      <div id="modal-details" class="auth-form"></div>
    </div>`;
  document.body.appendChild(modal);

  // Click en tarjeta -> abrir modal
  document.body.addEventListener("click", e => {
    const card = e.target.closest(".tool-card");
    if (!card) return;
    e.preventDefault();
    const img = card.querySelector("img").src;
    const title = card.querySelector("h3").innerText;
    const detail = card.getAttribute("data-detail") || "Descripción no disponible.";
    const link = card.getAttribute("href");

    document.getElementById("modal-details").innerHTML = `
      <img src="${img}" alt="${title}" style="width:80px; margin:0 auto 1rem; border-radius:10%;">
      <h2>${title}</h2>
      <p style="margin:1rem 0; font-size:1.1rem;">${detail}</p>
      <a href="${link}" class="auth-btn" target="_blank">Ir a la herramienta</a>
    `;
    modal.classList.add("active");
  });

  // Cerrar modal
  document.body.addEventListener("click", e => {
    if (
      e.target.classList.contains("close-modal") ||
      e.target === modal
    ) {
      modal.classList.remove("active");
    }
  });

  // Aleatorizar y filtrar
  const toolsGrid = document.querySelector(".tools-grid");
  const allTools = Array.from(toolsGrid.children).map(c => c.cloneNode(true));

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.category;
      toolsGrid.innerHTML = "";

      let selected = (cat === "all")
        ? shuffle(allTools)
        : allTools.filter(c => c.dataset.category === cat);

      selected.forEach(c => toolsGrid.appendChild(c.cloneNode(true)));
    });
  });

  // Trigger inicial
  document.querySelector('.filter-btn[data-category="all"]').click();
});
