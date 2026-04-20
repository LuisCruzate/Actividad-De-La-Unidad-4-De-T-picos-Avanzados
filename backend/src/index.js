import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import productRoutes from "./infrastructure/routes/productRoutes.js";
import userRoutes from "./infrastructure/routes/userRoutes.js";
import pedidosRoutes from "./infrastructure/routes/pedidosRoutes.js";
import { fileURLToPath } from "url";
import fs from "fs";
import { upload } from "./infrastructure/multerConfig.js";

dotenv.config();
const app = express();
console.log("🔧 INICIANDO SERVIDOR CON LOGGING HABILITADO");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MIDDLEWARE DE LOGGING GLOBAL
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Configurar rutas estáticas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, "..", "..", "frontend", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pedidos", pedidosRoutes);

// TEST endpoint para inspeccionar FormData
app.post("/api/test-formdata", (req, res) => {
  console.log("🧪 [FORMDATA TEST] Body recibido:");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("🧪 [FORMDATA TEST] Body keys:", Object.keys(req.body));
  res.json({ 
    message: "FormData test",
    bodyReceived: req.body,
    keys: Object.keys(req.body)
  });
});

// TEST endpoint simple para verificar que se ejecuta
app.post("/api/test-simple", (req, res) => {
  console.error("🟡 [TEST SIMPLE] Petición POST recibida instantáneamente");
  console.error("🟡 Body:", JSON.stringify(req.body).substring(0, 100));
  res.json({ message: "OK desde test-simple" });
});

// TEST endpoint sin validaciones
app.post("/api/debug/test", (req, res) => {
  console.log("🧪 [TEST] Petición POST /api/debug/test recibida");
  console.log("🧪 [TEST] Body:", JSON.stringify(req.body, null, 2));
  res.json({ message: "Test endpoint works", data: req.body });
});

// TEST endpoint para registro directo
app.post("/register-test", async (req, res) => {
  try {
    console.log("🧪 [REGISTER-TEST] Petición POST /register-test recibida");
    console.log("🧪 [REGISTER-TEST] Body:", JSON.stringify(req.body, null, 2));

    // Importar userService dinámicamente para evitar problemas de cache
    const { registrarUsuario } = await import('./application/userService.js');
    const result = await registrarUsuario(req.body);

    console.log("🧪 [REGISTER-TEST] Usuario registrado:", result.user.correo);
    res.status(201).json({
      message: "Usuario registrado exitosamente (test)",
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error("🧪 [REGISTER-TEST] Error:", error.message);
    res.status(500).json({ message: "Error en registro de test: " + error.message });
  }
});

// serve frontend static AFTER API routes
app.use("/uploads", express.static(path.join(__dirname, "..", "..", "frontend", "uploads")));
app.use("/", express.static(path.join(__dirname, "..", "..", "frontend")));

// Connect MongoDB
const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/productos_sostenibles";
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error de conexión:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
});