// Variable global para el usuario actual
let user = JSON.parse(localStorage.getItem("user"));

// Elementos del DOM
const carritoContent = document.getElementById("carritoContent");
const usuarioInfo = document.getElementById("usuarioInfo");
const btnSalir = document.getElementById("btnSalir");

// Función para formatear precio en pesos colombianos
function formatearPesoColombian(precio) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(precio);
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

// Función para cargar y mostrar el carrito
function cargarCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");

  if (carrito.length === 0) {
    carritoContent.innerHTML = `
      <div class="text-center" style="padding: 3rem 1rem;">
        <h2 style="color: var(--text-secondary); margin-bottom: 1rem;">Tu carrito está vacío 😢</h2>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">Explora nuestros productos sostenibles</p>
        <a href="productos.html" class="btn btn-primary">
          → Ir a Productos
        </a>
      </div>
    `;
    return;
  }

  // Calcular totales
  let total = 0;
  let totalItems = carrito.length;

  // Crear tabla de items
  let html = '<div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">';
  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius);">
        <div style="flex: 1;">
          <h4 style="margin: 0; color: var(--primary-color); font-size: 1.1rem;">${item.nombre}</h4>
          <span style="font-weight: 600; color: var(--primary-color);">${formatearPesoColombian(item.precio)}</span>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center; margin: 0 1rem;">
          <button onclick="disminuirCantidad(${index})" class="btn" style="padding: 0.25rem 0.5rem; min-height: 32px;">−</button>
          <input type="number" value="${item.cantidad}" min="1" onchange="cambiarCantidad(${index}, this.value)" style="width: 60px; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: var(--radius); text-align: center;">
          <button onclick="aumentarCantidad(${index})" class="btn" style="padding: 0.25rem 0.5rem; min-height: 32px;">+</button>
        </div>
        <div style="font-weight: 600; min-width: 120px; text-align: right;">${formatearPesoColombian(subtotal)}</div>
        <button onclick="eliminarDelCarrito(${index})" class="btn btn-danger" style="padding: 0.5rem; margin-left: 1rem;">
          ✕
        </button>
      </div>
    `;
  });
  html += "</div>";

  // Agregar resumen
  html += `
    <div style="background: linear-gradient(135deg, rgba(5, 150, 105, 0.05), rgba(16, 185, 129, 0.05)); padding: 1.5rem; border-radius: var(--radius); border-left: 4px solid var(--primary-color);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
        <span>Productos:</span>
        <span>${totalItems}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
        <span>Subtotal:</span>
        <span>${formatearPesoColombian(total)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
        <span>Envío:</span>
        <span>Gratis</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 700; color: var(--primary-color); border-top: 2px solid var(--border-color); padding-top: 0.75rem; margin-top: 0.75rem;">
        <span>Total:</span>
        <span>${formatearPesoColombian(total)}</span>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem;">
      <a href="productos.html" class="btn btn-secondary">← Continuar Comprando</a>
      <button onclick="procesarPedido()" class="btn btn-primary">✓ Confirmar Pedido</button>
    </div>
  `;

  carritoContent.innerHTML = html;
}

// Función para aumentar cantidad
function aumentarCantidad(index) {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  if (carrito[index]) {
    carrito[index].cantidad += 1;
    localStorage.setItem("carrito", JSON.stringify(carrito));
    cargarCarrito();
  }
}

// Función para disminuir cantidad
function disminuirCantidad(index) {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  if (carrito[index]) {
    if (carrito[index].cantidad > 1) {
      carrito[index].cantidad -= 1;
      localStorage.setItem("carrito", JSON.stringify(carrito));
      cargarCarrito();
    } else {
      eliminarDelCarrito(index);
    }
  }
}

// Función para cambiar cantidad manualmente
function cambiarCantidad(index, nuevaCantidad) {
  const cantidad = parseInt(nuevaCantidad);
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");

  if (carrito[index]) {
    if (cantidad < 1) {
      eliminarDelCarrito(index);
    } else {
      carrito[index].cantidad = cantidad;
      localStorage.setItem("carrito", JSON.stringify(carrito));
      cargarCarrito();
    }
  }
}

// Función para eliminar del carrito
function eliminarDelCarrito(index) {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  cargarCarrito();
}

// Función para procesar el pedido
async function procesarPedido() {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");

  if (carrito.length === 0) {
    alert("❌ El carrito está vacío");
    return;
  }

  try {
    // Calcular total
    const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

    // Crear objeto del pedido
    const pedido = {
      items: carrito,
      total: total,
      fecha: new Date().toISOString(),
      estado: "pendiente",
    };

    // Enviar al servidor
    const response = await fetch("http://localhost:5000/api/pedidos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": user.correo,
      },
      body: JSON.stringify(pedido),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const resultado = await response.json();

    // Limpiar carrito y mostrar confirmación
    localStorage.removeItem("carrito");

    // Mostrar mensaje de éxito
    carritoContent.innerHTML = `
      <div class="text-center" style="padding: 3rem 1rem;">
        <h2 style="color: var(--primary-color); margin-bottom: 1rem;">✅ ¡Pedido Confirmado!</h2>
        <p style="margin-bottom: 0.5rem;"><strong>Número de pedido:</strong> ${resultado.id || "Pendiente"}</p>
        <p style="margin-bottom: 1rem;"><strong>Total:</strong> ${formatearPesoColombian(total)}</p>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">
          Recibirás un correo de confirmación en ${user.correo}
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a href="productos.html" class="btn btn-primary">
            ← Volver a Productos
          </a>
          <a href="historial-pedidos.html" class="btn btn-secondary">
            📦 Mis Pedidos
          </a>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error al procesar pedido:", error);
    alert(`❌ Error al procesar el pedido: ${error.message}`);
  }
}

// Event listeners
btnSalir.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

// Inicializar página
document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();
  cargarCarrito();
});
