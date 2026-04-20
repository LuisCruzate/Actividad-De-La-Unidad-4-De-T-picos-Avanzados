// Reglas de negocio para productos (capa application)
import Product from "../infrastructure/models/Product.js";

export async function listarProductos() {
  return await Product.find().sort({ createdAt: -1 }).lean();
}

export async function listarPorCategoria(categoria) {
  return await Product.find({ categoria }).sort({ createdAt: -1 }).lean();
}

export async function obtenerProductoPorId(id) {
  return await Product.findById(id).lean();
}

export async function crearProducto(data) {
  const p = new Product(data);
  return await p.save();
}

export async function actualizarProducto(id, data) {
  return await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
}

export async function eliminarProducto(id) {
  return await Product.findByIdAndDelete(id);
}
