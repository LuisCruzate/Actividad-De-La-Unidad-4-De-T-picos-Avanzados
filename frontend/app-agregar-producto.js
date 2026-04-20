const API_PRODUCTS = "http://localhost:5000/api/products";
const usuarioInfo = document.getElementById("usuarioInfo");
const btnSalir = document.getElementById("btnSalir");
const formulario = document.getElementById("formularioProducto");
const msg = document.getElementById("msg");
const inputImagenes = document.getElementById("imagenes");
const imagePreview = document.getElementById("imagePreview");
const inputUrlImagen = document.getElementById("urlImagen");
const btnAgregarUrl = document.getElementById("btnAgregarUrl");

const fields = {
  nombre: document.getElementById("nombre"),
  categoria: document.getElementById("categoria"),
  precio: document.getElementById("precio"),
  stock: document.getElementById("stock"),
  descripcion: document.getElementById("descripcion")
};

let user = null;
let archivosSeleccionados = [];
let imagenesURL = [];
let urlsExternas = []; // Mantener URLs externas por separado

// Función para mostrar mensajes
function showMsg(text, isError = false) {
  msg.style.display = "block";
  msg.innerText = text;
  if (isError) {
    msg.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
    msg.style.color = "white";
  } else {
    msg.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    msg.style.color = "white";
  }
  setTimeout(() => msg.style.display = "none", 4000);
}

// Obtener usuario del localStorage
function setUserFromStorage() {
  const raw = localStorage.getItem("user");
  if (raw) {
    user = JSON.parse(raw);
    // El header ahora se actualiza automáticamente con header-utils.js
    // usuarioInfo.innerText = `👤 ${user.correo}`;
    btnSalir.style.display = "inline-block";
  } else {
    // El header ahora se actualiza automáticamente con header-utils.js
    // usuarioInfo.innerText = "👤 No autenticado";
    formulario.style.display = "none";
    document.querySelector(".content-wrapper").innerHTML = `
      <div class="container">
        <div class="card" style="text-align: center; padding: 3rem 1.5rem; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1)); border: 2px solid var(--error-color);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔐</div>
          <h2 style="color: var(--text-primary); margin-bottom: 1rem; font-weight: 700;">Acceso Restringido</h2>
          <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 1.1rem;">Debes iniciar sesión para agregar productos a la plataforma sostenible.</p>
          <a href="index.html" class="btn btn-primary" style="padding: 0.875rem 2rem; font-size: 1.1rem;">
            🔑 Iniciar Sesión
          </a>
        </div>
      </div>
    `;
  }
}

// Manejar cierre de sesión
btnSalir.addEventListener("click", () => {
  localStorage.removeItem("user");
  user = null;
  window.location.href = "index.html";
});

// Manejar selección de imágenes
inputImagenes.addEventListener("change", (e) => {
  archivosSeleccionados = Array.from(e.target.files);
  
  if (archivosSeleccionados.length > 5) {
    showMsg("⚠️ Máximo 5 imágenes permitidas", true);
    archivosSeleccionados = archivosSeleccionados.slice(0, 5);
    inputImagenes.value = "";
  }

  // Validar formato y tamaño
  const formatosValidos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxSize = 20 * 1024 * 1024; // 20 MB
  
  const archivosValidos = archivosSeleccionados.filter((file) => {
    if (!formatosValidos.includes(file.type)) {
      showMsg(`⚠️ ${file.name}: Formato inválido. Solo JPG, PNG, WebP y GIF`, true);
      return false;
    }
    if (file.size > maxSize) {
      showMsg(`⚠️ ${file.name}: Tamaño máximo 20MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`, true);
      return false;
    }
    return true;
  });

  archivosSeleccionados = archivosValidos;

  // Crear previsualizaciones usando URL.createObjectURL
  if (archivosSeleccionados.length > 0) {
    imagenesURL = archivosSeleccionados.map(file => URL.createObjectURL(file));
    actualizarPreview();
    showMsg("✅ " + archivosSeleccionados.length + " imagen(es) lista(s) para subir");
  }
});

// Eliminar imagen local
function eliminarImagenLocal(index) {
  // Liberar el objeto URL
  if (imagenesURL[index]) {
    URL.revokeObjectURL(imagenesURL[index]);
  }
  
  imagenesURL.splice(index, 1);
  archivosSeleccionados.splice(index, 1);
  
  // Actualizar preview
  if (imagenesURL.length === 0) {
    imagePreview.innerHTML = "";
    inputImagenes.value = "";
  } else {
    imagePreview.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--secondary-color); margin-bottom: 15px;'><strong>📸 Imágenes a subir:</strong></p>";
    imagenesURL.forEach((url, idx) => {
      const div = document.createElement("div");
      div.className = "preview-item";
      div.innerHTML = `
        <img src="${url}" alt="Preview ${idx}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
        <button type="button" onclick="eliminarImagenLocal(${idx})" style="position: absolute; top: 5px; right: 5px; padding: 4px 8px; font-size: 12px; width: auto; height: auto; background: rgba(239, 68, 68, 0.9); cursor: pointer;">✕</button>
      `;
      div.style.position = "relative";
      imagePreview.appendChild(div);
    });
  }
}

// Eliminar URL externa
function eliminarUrlExterna(index) {
  urlsExternas.splice(index, 1);
  // Recargar preview
  actualizarPreview();
}

// Manejar carga de imagen por URL
if (btnAgregarUrl) {
  btnAgregarUrl.addEventListener("click", () => {
    const url = inputUrlImagen.value.trim();
    
    if (!url) {
      showMsg("⚠️ Ingresa una URL válida", true);
      return;
    }
    
    // Validar que sea una URL
    try {
      new URL(url);
    } catch {
      showMsg("⚠️ La URL no es válida", true);
      return;
    }
    
    // Agregar a URLs externas
    urlsExternas.push(url);
    inputUrlImagen.value = "";
    actualizarPreview();
    showMsg("✅ Imagen agregada desde URL");
  });
}

// Actualizar preview de todas las imágenes
function actualizarPreview() {
  const totalImagenes = imagenesURL.length + urlsExternas.length;
  
  if (totalImagenes === 0) {
    imagePreview.innerHTML = "";
    return;
  }
  
  imagePreview.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--secondary-color); margin-bottom: 15px;'><strong>📸 Imágenes a subir:</strong></p>";
  
  // Mostrar imágenes de archivos
  imagenesURL.forEach((url, idx) => {
    const div = document.createElement("div");
    div.className = "preview-item";
    div.innerHTML = `
      <img src="${url}" alt="Preview ${idx}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
      <button type="button" onclick="eliminarImagenLocal(${idx})" style="position: absolute; top: 5px; right: 5px; padding: 4px 8px; font-size: 12px; width: auto; height: auto; background: rgba(239, 68, 68, 0.9); cursor: pointer;">✕</button>
    `;
    div.style.position = "relative";
    imagePreview.appendChild(div);
  });
  
  // Mostrar URLs externas
  urlsExternas.forEach((url, idx) => {
    const div = document.createElement("div");
    div.className = "preview-item";
    div.innerHTML = `
      <img src="${url}" alt="URL ${idx}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
      <button type="button" onclick="eliminarUrlExterna(${idx})" style="position: absolute; top: 5px; right: 5px; padding: 4px 8px; font-size: 12px; width: auto; height: auto; background: rgba(239, 68, 68, 0.9); cursor: pointer;">✕</button>
    `;
    div.style.position = "relative";
    imagePreview.appendChild(div);
  });
}

// Manejar envío del formulario
formulario.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!user) {
    showMsg("❌ Debes iniciar sesión primero", true);
    return;
  }

  const nombre = fields.nombre.value.trim();
  const categoria = fields.categoria.value.trim();
  const precio = parseFloat(fields.precio.value) || 0;
  const stock = parseInt(fields.stock.value) || 0;
  const descripcion = fields.descripcion.value.trim();

  if (!nombre || !categoria) {
    showMsg("⚠️ Nombre y categoría son obligatorios", true);
    return;
  }

  if (precio <= 0) {
    showMsg("⚠️ El precio debe ser mayor a 0", true);
    return;
  }

  if (stock < 0) {
    showMsg("⚠️ El stock no puede ser negativo", true);
    return;
  }

  // Mostrar feedback de guardado
  showMsg("💾 Guardando producto...");
  formulario.style.opacity = "0.5";
  formulario.style.pointerEvents = "none";

  try {
    // Usar FormData para enviar archivos
    const formData = new FormData();
    
    // Agregar campos de texto
    formData.append("nombre", nombre);
    formData.append("categoria", categoria);
    formData.append("precio", precio);
    formData.append("stock", stock);
    formData.append("descripcion", descripcion);

    // Agregar archivos subidos únicamente
    archivosSeleccionados.forEach((file) => {
      formData.append("imagenes", file);
    });

    // Agregar URLs externas como campos separados del FormData
    // Esto es más seguro que enviar JSON en FormData
    urlsExternas.forEach((url, idx) => {
      formData.append(`externalImage${idx}`, url);
    });
    
    // También enviar el contador de URLs para que el backend sepa cuántas hay
    if (urlsExternas.length > 0) {
      formData.append("externalImagesCount", urlsExternas.length);
    }

    const res = await fetch(API_PRODUCTS, {
      method: "POST",
      headers: {
        "x-user-email": user.correo
        // NO incluir Content-Type, el navegador lo configura automáticamente con multipart/form-data
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      showMsg("✅ Producto agregado exitosamente");
      formulario.reset();
      imagePreview.innerHTML = "";
      archivosSeleccionados = [];
      imagenesURL = [];
      urlsExternas = [];
      
      setTimeout(() => {
        window.location.href = "productos.html";
      }, 2000);
    } else {
      showMsg("❌ " + (data.message || data.error || "Error al agregar producto"), true);
      formulario.style.opacity = "1";
      formulario.style.pointerEvents = "auto";
    }
  } catch (error) {
    showMsg("❌ Error de conexión - Verifica que el servidor esté ejecutándose", true);
    console.error(error);
    formulario.style.opacity = "1";
    formulario.style.pointerEvents = "auto";
  }
});

// Inicializar
setUserFromStorage();
