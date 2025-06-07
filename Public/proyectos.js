// proyectos.js

document.addEventListener("DOMContentLoaded", async () => {
  // API endpoints
  const API_DATA = "/api/data";
  const API_PROJECT = "/api/project";

  // Elementos del DOM
  const elements = {
    sidebar: document.getElementById("sidebar"),
    sidebarToggle: document.getElementById("sidebar-toggle"),
    menuItems: document.querySelectorAll(".menu-item"),
    sections: document.querySelectorAll(".section"),
    sectionTitle: document.getElementById("section-title"),
    projectsList: document.getElementById("projects-list"),
    userProjectsList: document.getElementById("user-projects-list"),
    reportsList: document.getElementById("reports-list"),
    resolvedReportsList: document.getElementById("resolved-reports-list"),
    projectForm: document.getElementById("project-form"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    authModal: document.getElementById("auth-modal"),
    projectDetailsModal: document.getElementById("project-details-modal"),
    projectDetailsContent: document.getElementById("project-details-content"),
    logoutBtn: document.getElementById("logout-btn"),
    userInfo: document.getElementById("user-info"),
    currentUserSpan: document.getElementById("current-user"),
    authMessage: document.getElementById("auth-message"),
    closeModals: document.querySelectorAll(".close-modal"),
    tabButtons: document.querySelectorAll(".tab-btn"),
    loginFormContainer: document.getElementById("login-form-container"),
    registerFormContainer: document.getElementById("register-form-container"),
    fileInput: document.getElementById("project-files"),
    imagePreview: document.getElementById("image-preview"),
    submitBtn: document.getElementById("submit-btn"),
    searchInput: document.getElementById("search-input"),
    searchBtn: document.getElementById("search-btn"),
    userSearchInput: document.getElementById("user-search-input"),
    userSearchBtn: document.getElementById("user-search-btn"),
    reportModal: document.getElementById("report-modal"),
    reportForm: document.getElementById("report-form"),
    reportReason: document.getElementById("report-reason"),
    reportDescription: document.getElementById("report-description"),
    reportProjectName: document.getElementById("report-project-name"),
    changePasswordBtn: document.getElementById("change-password-btn"),
    changePasswordModal: document.getElementById("change-password-modal"),
    changePasswordForm: document.getElementById("change-password-form"),
    currentPassword: document.getElementById("change-current-password"),
    newPassword: document.getElementById("change-new-password"),
    confirmNewPassword: document.getElementById("change-confirm-password"),
    changePasswordMessage: document.getElementById("change-password-message"),
    moderation: document.getElementById("moderation")
  };

  // Estado de la aplicación
  let data = {
    projects: [],
    users: [],
    reports: [],
    currentUser: localStorage.getItem("currentUser") || null,
    isAdmin: false
  };

  let currentReportProjectId = null;

  // Inicialización
  await init();

  async function init() {
    await loadData();
    setupEventListeners();
    checkAuthState();
    renderAllProjects();

    if (window.innerWidth < 768 && elements.sidebar) {
      elements.sidebar.classList.add("sidebar-collapsed");
      updateMenuIcons();
    }
  }

  // Carga datos desde /api/data
  async function loadData() {
    try {
      const resp = await fetch(API_DATA);
      if (!resp.ok) throw new Error("Error cargando datos");
      const jsonData = await resp.json();
      data.projects = jsonData.projects || [];
      data.users = jsonData.users || [];
      data.reports = jsonData.reports || [];

      data.users = data.users.map(u => {
        if (u.username === "admin" && u.isAdmin === undefined) {
          return { ...u, isAdmin: true };
        } else if (u.isAdmin === undefined) {
          return { ...u, isAdmin: false };
        }
        return u;
      });
      if (data.users.length === 0) {
        data.users.push({ username: "admin", password: "admin123", isAdmin: true });
        await saveData();
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
      data.users = [{ username: "admin", password: "admin123", isAdmin: true }];
    }
  }

  // Guarda usuarios y reportes en /api/data
  async function saveData() {
    const payload = {
      projects: data.projects,
      users: data.users,
      reports: data.reports
    };
    try {
      const resp = await fetch(API_DATA, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) console.error("Error guardando datos:", await resp.text());
      return resp.ok;
    } catch (err) {
      console.error("Error al guardar datos:", err);
      return false;
    }
  }

  // Configuración de listeners
  function setupEventListeners() {
    // Toggle sidebar
    if (elements.sidebarToggle) {
      elements.sidebarToggle.addEventListener("click", toggleSidebar);
    }

    // Cambiar sección
    elements.menuItems.forEach(item => {
      item.addEventListener("click", () => {
        if (!data.currentUser && item.dataset.section !== "all-projects") {
          alert("Debes iniciar sesión para acceder a esta sección");
          return;
        }
        const section = item.dataset.section;
        switchSection(section);
        elements.sectionTitle.textContent = item.querySelector(".menu-text").textContent;
        elements.menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
      });
    });

    // Login/Register
    if (elements.loginForm) elements.loginForm.addEventListener("submit", handleLogin);
    if (elements.registerForm) elements.registerForm.addEventListener("submit", handleRegister);
    if (elements.logoutBtn) elements.logoutBtn.addEventListener("click", handleLogout);

    // Tabs auth
    elements.tabButtons.forEach(btn => {
      btn.addEventListener("click", () => switchAuthTab(btn.dataset.tab));
    });

    // Crear proyecto con Multer
    if (elements.projectForm) elements.projectForm.addEventListener("submit", handleProjectSubmit);

    // Preview imágenes
    if (elements.fileInput) {
      elements.fileInput.addEventListener("change", handleFileSelect);
    }

    // Cerrar modales
    elements.closeModals.forEach(btn => {
      btn.addEventListener("click", () => {
        const modal = btn.closest(".modal");
        if (!modal) return;
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
        if (modal.id === "change-password-modal") {
          elements.changePasswordMessage.textContent = "";
        }
      });
    });

    // Botón home
    const homeBtn = document.getElementById("home-btn");
    if (homeBtn) {
      homeBtn.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    }

    // Búsquedas
    if (elements.searchBtn && elements.searchInput) {
      elements.searchBtn.addEventListener("click", () => renderAllProjects(elements.searchInput.value));
      elements.searchInput.addEventListener("keyup", e => {
        if (e.key === "Enter") renderAllProjects(elements.searchInput.value);
      });
    }
    if (elements.userSearchBtn && elements.userSearchInput) {
      elements.userSearchBtn.addEventListener("click", () => renderUserProjects(elements.userSearchInput.value));
      elements.userSearchInput.addEventListener("keyup", e => {
        if (e.key === "Enter") renderUserProjects(elements.userSearchInput.value);
      });
    }

    // Enviar reporte
    if (elements.reportForm) elements.reportForm.addEventListener("submit", handleReportSubmit);

    // Cambiar contraseña
    if (elements.changePasswordBtn) {
      elements.changePasswordBtn.addEventListener("click", () => {
        elements.changePasswordModal.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    }
    if (elements.changePasswordForm) {
      elements.changePasswordForm.addEventListener("submit", handleChangePassword);
    }

    // Mobile menu
    const menuToggle = document.getElementById("menu-toggle");
    const nav = document.getElementById("nav");
    if (menuToggle && nav) {
      menuToggle.addEventListener("click", () => nav.classList.toggle("show"));
    }
  }

  // Colapsar/expandir sidebar
  function toggleSidebar() {
    if (!elements.sidebar) return;
    elements.sidebar.classList.toggle("sidebar-collapsed");
    updateMenuIcons();
  }
  function updateMenuIcons() {
    if (!elements.sidebarToggle) return;
    const icon = elements.sidebarToggle.querySelector("i");
    if (!icon) return;
    if (elements.sidebar.classList.contains("sidebar-collapsed")) {
      icon.classList.replace("fa-chevron-left", "fa-chevron-right");
    } else {
      icon.classList.replace("fa-chevron-right", "fa-chevron-left");
    }
  }

  // Cambiar de sección
  function switchSection(id) {
    elements.sections.forEach(s => s.classList.remove("active"));
    const sec = document.getElementById(id);
    if (sec) sec.classList.add("active");
    if (id === "all-projects") renderAllProjects();
    else if (id === "my-projects") renderUserProjects();
    else if (id === "moderation") renderModerationPanel();
  }

  // Manejo de login
  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const user = data.users.find(u => u.username === username && u.password === password);
    if (user) {
      data.currentUser = username;
      data.isAdmin = !!user.isAdmin;
      localStorage.setItem("currentUser", username);
      checkAuthState();
      showAuthMessage("", "");
      renderAllProjects();
      switchSection("all-projects");
      elements.menuItems.forEach(i => i.classList.remove("active"));
      document.querySelector('[data-section="all-projects"]').classList.add("active");
    } else {
      showAuthMessage("Usuario o contraseña incorrectos", "error");
    }
  }

  // Manejo de registro
  async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("new-username").value.trim();
    const contact = document.getElementById("new-contact").value.trim();
    const password = document.getElementById("new-password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();
    if (password !== confirmPassword) {
      showAuthMessage("Las contraseñas no coinciden", "error");
      return;
    }
    if (data.users.some(u => u.username === username)) {
      showAuthMessage("El usuario ya existe", "error");
      return;
    }
    data.users.push({ username, password, contact, isAdmin: false });
    await saveData();
    showAuthMessage("Registro exitoso, inicia sesión", "success");
    switchAuthTab("login");
    document.getElementById("username").value = username;
    document.getElementById("password").value = "";
  }

  function handleLogout() {
    data.currentUser = null;
    data.isAdmin = false;
    localStorage.removeItem("currentUser");
    checkAuthState();
    elements.loginForm.reset();
    elements.registerForm.reset();
    elements.authMessage.textContent = "";
    switchSection("all-projects");
    elements.menuItems.forEach(i => i.classList.remove("active"));
    document.querySelector('[data-section="all-projects"]').classList.add("active");
  }

  function showAuthMessage(msg, type) {
    elements.authMessage.textContent = msg;
    elements.authMessage.className = "auth-message";
    if (type) elements.authMessage.classList.add(type);
  }

  function switchAuthTab(tab) {
    elements.tabButtons.forEach(btn => btn.classList.remove("active"));
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add("active");
    if (tab === "login") {
      elements.loginFormContainer.style.display = "block";
      elements.registerFormContainer.style.display = "none";
    } else {
      elements.loginFormContainer.style.display = "none";
      elements.registerFormContainer.style.display = "block";
    }
  }

  function checkAuthState() {
    if (data.currentUser) {
      elements.currentUserSpan.textContent = data.currentUser;
      const user = data.users.find(u => u.username === data.currentUser);
      data.isAdmin = !!(user && user.isAdmin);
      if (data.isAdmin) document.body.classList.add("admin-mode");
      else document.body.classList.remove("admin-mode");
      elements.userInfo.style.display = "block";
      elements.authModal.classList.remove("active");
      document.body.style.overflow = "auto";
    } else {
      data.currentUser = null;
      data.isAdmin = false;
      document.body.classList.remove("admin-mode");
      elements.userInfo.style.display = "none";
      elements.authModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  // Preview de imágenes
  function handleFileSelect(e) {
    elements.imagePreview.innerHTML = "";
    for (let file of e.target.files) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = evt => {
          const img = document.createElement("img");
          img.src = evt.target.result;
          img.classList.add("image-preview");
          elements.imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  // Crear proyecto (con Multer)
  async function handleProjectSubmit(e) {
    e.preventDefault();
    if (!data.currentUser) {
      alert("Debes iniciar sesión para publicar un proyecto");
      return;
    }
    const form = elements.projectForm;
    const formData = new FormData();
    formData.append("name", form["project-name"].value.trim());
    formData.append("description", form["project-desc"].value.trim());
    formData.append("category", form["project-category"].value.trim());
    formData.append("technologies", form["project-technologies"].value.trim());
    formData.append("status", form["project-status"].value);
    formData.append("author", data.currentUser);

    const files = elements.fileInput.files;
    for (let f of files) {
      formData.append("files", f);
    }

    elements.submitBtn.disabled = true;
    elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';

    try {
      const resp = await fetch(API_PROJECT, {
        method: "POST",
        body: formData
      });
      const resJson = await resp.json();
      if (!resp.ok) {
        alert(resJson.error || "Error al guardar proyecto");
        return;
      }
      alert("¡Proyecto publicado con éxito!");
      form.reset();
      elements.imagePreview.innerHTML = "";
      await loadData();
      renderAllProjects();
    } catch (err) {
      console.error("Error al publicar proyecto:", err);
      alert("Ocurrió un error al publicar el proyecto");
    } finally {
      elements.submitBtn.disabled = false;
      elements.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Proyecto';
    }
  }

  // Renderizar todos los proyectos
  function renderAllProjects(searchTerm = "") {
    let list = [...data.projects];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.technologies && p.technologies.some(t => t.toLowerCase().includes(term)))
      );
    }
    if (list.length === 0) {
      elements.projectsList.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search fa-2x"></i>
          <h3>No se encontraron proyectos</h3>
          <p>Intenta con otros términos de búsqueda</p>
        </div>`;
      return;
    }
    elements.projectsList.innerHTML = list.map(p => {
      const reportCount = data.reports.filter(r => r.projectId === p.id && r.status === "pendiente").length;
      const firstImage = p.files && p.files.length && p.files.find(f => f.mimeType.startsWith("image/"));
      return `
      <div class="project-card" data-id="${p.id}">
        ${reportCount > 0 ? `<div class="reported-badge">${reportCount} Reporte${reportCount > 1 ? 's' : ''}</div>` : ''}
        ${firstImage
          ? `<img src="${firstImage.filePath}" alt="${p.name}" class="project-thumbnail">`
          : `<div class="project-thumbnail"><i class="fas fa-image"></i></div>`}
        <h3>${p.name}</h3>
        <p>${truncateText(p.description, 100)}</p>
        <div class="tech-tags">
          ${p.technologies && p.technologies.slice(0, 3).map(t => `<span class="project-tech">${t}</span>`).join('')}
        </div>
        <div class="project-status ${getStatusClass(p.status)}">${getStatusText(p.status)}</div>
        <div class="project-actions">
          <small>Publicado por: ${p.author} ${data.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}</small>
          ${data.currentUser === p.author || data.isAdmin
            ? `<button class="btn btn-danger delete-btn" data-id="${p.id}"><i class="fas fa-trash"></i> Eliminar</button>`
            : ''}
          ${data.currentUser && data.currentUser !== p.author
            ? `<button class="btn btn-warning report-btn" data-id="${p.id}" data-name="${p.name}"><i class="fas fa-flag"></i> Reportar</button>`
            : ''}
        </div>
      </div>`;
    }).join("");
    setupProjectCardEvents();
  }

  // Renderizar proyectos del usuario
  function renderUserProjects(searchTerm = "") {
    if (!data.currentUser) return;
    let list = data.projects.filter(p => p.author === data.currentUser);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.technologies && p.technologies.some(t => t.toLowerCase().includes(term)))
      );
    }
    if (list.length === 0) {
      elements.userProjectsList.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search fa-2x"></i>
          <h3>No se encontraron proyectos</h3>
          <p>${searchTerm ? 'Intenta con otros términos de búsqueda' : 'Aún no has creado proyectos'}</p>
        </div>`;
      return;
    }
    elements.userProjectsList.innerHTML = list.map(p => {
      const reportCount = data.reports.filter(r => r.projectId === p.id && r.status === "pendiente").length;
      const firstImage = p.files && p.files.length && p.files.find(f => f.mimeType.startsWith("image/"));
      return `
      <div class="project-card" data-id="${p.id}">
        ${reportCount > 0 ? `<div class="reported-badge">${reportCount} Reporte${reportCount > 1 ? 's' : ''}</div>` : ''}
        ${firstImage
          ? `<img src="${firstImage.filePath}" alt="${p.name}" class="project-thumbnail">`
          : `<div class="project-thumbnail"><i class="fas fa-image"></i></div>`}
        <h3>${p.name}</h3>
        <p>${truncateText(p.description, 100)}</p>
        <div class="tech-tags">
          ${p.technologies && p.technologies.slice(0, 3).map(t => `<span class="project-tech">${t}</span>`).join('')}
        </div>
        <div class="project-status ${getStatusClass(p.status)}">${getStatusText(p.status)}</div>
        <div class="project-actions">
          <button class="btn btn-danger delete-btn" data-id="${p.id}"><i class="fas fa-trash"></i> Eliminar</button>
        </div>
      </div>`;
    }).join("");
    setupProjectCardEvents();
  }

  // Agregar eventos a tarjetas
  function setupProjectCardEvents() {
    document.querySelectorAll(".project-card").forEach(card => {
      card.addEventListener("click", e => {
        if (e.target.closest(".delete-btn") || e.target.closest(".report-btn")) return;
        const pid = card.dataset.id;
        showProjectDetails(pid);
      });
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async e => {
        e.stopPropagation();
        if (!confirm("¿Seguro que deseas eliminar?")) return;
        const pid = btn.dataset.id;
        data.projects = data.projects.filter(p => p.id !== pid);
        await saveData();
        renderAllProjects();
        renderUserProjects();
        if (elements.projectDetailsModal) {
          elements.projectDetailsModal.classList.remove("active");
          document.body.style.overflow = "auto";
        }
      });
    });

    document.querySelectorAll(".report-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        if (!data.currentUser) return alert("Debes iniciar sesión para reportar");
        currentReportProjectId = btn.dataset.id;
        elements.reportProjectName.textContent = btn.dataset.name;
        elements.reportModal.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    });
  }

  // Enviar reporte
  async function handleReportSubmit(e) {
    e.preventDefault();
    if (!data.currentUser) return alert("Debes iniciar sesión para reportar");
    if (!currentReportProjectId) return alert("No se seleccionó proyecto");
    const reason = elements.reportReason.value;
    const desc = elements.reportDescription.value.trim();
    if (!reason || !desc) return alert("Completa todos los campos");

    const report = {
      id: Date.now().toString(),
      projectId: currentReportProjectId,
      reason,
      description: desc,
      reportedBy: data.currentUser,
      reportedAt: new Date().toISOString(),
      status: "pendiente"
    };
    data.reports.push(report);
    await saveData();

    elements.reportModal.classList.remove("active");
    elements.reportForm.reset();
    document.body.style.overflow = "auto";

    renderAllProjects();
    alert("¡Reporte enviado!");
  }

  // Panel de moderación (solo admin)
  function renderModerationPanel() {
    if (!data.isAdmin) {
      elements.moderation.innerHTML = "<p>Acceso denegado</p>";
      return;
    }
    const pendientes = data.reports.filter(r => r.status === "pendiente");
    const resueltos = data.reports.filter(r => r.status !== "pendiente");

    if (pendientes.length === 0) {
      elements.reportsList.innerHTML = `
        <div class="no-results">
          <i class="fas fa-check-circle fa-2x"></i>
          <h3>No hay reportes pendientes</h3>
        </div>`;
    } else {
      elements.reportsList.innerHTML = pendientes.map(r => {
        const proj = data.projects.find(p => p.id === r.projectId);
        const date = new Date(r.reportedAt).toLocaleDateString("es-ES", {
          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
        return `
        <div class="report-card">
          <div class="report-header">
            <h4>Reporte #${r.id.substring(0, 6)}</h4>
            <span class="project-status">${getReportReasonText(r.reason)}</span>
          </div>
          <div class="report-meta">
            <strong>Proyecto:</strong> ${proj ? proj.name : "Eliminado"} |
            <strong>Reportado por:</strong> ${r.reportedBy} |
            <strong>Fecha:</strong> ${date}
          </div>
          <p><strong>Descripción:</strong></p>
          <div class="report-reason">${r.description}</div>
          <div class="moderation-actions">
            <button class="btn btn-danger resolve-btn" data-id="${r.id}" data-action="remove">
              <i class="fas fa-trash"></i> Eliminar Proyecto
            </button>
            <button class="btn btn-success resolve-btn" data-id="${r.id}" data-action="dismiss">
              <i class="fas fa-check"></i> Descartar Reporte
            </button>
            ${proj ? `<button class="btn btn-primary view-project-btn" data-id="${proj.id}"><i class="fas fa-eye"></i> Ver Proyecto</button>` : ""}
          </div>
        </div>`;
      }).join("");
    }

    if (resueltos.length === 0) {
      elements.resolvedReportsList.innerHTML = `
        <div class="no-results">
          <i class="fas fa-history fa-2x"></i>
          <h3>No hay reportes resueltos</h3>
        </div>`;
    } else {
      elements.resolvedReportsList.innerHTML = resueltos.map(r => {
        const proj = data.projects.find(p => p.id === r.projectId);
        const resolvedAt = new Date(r.resolvedAt).toLocaleDateString("es-ES", {
          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
        return `
        <div class="report-card resolved-report">
          <div class="report-header">
            <h4>Reporte #${r.id.substring(0, 6)}</h4>
            <span class="project-status">${r.status === "resuelto" ? "Resuelto" : "Descartado"}</span>
          </div>
          <div class="report-meta">
            <strong>Proyecto:</strong> ${proj ? proj.name : "Eliminado"} |
            <strong>Reportado por:</strong> ${r.reportedBy} |
            <strong>Resuelto por:</strong> ${r.resolvedBy} |
            <strong>Fecha resolución:</strong> ${resolvedAt}
          </div>
          <p><strong>Motivo:</strong> ${getReportReasonText(r.reason)}</p>
          <div class="report-reason">${r.description}</div>
          <div class="moderation-actions">
            ${proj ? `<button class="btn btn-primary view-project-btn" data-id="${proj.id}"><i class="fas fa-eye"></i> Ver Proyecto</button>` : ""}
          </div>
        </div>`;
      }).join("");
    }

    document.querySelectorAll(".resolve-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const rid = btn.dataset.id;
        const action = btn.dataset.action;
        const rep = data.reports.find(r => r.id === rid);
        if (!rep) return;
        if (action === "remove") {
          if (!confirm("¿Eliminar proyecto y marcar reporte como resuelto?")) return;
          data.projects = data.projects.filter(p => p.id !== rep.projectId);
          rep.status = "resuelto";
          rep.resolvedBy = data.currentUser;
          rep.resolvedAt = new Date().toISOString();
          await saveData();
          renderModerationPanel();
          renderAllProjects();
          alert("Proyecto eliminado y reporte resuelto");
        } else if (action === "dismiss") {
          if (!confirm("¿Descartar reporte?")) return;
          rep.status = "descartado";
          rep.resolvedBy = data.currentUser;
          rep.resolvedAt = new Date().toISOString();
          await saveData();
          renderModerationPanel();
          renderAllProjects();
          alert("Reporte descartado");
        }
      });
    });

    document.querySelectorAll(".view-project-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pid = btn.dataset.id;
        if (pid) showProjectDetails(pid);
      });
    });
  }

  function getReportReasonText(reason) {
    const map = {
      contenido_inapropiado: "Contenido inapropiado",
      spam: "Spam/Publicidad",
      derechos_autor: "Derechos de autor",
      informacion_falsa: "Información falsa",
      otro: "Otro motivo"
    };
    return map[reason] || reason;
  }

  // Mostrar detalles del proyecto
  function showProjectDetails(pid) {
    const project = data.projects.find(p => p.id === pid);
    if (!project) {
      elements.projectDetailsContent.innerHTML = `
        <h2>Proyecto no encontrado</h2>
        <p>Puede que ya haya sido eliminado.</p>`;
      elements.projectDetailsModal.classList.add("active");
      document.body.style.overflow = "hidden";
      return;
    }
    const createdAt = new Date(project.createdAt).toLocaleDateString("es-ES", {
      year: "numeric", month: "long", day: "numeric"
    });
    const projectReports = data.reports.filter(r => r.projectId === pid);

    const getFileIcon = type => {
      if (type.startsWith("image/")) return "fa-file-image";
      if (type === "application/pdf") return "fa-file-pdf";
      if (type.startsWith("audio/")) return "fa-file-audio";
      if (["application/zip", "application/x-rar-compressed", "application/x-7z-compressed"].includes(type))
        return "fa-file-archive";
      if (type === "text/plain") return "fa-file-alt";
      if (["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(type))
        return "fa-file-word";
      return "fa-file";
    };

    elements.projectDetailsContent.innerHTML = `
      <h2>${project.name}</h2>
      <p><strong>Categoría:</strong> ${project.category || "No especificada"}</p>
      <p><strong>Estado:</strong> <span class="project-status ${getStatusClass(project.status)}">${getStatusText(project.status)}</span></p>
      <p><strong>Publicado por:</strong> ${project.author}</p>
      ${(() => {
  const authorUser = data.users.find(u => u.username === project.author);
  return authorUser && authorUser.contact
    ? `<p><strong>Contacto:</strong> ${authorUser.contact}</p>`
    : "";
})()}

      <p><strong>Fecha:</strong> ${createdAt}</p>
      ${project.technologies && project.technologies.length
        ? `<p><strong>Tecnologías:</strong> ${project.technologies.join(", ")}</p>`
        : ""}
      <h3>Descripción</h3>
      <p>${project.description}</p>
      ${project.files && project.files.length
        ? `<div class="project-files">
             <h3>Archivos Adjuntos</h3>
             <div class="file-grid">
               ${project.files.map(f => `
                 <div class="file-preview">
                   <i class="fas ${getFileIcon(f.mimeType)}"></i>
                   <div class="file-name">${truncateText(f.originalName, 15)}</div>
                   <a href="${f.filePath}" download="${f.originalName}" class="download-btn">
                     <i class="fas fa-download"></i> Descargar
                   </a>
                 </div>
               `).join("")}
             </div>
           </div>`
        : ""}
      ${data.isAdmin && projectReports.length
        ? `<div class="project-files">
             <h3>Reportes sobre este proyecto</h3>
             <div class="reports-grid">
               ${projectReports.map(r => {
                 const date = new Date(r.reportedAt).toLocaleDateString("es-ES", {
                   year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                 });
                 return `
                   <div class="report-card ${r.status !== "pendiente" ? "resolved-report" : ""}">
                     <div class="report-header">
                       <h4>Reporte #${r.id.substring(0, 6)}</h4>
                       <span class="project-status ${r.status === "pendiente" ? "status-en-progreso" : "status-completado"}">
                         ${r.status === "pendiente" ? "Pendiente" : (r.status === "resuelto" ? "Resuelto" : "Descartado")}
                       </span>
                     </div>
                     <div class="report-meta">
                       <strong>Reportado por:</strong> ${r.reportedBy} |
                       <strong>Fecha:</strong> ${date}
                       ${r.resolvedBy ? `| <strong>Resuelto por:</strong> ${r.resolvedBy}` : ""}
                     </div>
                     <p><strong>Motivo:</strong> ${getReportReasonText(r.reason)}</p>
                     <div class="report-reason">${r.description}</div>
                   </div>`;
               }).join("")}
             </div>
           </div>`
        : ""}
      <div style="margin-top:20px; display:flex; gap:10px;">
        ${data.currentUser === project.author || data.isAdmin
          ? `<button class="btn btn-danger delete-btn" data-id="${project.id}">
               <i class="fas fa-trash"></i> Eliminar
             </button>`
          : ""}
        ${data.currentUser && data.currentUser !== project.author
          ? `<button class="btn btn-warning report-btn" data-id="${project.id}" data-name="${project.name}">
               <i class="fas fa-flag"></i> Reportar
             </button>`
          : ""}
      </div>`;

    // Eventos dentro del modal
    const deleteBtn = elements.projectDetailsContent.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async e => {
        e.stopPropagation();
        if (!confirm("¿Eliminar proyecto?")) return;
        data.projects = data.projects.filter(p => p.id !== pid);
        await saveData();
        renderAllProjects();
        renderUserProjects();
        renderModerationPanel();
        elements.projectDetailsModal.classList.remove("active");
        document.body.style.overflow = "auto";
      });
    }
    const reportBtn = elements.projectDetailsContent.querySelector(".report-btn");
    if (reportBtn) {
      reportBtn.addEventListener("click", e => {
        e.stopPropagation();
        currentReportProjectId = reportBtn.dataset.id;
        elements.reportProjectName.textContent = reportBtn.dataset.name;
        elements.reportModal.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    }

    elements.projectDetailsModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function getStatusText(status) {
    switch (status) {
      case "en-progreso": return "En progreso";
      case "completado": return "Completado";
      case "abandonado": return "Abandonado";
      default: return status;
    }
  }
  function getStatusClass(status) {
    switch (status) {
      case "en-progreso": return "status-en-progreso";
      case "completado": return "status-completado";
      case "abandonado": return "status-abandonado";
      default: return "";
    }
  }
  function truncateText(text, maxLen) {
    return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
  }

  // Render moderación panel
  function renderModerationPanel() {
    if (!data.isAdmin) {
      elements.moderation.innerHTML = "<p>Acceso denegado</p>";
      return;
    }
    const pendientes = data.reports.filter(r => r.status === "pendiente");
    const resueltos = data.reports.filter(r => r.status !== "pendiente");

    // Pendientes
    if (pendientes.length === 0) {
      elements.reportsList.innerHTML = `
        <div class="no-results">
          <i class="fas fa-check-circle fa-2x"></i>
          <h3>No hay reportes pendientes</h3>
        </div>`;
    } else {
      elements.reportsList.innerHTML = pendientes.map(r => {
        const proj = data.projects.find(p => p.id === r.projectId);
        const date = new Date(r.reportedAt).toLocaleDateString("es-ES", {
          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
        return `
        <div class="report-card">
          <div class="report-header">
            <h4>Reporte #${r.id.substring(0, 6)}</h4>
            <span class="project-status">${getReportReasonText(r.reason)}</span>
          </div>
          <div class="report-meta">
            <strong>Proyecto:</strong> ${proj ? proj.name : "Eliminado"} |
            <strong>Reportado por:</strong> ${r.reportedBy} |
            <strong>Fecha:</strong> ${date}
          </div>
          <p><strong>Descripción:</strong></p>
          <div class="report-reason">${r.description}</div>
          <div class="moderation-actions">
            <button class="btn btn-danger resolve-btn" data-id="${r.id}" data-action="remove">
              <i class="fas fa-trash"></i> Eliminar Proyecto
            </button>
            <button class="btn btn-success resolve-btn" data-id="${r.id}" data-action="dismiss">
              <i class="fas fa-check"></i> Descartar Reporte
            </button>
            ${proj ? `<button class="btn btn-primary view-project-btn" data-id="${proj.id}">
                        <i class="fas fa-eye"></i> Ver Proyecto
                      </button>` : ""}
          </div>
        </div>`;
      }).join("");
    }

    // Resueltos
    if (resueltos.length === 0) {
      elements.resolvedReportsList.innerHTML = `
        <div class="no-results">
          <i class="fas fa-history fa-2x"></i>
          <h3>No hay reportes resueltos</h3>
        </div>`;
    } else {
      elements.resolvedReportsList.innerHTML = resueltos.map(r => {
        const proj = data.projects.find(p => p.id === r.projectId);
        const date = new Date(r.resolvedAt).toLocaleDateString("es-ES", {
          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
        return `
        <div class="report-card resolved-report">
          <div class="report-header">
            <h4>Reporte #${r.id.substring(0, 6)}</h4>
            <span class="project-status">${r.status === "resuelto" ? "Resuelto" : "Descartado"}</span>
          </div>
          <div class="report-meta">
            <strong>Proyecto:</strong> ${proj ? proj.name : "Eliminado"} |
            <strong>Reportado por:</strong> ${r.reportedBy} |
            <strong>Resuelto por:</strong> ${r.resolvedBy} |
            <strong>Fecha resolución:</strong> ${date}
          </div>
          <p><strong>Motivo:</strong> ${getReportReasonText(r.reason)}</p>
          <div class="report-reason">${r.description}</div>
          <div class="moderation-actions">
            ${proj ? `<button class="btn btn-primary view-project-btn" data-id="${proj.id}">
                        <i class="fas fa-eye"></i> Ver Proyecto
                      </button>` : ""}
          </div>
        </div>`;
      }).join("");
    }

    document.querySelectorAll(".resolve-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const rid = btn.dataset.id;
        const action = btn.dataset.action;
        const rep = data.reports.find(r => r.id === rid);
        if (!rep) return;
        if (action === "remove") {
          if (!confirm("¿Eliminar proyecto y resolver reporte?")) return;
          data.projects = data.projects.filter(p => p.id !== rep.projectId);
          rep.status = "resuelto";
          rep.resolvedBy = data.currentUser;
          rep.resolvedAt = new Date().toISOString();
          await saveData();
          renderModerationPanel();
          renderAllProjects();
          alert("Proyecto eliminado y reporte resuelto");
        } else if (action === "dismiss") {
          if (!confirm("¿Descartar este reporte?")) return;
          rep.status = "descartado";
          rep.resolvedBy = data.currentUser;
          rep.resolvedAt = new Date().toISOString();
          await saveData();
          renderModerationPanel();
          renderAllProjects();
          alert("Reporte descartado");
        }
      });
    });

    document.querySelectorAll(".view-project-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const pid = btn.dataset.id;
        if (pid) showProjectDetails(pid);
      });
    });
  }

  // Texto legible de razón de reporte
  function getReportReasonText(reason) {
    const map = {
      contenido_inapropiado: "Contenido inapropiado",
      spam: "Spam/Publicidad",
      derechos_autor: "Derechos de autor",
      informacion_falsa: "Información falsa",
      otro: "Otro motivo"
    };
    return map[reason] || reason;
  }

  // Manejo de cambio de contraseña
  async function handleChangePassword(e) {
    e.preventDefault();
    const currentPass = elements.currentPassword.value.trim();
    const newPass = elements.newPassword.value.trim();
    const confirmPass = elements.confirmNewPassword.value.trim();
    if (newPass !== confirmPass) {
      showChangePasswordMessage("Las nuevas contraseñas no coinciden", "error");
      return;
    }
    if (newPass.length < 6) {
      showChangePasswordMessage("Debe tener al menos 6 caracteres", "error");
      return;
    }
    const idx = data.users.findIndex(u => u.username === data.currentUser);
    if (idx === -1) {
      showChangePasswordMessage("Usuario no encontrado", "error");
      return;
    }
    if (data.users[idx].password !== currentPass) {
      showChangePasswordMessage("Contraseña actual incorrecta", "error");
      return;
    }
    const btn = elements.changePasswordForm.querySelector("button[type='submit']");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    data.users[idx].password = newPass;
    const saved = await saveData();
    if (saved) {
      showChangePasswordMessage("Contraseña actualizada", "success");
      setTimeout(() => {
        elements.changePasswordForm.reset();
        elements.changePasswordModal.classList.remove("active");
        document.body.style.overflow = "auto";
        elements.changePasswordMessage.textContent = "";
      }, 2000);
    } else {
      showChangePasswordMessage("Error guardando en servidor", "error");
    }
    btn.disabled = false;
    btn.innerHTML = originalText;
  }

  function showChangePasswordMessage(msg, type) {
    elements.changePasswordMessage.textContent = msg;
    elements.changePasswordMessage.className = "auth-message";
    if (type) elements.changePasswordMessage.classList.add(type);
  }

  // Refrescar la lista de proyectos después de cualquier cambio
  function renderAllProjectsWrapper() {
    const term = elements.searchInput.value.trim();
    renderAllProjects(term);
  }

  function renderUserProjectsWrapper() {
    const term = elements.userSearchInput.value.trim();
    renderUserProjects(term);
  }

  // Inicializar búsquedas
  if (elements.searchBtn && elements.searchInput) {
    elements.searchBtn.addEventListener("click", renderAllProjectsWrapper);
    elements.searchInput.addEventListener("keyup", e => {
      if (e.key === "Enter") renderAllProjectsWrapper();
    });
  }
  if (elements.userSearchBtn && elements.userSearchInput) {
    elements.userSearchBtn.addEventListener("click", renderUserProjectsWrapper);
    elements.userSearchInput.addEventListener("keyup", e => {
      if (e.key === "Enter") renderUserProjectsWrapper();
    });
  }

  // Cargar inicialmente datos y render
  await loadData();
  renderAllProjects();
});
