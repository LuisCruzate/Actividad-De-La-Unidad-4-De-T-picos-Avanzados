import express from "express";
import Pedido from "../models/Pedido.js";

const router = express.Router();

// Middleware para verificar que el usuario esté autenticado
function verificarUsuario(req, res, next) {
  const userEmail = req.headers["x-user-email"];
  if (!userEmail) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }
  req.userEmail = userEmail;
  next();
}

// Crear nuevo pedido (POST /api/pedidos)
router.post("/", verificarUsuario, async (req, res) => {
  try {
    const { items, total, notas } = req.body;
    const usuario = req.userEmail;

    // Validar que haya items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "El carrito debe tener al menos un item" });
    }

    // Crear nuevo pedido
    const pedido = new Pedido({
      usuario,
      items,
      total,
      notas: notas || "",
      estado: "pendiente"
    });

    await pedido.save();

    res.status(201).json({
      message: "✅ Pedido creado exitosamente",
      id: pedido._id,
      pedido
    });
  } catch (error) {
    console.error("Error al crear pedido:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Obtener pedidos del usuario (GET /api/pedidos)
router.get("/", verificarUsuario, async (req, res) => {
  try {
    const usuario = req.userEmail;

    // Obtener todos los pedidos del usuario
    const pedidos = await Pedido.find({ usuario }).sort({ createdAt: -1 });

    res.json({
      message: "Pedidos del usuario",
      cantidad: pedidos.length,
      pedidos
    });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Obtener un pedido específico (GET /api/pedidos/:id)
router.get("/:id", verificarUsuario, async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.userEmail;

    // Buscar el pedido
    const pedido = await Pedido.findById(id);

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Verificar que el pedido pertenezca al usuario
    if (pedido.usuario !== usuario) {
      return res.status(403).json({ message: "No tienes acceso a este pedido" });
    }

    res.json(pedido);
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Actualizar estado del pedido (PUT /api/pedidos/:id)
router.put("/:id", verificarUsuario, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;
    const usuario = req.userEmail;

    // Buscar el pedido
    const pedido = await Pedido.findById(id);

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Verificar que el pedido pertenezca al usuario
    if (pedido.usuario !== usuario) {
      return res.status(403).json({ message: "No tienes acceso a este pedido" });
    }

    // Actualizar campos si se proporcionan
    if (estado) pedido.estado = estado;
    if (notas) pedido.notas = notas;

    await pedido.save();

    res.json({
      message: "✅ Pedido actualizado",
      pedido
    });
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Cancelar pedido (DELETE /api/pedidos/:id)
router.delete("/:id", verificarUsuario, async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.userEmail;

    // Buscar el pedido
    const pedido = await Pedido.findById(id);

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Verificar que el pedido pertenezca al usuario
    if (pedido.usuario !== usuario) {
      return res.status(403).json({ message: "No tienes acceso a este pedido" });
    }

    // Cambiar estado a cancelado en lugar de eliminar
    pedido.estado = "cancelado";
    await pedido.save();

    res.json({
      message: "✅ Pedido cancelado",
      pedido
    });
  } catch (error) {
    console.error("Error al cancelar pedido:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
