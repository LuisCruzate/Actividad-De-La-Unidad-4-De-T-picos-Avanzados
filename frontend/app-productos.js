const API_PRODUCTS = "http://localhost:5000/api/products";
const BACKEND_BASE = "http://localhost:5000";
const categoriasButtons = document.getElementById("categoriasButtons");
const productosContainer = document.getElementById("productosContainer");
const btnAgregarProducto = document.getElementById("btnAgregarProducto");
const btnCarrito = document.getElementById("btnCarrito");
const btnHistorial = document.getElementById("btnHistorial");
const btnPerfil = document.getElementById("btnPerfil");
const usuarioInfo = document.getElementById("usuarioInfo");
const btnSalir = document.getElementById("btnSalir");

function resolveUrl(url) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) {
    if (window.location.origin && window.location.origin !== "null") {
      return window.location.origin + url;
    }
    return BACKEND_BASE + url;
  }
  return url;
}

let productosCache = [];
let user = null;
let categoriaActual = "all";

function setUserFromStorage() {
  const raw = localStorage.getItem("user");
  if (raw) {
    user = JSON.parse(raw);
    // El header ahora se actualiza automáticamente con header-utils.js
    // usuarioInfo.innerText = `👤 ${user.correo}`;
    btnSalir.style.display = "inline-block";
    btnPerfil.style.display = "inline-block";
    btnAgregarProducto.style.display = "inline-block";
    btnCarrito.style.display = "inline-block";
    btnHistorial.style.display = "inline-block";
  } else {
    // El header ahora se actualiza automáticamente con header-utils.js
    // usuarioInfo.innerText = "👤 Visitante";
    btnSalir.style.display = "none";
    btnPerfil.style.display = "none";
    btnAgregarProducto.style.display = "none";
    btnCarrito.style.display = "none";
    btnHistorial.style.display = "none";
  }
}

btnSalir.addEventListener("click", () => {
  localStorage.removeItem("user");
  user = null;
  setUserFromStorage();
  window.location.href = "index.html";
});

// Botón para ir a agregar producto
btnAgregarProducto.addEventListener("click", () => {
  window.location.href = "agregar-producto.html";
});

// Obtener todos los productos
async function fetchProductos() {
  productosContainer.innerHTML = "<p style='text-align: center; padding: 40px; color: #6b7280;'>Cargando productos...</p>";
  const res = await fetch(API_PRODUCTS);
  productosCache = await res.json();
  
  console.log("📦 Productos cargados:", productosCache.length);
  productosCache.forEach((p, idx) => {
    console.log(`[${idx}] ${p.nombre}:`, {
      imagenes: p.imagenes,
      imagenesCount: p.imagenes?.length || 0,
      tipos: p.imagenes?.map(img => ({
        imagen: img.substring(0, 50),
        esLocal: img.startsWith('/uploads'),
        esExterna: img.startsWith('http')
      }))
    });
  });
  
  renderCategoriasBotones(productosCache);
  renderProductos(productosCache);
}

// Generar botones de categorías
function renderCategoriasBotones(items) {
  const cats = Array.from(new Set(items.map(p => p.categoria))).sort();
  
  // Limpiar botones existentes (excepto el de "Todos")
  const allBtn = categoriasButtons.querySelector('[data-category="all"]');
  categoriasButtons.innerHTML = '';
  categoriasButtons.appendChild(allBtn);

  // Agregar botones de cada categoría
  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "category-btn";
    btn.textContent = cat;
    btn.dataset.category = cat;
    btn.addEventListener("click", () => filtrarPorCategoria(cat, btn));
    categoriasButtons.appendChild(btn);
  });

  // Event listener para el botón "Todos"
  const allButton = categoriasButtons.querySelector('[data-category="all"]');
  allButton.addEventListener("click", () => filtrarPorCategoria("all", allButton));
}

// Filtrar productos por categoría
function filtrarPorCategoria(categoriaId, btnElement) {
  categoriaActual = categoriaId;
  
  // Actualizar estado activo de botones
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  btnElement.classList.add("active");

  if (categoriaId === "all") {
    renderProductos(productosCache);
  } else {
    const filtrados = productosCache.filter(p => p.categoria === categoriaId);
    renderProductos(filtrados);
  }
}

// Función para formatear precio en pesos colombianos
function formatearPesoColombian(precio) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(precio);
}

// Renderizar productos como tarjetas
function renderProductos(items) {
  if (!items || items.length === 0) {
    productosContainer.innerHTML = "<p style='text-align: center; padding: 40px; color: #6b7280; grid-column: 1 / -1;'>No hay productos registrados</p>";
    return;
  }

  productosContainer.innerHTML = "";
  
  // Crear un contenedor grid para las tarjetas
  const grid = document.createElement("div");
  grid.className = "productos-grid";
  
  items.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    // Mostrar imagen si existe
    let imagenHTML = '';
    if (p.imagenes && p.imagenes.length > 0) {
      imagenHTML = `<img src="${resolveUrl(p.imagenes[0])}" alt="${p.nombre}" class="product-image" />`;
    } else {
      imagenHTML = `<div class="product-image-placeholder">📷</div>`;
    }

    let botonesAdmin = '';
    // Si el usuario es el creador, mostrar opciones de editar/eliminar
    if (user && user.correo === p.creadoPor) {
      botonesAdmin = `
        <div class="product-actions" style="margin-top: 10px;">
          <a href="editar-producto.html?id=${p._id}" class="btn-edit">✏️ Editar</a>
          <button onclick="eliminarProducto('${p._id}')" class="btn-delete">🗑️ Eliminar</button>
        </div>
      `;
    }

    let botonPedido = '';
    // Botón "Hacer Pedido" para todos
    botonPedido = `
      <button onclick="hacerPedido('${p._id}', '${p.nombre}', ${p.precio})" style="width: 100%; margin-top: 10px; padding: 10px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
        🛒 Hacer Pedido
      </button>
    `;

    card.innerHTML = `
      ${imagenHTML}
      <h4>${p.nombre}</h4>
      <span class="category">${p.categoria}</span>
      <div class="price">${formatearPesoColombian(parseFloat(p.precio))}</div>
      <div class="stock">📦 Stock: ${p.stock}</div>
      <div class="description">${p.descripcion || 'Sin descripción'}</div>
      ${botonPedido}
      ${botonesAdmin}
    `;
    
    grid.appendChild(card);
  });

  productosContainer.appendChild(grid);
}

// Agregar a carrito de pedidos
function hacerPedido(productoId, nombre, precio) {
  if (!user) {
    alert("Debes iniciar sesión para hacer un pedido");
    window.location.href = "index.html";
    return;
  }

  // Obtener carrito del localStorage
  let carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  
  // Buscar si el producto ya está en el carrito
  const itemExistente = carrito.find(item => item.id === productoId);
  
  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    carrito.push({
      id: productoId,
      nombre: nombre,
      precio: precio,
      cantidad: 1
    });
  }
  
  localStorage.setItem("carrito", JSON.stringify(carrito));
  alert(`✅ ${nombre} agregado al carrito`);
  
  // Actualizar contador del carrito si existe
  const contadorCarrito = document.getElementById("contadorCarrito");
  if (contadorCarrito) {
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    contadorCarrito.textContent = total;
  }
}

// Eliminar producto
async function eliminarProducto(id) {
  if (!user) return alert("Debes iniciar sesión");
  if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
  
  const res = await fetch(`${API_PRODUCTS}/${id}`, {
    method: "DELETE",
    headers: { "x-user-email": user.correo }
  });
  
  if (res.ok) {
    alert("✅ Producto eliminado");
    fetchProductos();
  } else {
    const err = await res.json();
    alert("❌ " + (err.message || "Error al eliminar"));
  }
}

// Inicializar
setUserFromStorage();
fetchProductos();
