// Variable global para el usuario actual
let user = JSON.parse(localStorage.getItem("user"));

// Elementos del DOM
const pedidosContent = document.getElementById("pedidosContent");
const usuarioInfo = document.getElementById("usuarioInfo");
const btnSalir = document.getElementById("btnSalir");

// Función para formatear precio en pesos colombianos
function formatearPesoColombian(precio) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(precio);
}

// Función para formatear fecha
function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Función para obtener clase CSS por estado
function getClaseEstado(estado) {
  const clases = {
    pendiente: "estado-pendiente",
    procesando: "estado-procesando",
    enviado: "estado-enviado",
    entregado: "estado-entregado",
    cancelado: "estado-cancelado",
  };
  return clases[estado] || "estado-pendiente";
}

// Función para obtener etiqueta de estado
function getEtiquetaEstado(estado) {
  const etiquetas = {
    pendiente: "⏳ Pendiente",
    procesando: "⚙️ Procesando",
    enviado: "📦 Enviado",
    entregado: "✅ Entregado",
    cancelado: "❌ Cancelado",
  };
  return etiquetas[estado] || estado;
}

// Función para verificar si el usuario está logueado
function verificarSesion() {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  // El header ahora se actualiza automáticamente con header-utils.js
  // usuarioInfo.textContent = `👤 ${user.correo}`;
  btnSalir.style.display = "block";
}

// Función para cargar historial de pedidos
async function cargarPedidos() {
  try {
    pedidosContent.innerHTML =
      '<p style="text-align: center; padding: 40px; color: #6b7280;">Cargando pedidos...</p>';

    const response = await fetch("http://localhost:5000/api/pedidos", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": user.correo,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    const pedidos = data.pedidos || [];

    if (pedidos.length === 0) {
      pedidosContent.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem 1.5rem; background: linear-gradient(135deg, rgba(5, 150, 105, 0.05), rgba(16, 185, 129, 0.05)); border: 2px dashed var(--border-color);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
          <h2 style="color: var(--text-primary); margin-bottom: 1rem; font-weight: 700;">No tienes pedidos aún</h2>
          <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 1.1rem;">¡Comienza tu viaje hacia un consumo sostenible!</p>
          <a href="productos.html" class="btn btn-primary" style="padding: 0.75rem 2rem; font-size: 1.1rem;">
            🛍️ Explorar Productos Sostenibles
          </a>
        </div>
      `;
      return;
    }

    // Ordenar por fecha más reciente
    pedidos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Crear HTML para cada pedido
    let html = "";
    pedidos.forEach((pedido) => {
      const porcentajeProgreso = getProgresoPedido(pedido.estado);

      html += `
        <div class="card" style="margin-bottom: 1.5rem; cursor: pointer;" onclick="toggleDetalles('${pedido._id}')">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.75rem;">
            <div>
              <span style="font-weight: 700; color: var(--primary-color); font-size: 0.95rem;">Pedido #${pedido._id.substring(0, 8).toUpperCase()}</span>
              <br>
              <small style="color: var(--text-secondary);">${formatearFecha(pedido.createdAt)}</small>
            </div>
            <span class="${getClaseEstado(pedido.estado)}" style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600;">
              ${getEtiquetaEstado(pedido.estado)}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div style="padding: 0.75rem; background: linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(16, 185, 129, 0.1)); border-radius: var(--radius);">
              <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Cantidad de items</label>
              <span style="font-weight: 600; color: var(--primary-color);">${pedido.items.length}</span>
            </div>
            <div style="padding: 0.75rem; background: linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(16, 185, 129, 0.1)); border-radius: var(--radius);">
              <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Total</label>
              <span style="font-weight: 600; color: var(--primary-color);">${formatearPesoColombian(pedido.total)}</span>
            </div>
            <div style="padding: 0.75rem; background: linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(16, 185, 129, 0.1)); border-radius: var(--radius);">
              <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Progreso</label>
              <span style="font-weight: 600; color: var(--primary-color);">${porcentajeProgreso}%</span>
            </div>
          </div>

          <div style="background: var(--background-color); padding: 0.75rem; border-radius: var(--radius); margin-bottom: 0.75rem; max-height: 150px; overflow-y: auto;">
            ${pedido.items.map((item) => `
              <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem; border-bottom: 1px solid var(--border-color);">
                <span>${item.nombre} x${item.cantidad}</span>
                <span>${formatearPesoColombian(item.precio * item.cantidad)}</span>
              </div>
            `).join("")}
          </div>

          <div style="display: flex; gap: 0.75rem;">
            ${pedido.estado === "pendiente" || pedido.estado === "procesando" ? `
              <button onclick="cancelarPedido('${pedido._id}', event)" class="btn btn-danger">
                Cancelar Pedido
              </button>
            ` : ""}
            <button onclick="verDetalles('${pedido._id}')" class="btn btn-primary">
              Ver Detalles
            </button>
          </div>
        </div>
      `;
    });

    pedidosContent.innerHTML = html;
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
    pedidosContent.innerHTML = `
      <div class="pedidos-vacio">
        <h2>❌ Error al cargar pedidos</h2>
        <p>${error.message}</p>
        <button onclick="cargarPedidos()" class="btn btn-primary" style="margin-top: 15px;">
          Reintentar
        </button>
      </div>
    `;
  }
}

// Función para obtener progreso del pedido
function getProgresoPedido(estado) {
  const progreso = {
    pendiente: 25,
    procesando: 50,
    enviado: 75,
    entregado: 100,
    cancelado: 0,
  };
  return progreso[estado] || 0;
}

// Función para cancelar pedido
async function cancelarPedido(pedidoId, event) {
  event.stopPropagation();

  if (!confirm("¿Estás seguro de que deseas cancelar este pedido?")) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/pedidos/${pedidoId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": user.correo,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    alert("✅ Pedido cancelado exitosamente");
    cargarPedidos();
  } catch (error) {
    console.error("Error al cancelar pedido:", error);
    alert(`❌ Error al cancelar: ${error.message}`);
  }
}

// Función para ver detalles del pedido
function verDetalles(pedidoId) {
  // Para futuro: abrir modal o página de detalles
  console.log("Ver detalles de pedido:", pedidoId);
  alert("Función de detalles en desarrollo");
}

// Función para toggle detalles
function toggleDetalles(pedidoId) {
  // Para futuro: expandir/contraer detalles
  console.log("Toggle detalles:", pedidoId);
}

// Event listeners
btnSalir.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

// Inicializar página
document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();
  cargarPedidos();
});
