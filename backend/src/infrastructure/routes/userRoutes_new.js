import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { authMiddleware, ownershipMiddleware } from "../middleware/authMiddleware.js";
import {
  registrarUsuario,
  loginUsuario,
  listarUsuarios,
  obtenerPerfilUsuario,
  actualizarPerfilUsuario,
  cambiarContraseñaUsuario,
  forgotPassword,
  resetPassword
} from "../../application/userService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Crear directorio de uploads
const uploadsDir = path.join(__dirname, "..", "..", "..", "..", "frontend", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer con validación segura
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);

    if (mime && ext) {
      cb(null, true);
    } else {
      cb(new Error("Solo imágenes permitidas (JPEG, PNG, GIF, WebP)"));
    }
  }
});

/**
 * POST /api/users/register
 * Registrar nuevo usuario SIN validaciones estrictas
 */
router.post("/register", async (req, res) => {
  try {
    console.log("📝 Intentando registrar usuario:", req.body.correo);
    const result = await registrarUsuario(req.body);
    console.log("✅ Usuario registrado:", result.user.correo);
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error("❌ Error en registro:", error.message);
    if (error.message.includes("ya está registrado")) {
      return res.status(409).json({ message: "El correo ya está registrado" });
    }
    res.status(500).json({ message: "Error en el registro: " + error.message });
  }
});

/**
 * POST /api/users/login
 * Login SIN validaciones estrictas
 */
router.post("/login", async (req, res) => {
  try {
    console.log("🔐 Intentando login:", req.body.correo);
    const result = await loginUsuario(req.body.correo, req.body.contraseña);
    console.log("✅ Login exitoso:", result.user.correo);
    res.json({
      message: "Login exitoso",
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error("❌ Error en login:", error.message);
    res.status(401).json({ message: error.message });
  }
});

/**
 * POST /api/users/forgot-password
 * Solicitar recuperación de contraseña
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ message: "Correo requerido" });
    }

    const result = await forgotPassword(correo);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error en la solicitud" });
  }
});

/**
 * POST /api/users/reset-password
 * Resetear contraseña con token
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, nuevaContraseña } = req.body;

    if (!token || !nuevaContraseña) {
      return res.status(400).json({ message: "Token y contraseña requeridos" });
    }

    const result = await resetPassword(token, nuevaContraseña);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * GET /api/users
 * Listar todos los usuarios (sin contraseñas)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const users = await listarUsuarios();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error al listar usuarios" });
  }
});

/**
 * GET /api/users/:id
 * Obtener perfil de un usuario
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await obtenerPerfilUsuario(req.params.id);
    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * PUT /api/users/:id
 * Actualizar perfil (solo el usuario propietario)
 */
router.put(
  "/:id",
  authMiddleware,
  ownershipMiddleware,
  async (req, res) => {
    try {
      const user = await actualizarPerfilUsuario(req.params.id, req.body);
      res.json({
        message: "Perfil actualizado exitosamente",
        user
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * POST /api/users/:id/change-password
 * Cambiar contraseña (verifica la actual)
 */
router.post(
  "/:id/change-password",
  authMiddleware,
  ownershipMiddleware,
  async (req, res) => {
    try {
      const { contraseñaActual, contraseñaNueva } = req.body;
      const result = await cambiarContraseñaUsuario(
        req.params.id,
        contraseñaActual,
        contraseñaNueva
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * POST /api/users/:id/upload-avatar
 * Subir avatar (usuario autenticado)
 */
router.post(
  "/:id/upload-avatar",
  authMiddleware,
  ownershipMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const avatarPath = `/uploads/${req.file.filename}`;
      const user = await actualizarPerfilUsuario(req.params.id, {
        avatar: avatarPath
      });

      res.json({
        message: "Avatar subido exitosamente",
        user,
        avatarUrl: avatarPath
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;