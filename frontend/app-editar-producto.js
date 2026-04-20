const API_PRODUCTS = "http://localhost:5000/api/products";
const usuarioInfo = document.getElementById("usuarioInfo");
const btnSalir = document.getElementById("btnSalir");
const formulario = document.getElementById("formularioProducto");
const msg = document.getElementById("msg");
const inputImagenes = document.getElementById("imagenes");
const imagePreview = document.getElementById("imagePreview");
const btnEliminarProducto = document.getElementById("btnEliminarProducto");
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
let productoId = null;
let archivosSeleccionados = [];
let imagenesURL = [];
let urlsExternas = []; // Mantener URLs externas por separado

// Función para obtener parámetro de URL
function obtenerParametroURL(parametro) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(parametro);
}

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
          <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 1.1rem;">Debes iniciar sesión para editar productos en la plataforma sostenible.</p>
          <a href="index.html" class="btn btn-primary" style="padding: 0.875rem 2rem; font-size: 1.1rem;">
            🔑 Iniciar Sesión
          </a>
        </div>
      </div>
    `;
  }
}

// Cargar datos del producto
async function cargarProducto() {
  productoId = obtenerParametroURL("id");
  
  if (!productoId) {
    showMsg("❌ No se especificó un producto", true);
    return;
  }

  // Mostrar estado de carga
  imagePreview.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--secondary-color);'>⏳ Cargando datos del producto...</p>";
  formulario.style.opacity = "0.5";
  formulario.style.pointerEvents = "none";

  try {
    console.log("Intentando cargar producto:", productoId);
    const res = await fetch(`${API_PRODUCTS}/${productoId}`);
    
    console.log("Respuesta del servidor:", res.status);
    
    if (!res.ok) {
      if (res.status === 404) {
        showMsg("❌ Producto no encontrado (error 404)", true);
      } else {
        showMsg(`❌ Error ${res.status}: No se pudo cargar el producto`, true);
      }
      // NO redirigir automáticamente - dejar que el usuario vea el error
      formulario.style.opacity = "1";
      formulario.style.pointerEvents = "auto";
      imagePreview.innerHTML = "";
      return;
    }

    const producto = await res.json();
    console.log("Producto recibido:", producto);

    if (producto && producto._id) {
      // Verificar si el usuario es el creador
      if (producto.creadoPor !== user.correo) {
        showMsg("❌ Solo el creador puede editar este producto", true);
        formulario.style.display = "none";
        document.querySelector(".form-container").innerHTML = `
          <div class="card" style="text-align: center; padding: 40px;">
            <h3>🔒 Acceso Denegado</h3>
            <p>Solo el creador del producto puede editarlo.</p>
            <button onclick="window.location.href='productos.html'" style="margin-top: 20px;">Volver a productos</button>
          </div>
        `;
        return;
      }

      // Cargar todos los datos del producto
      fields.nombre.value = producto.nombre || "";
      fields.categoria.value = producto.categoria || "";
      fields.precio.value = producto.precio || "";
      fields.stock.value = producto.stock || "";
      fields.descripcion.value = producto.descripcion || "";

      // Mostrar imágenes actuales si existen
      if (producto.imagenes && producto.imagenes.length > 0) {
        imagePreview.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--secondary-color); margin-bottom: 15px;'><strong>📸 Imágenes actuales del producto:</strong></p>";
        producto.imagenes.forEach((img, index) => {
          const div = document.createElement("div");
          div.className = "preview-item";
          div.innerHTML = `
            <img src="${img}" alt="Imagen ${index}" style="cursor: pointer; width: 100%; height: 100px; object-fit: cover; border-radius: 4px;" title="Click para abrir en nueva pestaña">
            <button type="button" onclick="eliminarImagenActual(${index})" style="position: absolute; top: 5px; right: 5px; padding: 4px 8px; font-size: 12px; width: auto; height: auto; background: rgba(239, 68, 68, 0.9); cursor: pointer; border: none; color: white; border-radius: 4px;">✕</button>
          `;
          div.style.cursor = "pointer";
          div.style.position = "relative";
          div.onclick = () => window.open(img, '_blank');
          imagePreview.appendChild(div);
        });
      } else {
        imagePreview.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--secondary-color);'>❌ No hay imágenes actuales</p>";
      }
      
      // Rehabilitar formulario
      formulario.style.opacity = "1";
      formulario.style.pointerEvents = "auto";
      showMsg("✅ Producto cargado exitosamente");
    } else {
      showMsg("❌ Los datos del producto no son válidos", true);
      formulario.style.opacity = "1";
      formulario.style.pointerEvents = "auto";
    }
  } catch (error) {
    console.error("Error de conexión detallado:", error);
    showMsg("❌ Error de conexión - Verifica que el servidor esté ejecutándose en http://localhost:5000", true);
    formulario.style.opacity = "1";
    formulario.style.pointerEvents = "auto";
  }
}

// Manejar cierre de sesión
btnSalir.addEventListener("click", () => {
  localStorage.removeItem("user");
  user = null;
  window.location.href = "index.html";
});

let productoActualImagenes = []; // Para rastrear imágenes actuales

// Manejar selección de nuevas imágenes
inputImagenes.addEventListener("change", (e) => {
  archivosSeleccionados = Array.from(e.target.files);
  
  if (archivosSeleccionados.length > 5) {
    showMsg("⚠️ Máximo 5 imágenes nuevas permitidas", true);
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

  // Crear previsualizaciones con object URLs
  if (archivosSeleccionados.length > 0) {
    imagenesURL = archivosSeleccionados.map(file => URL.createObjectURL(file));
    
    // Mostrar previews
    const previasText = document.querySelector('[data-nuevas-imagenes]');
    if (previasText) {
      previasText.remove();
    }
    
    const titulo = document.createElement("p");
    titulo.setAttribute("data-nuevas-imagenes", "true");
    titulo.style.gridColumn = "1/-1";
    titulo.style.textAlign = "center";
    titulo.style.color = "var(--secondary-color)";
    titulo.style.marginBottom = "15px";
    titulo.textContent = "📸 Nuevas imágenes a agregar:";
    
    // Encontrar dónde insertar (después de las imágenes actuales)
    const primeraPregunta = Array.from(imagePreview.children).find(el => el.textContent.includes("Nuevas"));
    if (primeraPregunta) {
      imagePreview.insertBefore(titulo, primeraPregunta);
    } else {
      imagePreview.appendChild(titulo);
    }
    
    imagenesURL.forEach((url, idx) => {
      const div = document.createElement("div");
      div.className = "preview-item";
      div.innerHTML = `
        <img src="${url}" alt="Nueva imagen ${idx}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
        <button type="button" onclick="eliminarImagenLocal(${idx})" style="position: absolute; top: 5px; right: 5px; padding: 4px 8px; font-size: 12px; width: auto; height: auto; background: rgba(239, 68, 68, 0.9); cursor: pointer; border: none; color: white; border-radius: 4px;">✕</button>
      `;
      div.style.position = "relative";
      imagePreview.appendChild(div);
    });
    
    showMsg("✅ " + archivosSeleccionados.length + " imagen(es) nueva(s) lista(s) para subir");
  }
});

// Eliminar imagen local (nueva)
function eliminarImagenLocal(index) {
  // Liberar el objeto URL si existe
  if (imagenesURL[index] && imagenesURL[index].startsWith('blob:')) {
    URL.revokeObjectURL(imagenesURL[index]);
  }
  
  imagenesURL.splice(index, 1);
  archivosSeleccionados.splice(index, 1);
  
  // Recargar preview
  if (imagenesURL.length === 0) {
    const titulo = document.querySelector('[data-nuevas-imagenes]');
    if (titulo) titulo.remove();
    inputImagenes.value = "";
  } else {
    const titulo = document.querySelector('[data-nuevas-imagenes]');
    if (titulo && titulo.nextElementSibling) {
      let next = titulo.nextElementSibling;
      while (next && !next.textContent.includes("Nuevas")) {
        const temp = next.nextElementSibling;
        next.remove();
        next = temp;
      }
    }
    
    imagenesURL.forEach((base64, idx) => {
      const div = document.createElement("div");
      div.className = "preview-item";
      div.innerHTML = `
        <img src="${base64}" alt="Nueva imagen ${idx}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
        <button type="button" onclick="eliminarImagenLocal(${idx})" style="position: absolute; top: 5px; right: 5px; padding: 4px 8px; font-size: 12px; width: auto; height: auto; background: rgba(239, 68, 68, 0.9); cursor: pointer; border: none; color: white; border-radius: 4px;">✕</button>
      `;
      div.style.position = "relative";
      imagePreview.appendChild(div);
    });
  }
}

// Eliminar imagen actual de la BD
async function eliminarImagenActual(index) {
  if (!confirm("¿Estás seguro de que deseas eliminar esta imagen?")) {
    return;
  }

  try {
    const res = await fetch(`${API_PRODUCTS}/${productoId}/imagenes/${index}`, {
      method: "DELETE",
      headers: {
        "x-user-email": user.correo
      }
    });

    const data = await res.json();

    if (res.ok) {
      showMsg("✅ Imagen eliminada");
      // Recargar producto para actualizar imagenes
      cargarProducto();
    } else {
      showMsg("❌ " + (data.message || "Error al eliminar imagen"), true);
    }
  } catch (error) {
    showMsg("❌ Error de conexión", true);
    console.error(error);
  }
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
    
    // Agregar a lista de URLs
    imagenesURL.push(url);
    
    // Mostrar preview
    if (imagePreview.innerHTML.includes("Nuevas imágenes")) {
      // Ya hay una sección de nuevas imágenes
      const div = document.createElement("div");
      div.className = "preview-item";
      div.innerHTML = `
        <img src="${url}" alt="Imagen URL" style="cursor: pointer; width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
        <button type="button" onclick="eliminarImagenLocal(${imagenesURL.length - 1})" style="position: absolute; top: 5px; right: 5px; padding: 4px 8px; font-size: 12px; width: auto; height: auto; background: rgba(239, 68, 68, 0.9); cursor: pointer;">✕</button>
      `;
      div.style.cursor = "pointer";
      imagePreview.appendChild(div);
    } else {
      // Crear nueva sección para nuevas imágenes
      imagePreview.appendChild(document.createElement("hr"));
      const titulo = document.createElement("p");
      titulo.style.gridColumn = "1/-1";
      titulo.textContent = "📸 Nuevas imágenes a agregar:";
      titulo.style.textAlign = "center";
      titulo.style.color = "var(--secondary-color)";
      titulo.style.marginBottom = "15px";
      imagePreview.appendChild(titulo);
      
      const div = document.createElement("div");
      div.className = "preview-item";
      div.innerHTML = `
        <img src="${url}" alt="Imagen URL" style="cursor: pointer; width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
        <button type="button" onclick="eliminarImagenLocal(${imagenesURL.length - 1})" style="position: absolute; top: 5px; right: 5px; padding: 4px 8px; font-size: 12px; width: auto; height: auto; background: rgba(239, 68, 68, 0.9); cursor: pointer;">✕</button>
      `;
      imagePreview.appendChild(div);
    }
    
    inputUrlImagen.value = "";
    showMsg("✅ Imagen agregada desde URL");
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
  showMsg("💾 Guardando cambios...");
  formulario.style.opacity = "0.5";
  formulario.style.pointerEvents = "none";

  try {
    // Usar FormData para enviar archivos y datos
    const formData = new FormData();
    
    // Agregar campos de texto
    formData.append("nombre", nombre);
    formData.append("categoria", categoria);
    formData.append("precio", precio);
    formData.append("stock", stock);
    formData.append("descripcion", descripcion);

    // Agregar archivos subidos (nuevos)
    archivosSeleccionados.forEach((file) => {
      formData.append("imagenes", file);
    });

    // Agregar URLs externas como campos separados del FormData
    urlsExternas.forEach((url, idx) => {
      formData.append(`externalImage${idx}`, url);
    });
    
    // También enviar el contador de URLs
    if (urlsExternas.length > 0) {
      formData.append("externalImagesCount", urlsExternas.length);
    }

    const res = await fetch(`${API_PRODUCTS}/${productoId}`, {
      method: "PUT",
      headers: {
        "x-user-email": user.correo
        // NO incluir Content-Type, el navegador lo configura automáticamente
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      showMsg("✅ Producto actualizado exitosamente");
      
      setTimeout(() => {
        window.location.href = "productos.html";
      }, 2000);
    } else {
      showMsg("❌ " + (data.message || data.error || "Error al actualizar producto"), true);
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

// Eliminar producto
btnEliminarProducto.addEventListener("click", async () => {
  if (!confirm("⚠️ ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.")) {
    return;
  }

  try {
    const res = await fetch(`${API_PRODUCTS}/${productoId}`, {
      method: "DELETE",
      headers: {
        "x-user-email": user.correo
      }
    });

    const data = await res.json();

    if (res.ok) {
      showMsg("✅ Producto eliminado exitosamente");
      
      setTimeout(() => {
        window.location.href = "productos.html";
      }, 2000);
    } else {
      showMsg("❌ " + (data.message || "Error al eliminar producto"), true);
    }
  } catch (error) {
    showMsg("❌ Error de conexión. Intenta de nuevo.", true);
    console.error(error);
  }
});

// Inicializar
setUserFromStorage();
cargarProducto();
