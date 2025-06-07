// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// MULTER CONFIG
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + file.originalname;
    cb(null, unique);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// GET /api/data
app.get('/api/data', (req, res) => {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo base de datos' });
  }
});

// PUT /api/data (usuarios + reportes)
app.put('/api/data', (req, res) => {
  try {
    const nuevoContenido = req.body;
    if (
      !Array.isArray(nuevoContenido.projects) ||
      !Array.isArray(nuevoContenido.users) ||
      !Array.isArray(nuevoContenido.reports)
    ) return res.status(400).json({ error: 'Formato inválido' });

    fs.writeFileSync(DB_PATH, JSON.stringify(nuevoContenido, null, 2), 'utf-8');
    res.json({ mensaje: 'Datos guardados exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar la base de datos' });
  }
});

// POST /api/project (subir nuevo proyecto)
app.post('/api/project', upload.array('files', 10), (req, res) => {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const allData = JSON.parse(raw);

    const { name, description, category, technologies, status, author } = req.body;
    const project = {
      id: Date.now().toString(),
      name,
      description,
      category,
      technologies: technologies ? technologies.split(',').map(t => t.trim()) : [],
      status,
      author,
      createdAt: new Date().toISOString(),
      files: req.files.map(f => ({
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
        filePath: `/uploads/${f.filename}`
      }))
    };

    allData.projects.unshift(project);
    fs.writeFileSync(DB_PATH, JSON.stringify(allData, null, 2), 'utf-8');
    res.status(201).json({ mensaje: 'Proyecto creado con éxito', project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear el proyecto' });
  }
});
const path = require('path');
// … tus otros app.use y endpoints …

// Sirve index.html para la ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// Finalmente…
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
