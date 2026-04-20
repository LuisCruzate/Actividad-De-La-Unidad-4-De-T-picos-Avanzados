import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: false },
  correo: { type: String, required: true, unique: true, lowercase: true },
  contraseña: { type: String, required: true },
  rol: { type: String, default: "cliente", enum: ["cliente", "admin"] },
  // Campos adicionales para el perfil
  telefono: { type: String, required: false },
  direccion: { type: String, required: false },
  ciudad: { type: String, required: false },
  fechaNacimiento: { type: Date, required: false },
  descripcion: { type: String, required: false },
  avatar: { type: String, required: false }, // URL de la imagen de perfil
  activo: { type: Boolean, default: true },
  intentosFallidos: { type: Number, default: 0 },
  bloqueadoHasta: { type: Date, default: null },
  fechaRegistro: { type: Date, default: Date.now },
  ultimoAcceso: { type: Date, default: null }
}, { timestamps: true });

// Hash de contraseña ANTES de guardar
userSchema.pre("save", async function(next) {
  if (!this.isModified("contraseña")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.compararContraseña = async function(contraseña) {
  return await bcrypt.compare(contraseña, this.contraseña);
};

// No retornar la contraseña en toJSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.contraseña;
  delete user.intentosFallidos;
  delete user.bloqueadoHasta;
  return user;
};

export default mongoose.model("User", userSchema);
