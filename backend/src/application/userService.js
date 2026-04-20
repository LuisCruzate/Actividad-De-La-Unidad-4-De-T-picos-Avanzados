/**
 * Servicio de usuarios con seguridad robusta
 * - Hash de contraseñas con bcrypt
 * - JWT para autenticación
 * - Validaciones y sanitización
 * - Rate limiting de intentos fallidos
 * - Auditoría de accesos
 */

import User from "../infrastructure/models/User.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_muy_segura_cambiar_en_produccion";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "24h";
const MAX_INTENTOS_FALLIDOS = 5;
const TIEMPO_BLOQUEO = 15 * 60 * 1000;

/**
 * Registrar un nuevo usuario
 */
export async function registrarUsuario(data) {
  try {
    const usuarioExistente = await User.findOne({ correo: data.correo.toLowerCase() });
    if (usuarioExistente) {
      throw new Error("El correo ya está registrado");
    }

    const user = new User({
      ...data,
      correo: data.correo.toLowerCase(),
      rol: "cliente"
    });

    await user.save();
    const token = generarJWT(user._id, user.rol);

    console.log(`✅ [AUDIT] Nuevo registro: ${user.correo}`);

    return { user: user.toJSON(), token };
  } catch (error) {
    console.error("❌ Error en registro:", error.message);
    throw error;
  }
}

/**
 * Login de usuario con bcrypt
 */
export async function loginUsuario(correo, contraseña) {
  try {
    correo = correo.toLowerCase();
    const user = await User.findOne({ correo });

    if (!user) {
      console.log(`⚠️ [AUDIT] Intento fallido: ${correo} (no existe)`);
      throw new Error("Credenciales inválidas");
    }

    if (user.bloqueadoHasta && user.bloqueadoHasta > new Date()) {
      const tiempoRestante = Math.ceil((user.bloqueadoHasta - new Date()) / 1000 / 60);
      throw new Error(`Cuenta bloqueada. Intenta en ${tiempoRestante} minutos`);
    }

    const esValida = await user.compararContraseña(contraseña);

    if (!esValida) {
      user.intentosFallidos += 1;

      if (user.intentosFallidos >= MAX_INTENTOS_FALLIDOS) {
        user.bloqueadoHasta = new Date(Date.now() + TIEMPO_BLOQUEO);
        console.log(`🔒 [AUDIT] Bloqueado: ${correo}`);
      }

      await user.save();
      throw new Error("Credenciales inválidas");
    }

    user.intentosFallidos = 0;
    user.bloqueadoHasta = null;
    user.ultimoAcceso = new Date();
    await user.save();

    const token = generarJWT(user._id, user.rol);
    console.log(`✅ [AUDIT] Login: ${correo}`);

    return { user: user.toJSON(), token };
  } catch (error) {
    console.error("❌ Error en login:", error.message);
    throw error;
  }
}

/**
 * Generar JWT
 */
export function generarJWT(userId, rol = "cliente") {
  const payload = {
    id: userId.toString(),
    role: rol,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Listar usuarios
 */
export async function listarUsuarios() {
  return await User.find()
    .select("-contraseña -intentosFallidos -bloqueadoHasta")
    .lean();
}

/**
 * Obtener perfil
 */
export async function obtenerPerfilUsuario(userId) {
  try {
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error("ID inválido");
    }

    const user = await User.findById(userId)
      .select("-contraseña -intentosFallidos");

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    return user.toJSON();
  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error.message);
    throw error;
  }
}

/**
 * Actualizar perfil
 */
export async function actualizarPerfilUsuario(userId, updateData) {
  try {
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error("ID inválido");
    }

    const camposPermitidos = [
      'nombre', 'telefono', 'direccion', 'ciudad',
      'fechaNacimiento', 'descripcion', 'avatar'
    ];

    const datosFiltrados = {};
    camposPermitidos.forEach(campo => {
      if (campo in updateData) {
        datosFiltrados[campo] = updateData[campo];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      datosFiltrados,
      { new: true, runValidators: true }
    ).select("-contraseña -intentosFallidos");

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    console.log(`🔄 [AUDIT] Perfil actualizado: ${userId}`);
    return user.toJSON();
  } catch (error) {
    console.error("❌ Error actualizando:", error.message);
    throw error;
  }
}

/**
 * Cambiar contraseña
 */
export async function cambiarContraseñaUsuario(userId, contraseñaActual, contraseñaNueva) {
  try {
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error("ID inválido");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const esValida = await user.compararContraseña(contraseñaActual);
    if (!esValida) {
      console.log(`⚠️ [AUDIT] Intento fallido cambio contraseña: ${userId}`);
      throw new Error("La contraseña actual es incorrecta");
    }

    user.contraseña = contraseñaNueva;
    await user.save();

    console.log(`✅ [AUDIT] Contraseña cambiada: ${userId}`);
    return { success: true, message: "Contraseña cambiada exitosamente" };
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

/**
 * Forgot password
 */
export async function forgotPassword(correo) {
  try {
    correo = correo.toLowerCase();

    const user = await User.findOne({ correo });
    if (!user) {
      console.log(`⚠️ [AUDIT] Intento recuperación con email inexistente: ${correo}`);
      return { success: true, message: "Si el email existe, recibirás instrucciones" };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    console.log(`📧 [AUDIT] Recuperación solicitada: ${correo}`);

    return {
      success: true,
      message: "Si el email existe, recibirás instrucciones",
      resetToken: process.env.NODE_ENV === "development" ? resetToken : undefined
    };
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

/**
 * Reset password
 */
export async function resetPassword(resetToken, nuevaContraseña) {
  try {
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetToken: resetTokenHash,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      throw new Error("Token inválido o expirado");
    }

    user.contraseña = nuevaContraseña;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    console.log(`✅ [AUDIT] Contraseña reseteada: ${user.correo}`);
    return { success: true, message: "Contraseña reseteada exitosamente" };
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}


