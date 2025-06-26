// server.js

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// ---------------------------------------
// 1) Configuración de Multer para subir archivos
// ---------------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "thumbnail") {
      cb(null, path.join(__dirname, "uploads", "thumbnails"));
    } else if (file.fieldname === "files") {
      cb(null, path.join(__dirname, "uploads", "files"));
    } else {
      cb(null, path.join(__dirname, "uploads"));
    }
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  }
});
const upload = multer({ storage });

// Asegurarnos de que existan las carpetas de subida
const ensureUploadsFolders = () => {
  const folders = [
    path.join(__dirname, "uploads"),
    path.join(__dirname, "uploads", "thumbnails"),
    path.join(__dirname, "uploads", "files"),
  ];
  folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  });
};
ensureUploadsFolders();

// ---------------------------------------
// 2) Middleware y configuración de Express
// ---------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "Public")));

// ---------------------------------------
// 3) Funciones auxiliares para leer/escribir db.json
// ---------------------------------------
const DB_PATH = path.join(__dirname, "db.json");

// Leer DB
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error leyendo db.json:", err);
    return { projects: [], users: [], reports: [] };
  }
}

// Escribir DB
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
    console.log("✅ db.json actualizado");
    return true;
  } catch (err) {
    console.error("❌ Error escribiendo db.json:", err);
    return false;
  }
}


// ---------------------------------------
// 4) Rutas del API
// ---------------------------------------

// GET /api/data → devuelve todo el contenido de db.json
app.get("/api/data", (req, res) => {
  const db = readDB();
  res.json(db);
});

// PUT /api/data → sobreescribe db.json con el JSON del body
app.put("/api/data", (req, res) => {
  const newData = req.body;
  if (!newData || typeof newData !== "object") {
    return res.status(400).json({ error: "JSON inválido en el body" });
  }
  const ok = writeDB(newData);
  if (!ok) {
    return res.status(500).json({ error: "No se pudo escribir db.json" });
  }
  res.json({ message: "Datos guardados correctamente" });
});

// POST /api/project → crea un proyecto (ahora con link y comentarios)
app.post(
  "/api/project",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "files", maxCount: 20 }
  ]),
  (req, res) => {
    try {
      const db = readDB();
      const { name, description, category, technologies, status, author, link } = req.body;

      // Validaciones básicas
      if (!name || !description || !author) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      // Procesar miniatura
      let thumbnailPath = "";
      if (req.files["thumbnail"] && req.files["thumbnail"].length > 0) {
        const fileThumb = req.files["thumbnail"][0];
        thumbnailPath = `/uploads/thumbnails/${path.basename(fileThumb.path)}`;
      }

      // Procesar archivos adjuntos
      let filesArray = [];
      if (req.files["files"] && req.files["files"].length > 0) {
        filesArray = req.files["files"].map(f => ({
          originalName: f.originalname,
          filePath: `/uploads/files/${path.basename(f.path)}`,
          mimeType: f.mimetype,
          size: f.size
        }));
      }

      // Componer el nuevo proyecto
      const nuevoProyecto = {
        id: Date.now().toString(),
        name,
        description,
        category: category || "",
        technologies: technologies
          ? technologies.split(",").map(t => t.trim()).filter(t => t.length)
          : [],
        status: status || "en-progreso",
        author,
        link: link || "", // Nuevo campo: link
        thumbnailPath,
        files: filesArray,
        comments: [],     // Nuevo campo: comentarios inicializados
        createdAt: new Date().toISOString()
      };

      db.projects.push(nuevoProyecto);
      const okWrite = writeDB(db);
      if (!okWrite) {
        return res.status(500).json({ error: "No se pudo escribir en la base de datos" });
      }

      res.json({ success: true, project: nuevoProyecto });
    } catch (err) {
      console.error("Error en POST /api/project:", err);
      return res.status(500).send("Error interno del servidor");
    }
  }
);

// DELETE /api/project/:id → elimina un proyecto y sus archivos del disco
app.delete("/api/project/:id", (req, res) => {
  try {
    const projectId = req.params.id;
    const db = readDB();
    const projectIndex = db.projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    const proyecto = db.projects[projectIndex];

    // 1) Borrar miniatura si existe
    if (proyecto.thumbnailPath) {
      const thumbDiskPath = path.join(__dirname, proyecto.thumbnailPath);
      if (fs.existsSync(thumbDiskPath)) {
        fs.unlinkSync(thumbDiskPath);
      }
    }

    // 2) Borrar cada archivo adjunto
    if (Array.isArray(proyecto.files)) {
      proyecto.files.forEach(f => {
        if (f.filePath) {
          const diskPath = path.join(__dirname, f.filePath);
          if (fs.existsSync(diskPath)) {
            fs.unlinkSync(diskPath);
          }
        }
      });
    }

    // 3) Eliminar el proyecto del arreglo y guardar DB
    db.projects.splice(projectIndex, 1);
    const okWrite = writeDB(db);
    if (!okWrite) {
      return res.status(500).json({ error: "Error al actualizar la base de datos" });
    }

    return res.json({ success: true, message: "Proyecto y archivos eliminados" });
  } catch (err) {
    console.error("Error en DELETE /api/project/:id:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/project/:id/comment → Agrega comentarios a un proyecto
app.post("/api/project/:id/comment", (req, res) => {
  try {
    const projectId = req.params.id;
    const { author, content } = req.body;
    
    if (!author || !content) {
      return res.status(400).json({ error: "Faltan autor o contenido del comentario" });
    }

    const db = readDB();
    const project = db.projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    // Asegurar que exista el array de comentarios
    if (!Array.isArray(project.comments)) {
      project.comments = [];
    }

    const newComment = {
      id: Date.now().toString(),
      author,
      content,
      createdAt: new Date().toISOString()
    };

    project.comments.push(newComment);
    const okWrite = writeDB(db);
    
    if (!okWrite) {
      return res.status(500).json({ error: "Error al guardar el comentario" });
    }

    res.json({ success: true, comment: newComment });
  } catch (err) {
    console.error("Error en POST /api/project/:id/comment:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});
// DELETE /api/project/:projectId/comment/:commentId → elimina un comentario
app.delete("/api/project/:projectId/comment/:commentId", (req, res) => {
  try {
    const projectId = req.params.projectId;
    const commentId = req.params.commentId;
    const { currentUser, isAdmin } = req.body; // Recibimos usuario y rol

    if (!currentUser) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const db = readDB();
    const project = db.projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    // Asegurar que exista el array de comentarios
    if (!Array.isArray(project.comments)) {
      return res.status(404).json({ error: "No hay comentarios" });
    }

    const commentIndex = project.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    const comment = project.comments[commentIndex];

    // Verificar permisos: solo el autor o un admin puede borrar
    if (comment.author !== currentUser && !isAdmin) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este comentario" });
    }

    // Eliminar el comentario
    project.comments.splice(commentIndex, 1);
    const okWrite = writeDB(db);
    
    if (!okWrite) {
      return res.status(500).json({ error: "Error al guardar los cambios" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error en DELETE /api/project/:projectId/comment/:commentId:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});
app.post("/api/project/:id/like", (req, res) => {
  try {
    const db = readDB();
    const projectId = req.params.id;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Usuario requerido" });
    }

    const project = db.projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    if (!Array.isArray(project.likes)) {
      project.likes = [];
    }

    const index = project.likes.indexOf(username);
    if (index === -1) {
      project.likes.push(username);
    } else {
      project.likes.splice(index, 1);
    }

    const ok = writeDB(db);
    if (!ok) {
      return res.status(500).json({ error: "Error guardando datos" });
    }

    return res.json({ success: true, likes: project.likes.length });
  } catch (err) {
    console.error("Error en /like:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
