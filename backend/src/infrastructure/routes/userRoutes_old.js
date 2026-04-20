import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { registrarUsuario, loginUsuario, listarUsuarios, obtenerPerfilUsuario, actualizarPerfilUsuario, cambiarContraseñaUsuario } from "../../application/userService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Crear directorio de uploads si no existe
import fs from "fs";
const uploadsDir = path.join(__dirname, "..", "..", "..", "..", "frontend", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para subida de avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const { nombre, correo, contraseña } = req.body;
    if (!correo || !contraseña) return res.status(400).json({ message: "correo y contraseña son requeridos" });
    const exist = await registrarUsuario({ nombre, correo, contraseña });
    res.status(201).json({ message: "Usuario creado", correo: exist.correo });
  } catch (err) {
    // manejo simple de duplicados
    if (err.code === 11000) return res.status(400).json({ message: "Correo ya registrado" });
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// POST /api/users/login
router.post("/login", async (req, res) => {
  try {
    const { correo, contraseña } = req.body;
    const user = await loginUsuario(correo, contraseña);
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });
    // No enviamos la contraseña de vuelta
    const { contraseña: _, ...safe } = user;
    res.json({ message: "Login OK", user: safe });
  } catch (err) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const users = await listarUsuarios();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// GET /api/users/profile - Obtener perfil del usuario actual
router.get("/profile", async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    console.log("📥 GET /profile - userId:", userId, "headers:", req.headers);
    
    if (!userId) {
      console.log("❌ FALTA user-id header");
      return res.status(400).json({ error: "User ID requerido en headers (user-id)" });
    }

    const user = await obtenerPerfilUsuario(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log("✅ GET /profile OK:", user._id);
    res.json({ user });
  } catch (err) {
    console.error("💥 Error en GET /profile:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

// PUT /api/users/profile - Actualizar perfil del usuario
router.put("/profile", async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    console.log("📥 PUT /profile - userId:", userId, "body:", req.body);
    
    if (!userId) {
      console.log("❌ FALTA user-id header en PUT");
      return res.status(400).json({ error: "User ID requerido en headers (user-id)" });
    }

    const updateData = { ...req.body };
    // No permitir actualizar contraseña/correo/userId
    delete updateData.contraseña;
    delete updateData.correo;
    delete updateData.userId;

    const user = await actualizarPerfilUsuario(userId, updateData);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log("✅ PUT /profile OK:", user._id);
    res.json({ message: "Perfil actualizado exitosamente", user });
  } catch (err) {
    console.error("💥 Error en PUT /profile:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

// POST /api/users/change-password - Cambiar contraseña
router.post("/change-password", async (req, res) => {
  try {
    const userId = req.headers['user-id'] || req.body.userId;
    if (!userId) return res.status(400).json({ message: "User ID requerido" });

    const { contraseñaVieja, nuevaContraseña } = req.body;
    if (!contraseñaVieja || !nuevaContraseña) {
      return res.status(400).json({ message: "contraseñaVieja y nuevaContraseña requeridas" });
    }

    const result = await cambiarContraseñaUsuario(userId, contraseñaVieja, nuevaContraseña);
    if (result.success) {
      res.json({ message: "Contraseña cambiada exitosamente" });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (err) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// POST /api/users/forgot-password - Olvidé contraseña
router.post("/forgot-password", async (req, res) => {
  try {
    const { correo } = req.body;
    if (!correo) return res.status(400).json({ message: "Correo requerido" });

    const result = await forgotPassword(correo);
    if (result.success) {
      res.json({ message: "Email de recuperación enviado (ver console para simulación)" });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (err) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// POST /api/users/upload-avatar - Subir avatar
router.post("/upload-avatar", upload.single('avatar'), async (req, res) => {
  try {
    console.log("📥 POST /upload-avatar - files:", req.file ? req.file.filename : null, "userId:", req.body.userId);
    
    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ message: "No se recibió ningún archivo" });
    }

    const userId = req.body.userId;
    if (!userId) {
      console.log("❌ FALTA userId en body");
      return res.status(400).json({ message: "User ID requerido en body (userId)" });
    }

    // Guardar la ruta del archivo en el perfil del usuario
    const avatarPath = `/uploads/${req.file.filename}`;
    const user = await actualizarPerfilUsuario(userId, { avatar: avatarPath });

    if (!user) {
      console.log("❌ Usuario no encontrado para avatar:", userId);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    console.log("✅ Avatar subido:", avatarPath);
    res.json({
      message: "Avatar subido exitosamente",
      avatarUrl: avatarPath,
      user: user
    });
  } catch (err) {
    console.error("💥 Error subiendo avatar:", err);
    res.status(500).json({ message: err.message || "Error interno del servidor" });
  }
});

export default router;
