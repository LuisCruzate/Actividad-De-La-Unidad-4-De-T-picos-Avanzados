import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema({
  usuario: { type: String, required: true }, // correo del usuario
  items: [
    {
      id: { type: String, required: true },
      nombre: { type: String, required: true },
      precio: { type: Number, required: true },
      cantidad: { type: Number, required: true, default: 1 }
    }
  ],
  total: { type: Number, required: true },
  estado: { 
    type: String, 
    enum: ["pendiente", "procesando", "enviado", "entregado", "cancelado"],
    default: "pendiente"
  },
  notas: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Pedido", pedidoSchema);
