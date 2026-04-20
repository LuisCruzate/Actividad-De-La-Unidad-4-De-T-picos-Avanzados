import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: { type: String, required: true },
  descripcion: { type: String, default: "" },
  precio: { type: Number, required: true, default: 0 },
  stock: { type: Number, default: 0 },
  imagenes: { type: [String], default: [] }, // Array de URLs de imágenes
  creadoPor: { type: String } // correo del usuario que creó
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
