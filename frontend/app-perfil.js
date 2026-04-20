const API_USERS = "http://localhost:5000/api/users";
const nombreHeaderLink = document.getElementById("nombreHeaderLink");
const avatarHeaderContainer = document.getElementById("avatarHeaderContainer");
const formularioPerfil = document.getElementById("formularioPerfil");
const msg = document.getElementById("msg");
const btnCancelar = document.getElementById("btnCancelar");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileDescription = document.getElementById("profileDescription");
const avatarContainerLarge = document.getElementById("avatarContainerLarge");
const btnSalir = document.getElementById("btnSalir");

const fields = {
  nombre: document.getElementById("nombre"),
  telefono: document.getElementById("telefono"),
  ciudad: document.getElementById("ciudad"),
  fechaNacimiento: document.getElementById("fechaNacimiento"),
  direccion: document.getElementById("direccion"),
  descripcion: document.getElementById("descripcion"),
  avatar: document.getElementById("avatar"),
  avatarFile: document.getElementById("avatarFile")
};

let user = null;

// Función para mostrar mensajes
function showMsg(text, isError = false) {
  msg.style.display = "block";
  msg.className = "alert " + (isError ? "error" : "success");
  msg.innerText = text;
  setTimeout(() => msg.style.display = "none", 4000);
}

// Obtener usuario del localStorage
function setUserFromStorage() {
  const raw = localStorage.getItem("user");
  if (raw) {
    user = JSON.parse(raw);
    // Mostrar nombre de usuario en formato "🌱 correo"
    const displayName = `🌱 ${user.correo}`;
    nombreHeaderLink.innerText = displayName;
    btnSalir.style.display = "inline-block";
    btnSalir.addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });
    cargarPerfilUsuario();
  } else {
    window.location.href = "index.html";
  }
}

// Actualizar avatar en la interfaz
function actualizarAvatar(avatarUrl) {
  if (avatarUrl) {
    avatarHeaderContainer.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
    avatarContainerLarge.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
  } else {
    avatarHeaderContainer.innerHTML = "🌱";
    avatarContainerLarge.innerHTML = "🌱";
  }
}

// Cargar perfil del usuario
async function cargarPerfilUsuario() {
  try {
    if (!user || !user._id) {
      throw new Error("Usuario no autenticado. Inicia sesión nuevamente.");
    }

    const response = await fetch(`${API_USERS}/profile`, {
      headers: {
        "user-id": user._id
      }
    });

    if (!response.ok) {
      let errorMsg = `Error HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch {
        errorMsg = "Servidor no responde correctamente. Verifica que el backend esté activo en puerto 5000.";
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const perfil = data.user;

    // Llenar el formulario con los datos actuales
    fields.nombre.value = perfil.nombre || "";
    fields.telefono.value = perfil.telefono || "";
    fields.ciudad.value = perfil.ciudad || "";
    fields.direccion.value = perfil.direccion || "";
    fields.descripcion.value = perfil.descripcion || "";
    fields.avatar.value = perfil.avatar || "";

    // Actualizar información en el header y perfil
    nombreHeaderLink.innerText = `🌱 ${perfil.correo}`;
    profileName.innerText = perfil.nombre || perfil.correo;
    profileEmail.innerText = perfil.correo;
    profileDescription.innerText = perfil.descripcion || "Contribuyendo al medio ambiente con compras sostenibles";

    // Formatear fecha de nacimiento si existe
    if (perfil.fechaNacimiento) {
      const fecha = new Date(perfil.fechaNacimiento);
      fields.fechaNacimiento.value = fecha.toISOString().split('T')[0];
    }

    // Actualizar avatar si existe
    actualizarAvatar(perfil.avatar);

    // Actualizar header del usuario
    if (typeof actualizarHeaderUsuario === 'function') {
      actualizarHeaderUsuario();
    }

  } catch (error) {
    console.error("Error cargando perfil:", error);
    showMsg(error.message, true);
  }
}

// Manejar selección de archivo de avatar
fields.avatarFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) {
    fields.avatar.value = "";

    const reader = new FileReader();
    reader.onload = (event) => {
      actualizarAvatar(event.target.result);
    };
    reader.readAsDataURL(file);
  }
});

// Limpiar archivo cuando se escribe en URL
fields.avatar.addEventListener("input", () => {
  if (fields.avatar.value.trim()) {
    fields.avatarFile.value = "";
    actualizarAvatar(fields.avatar.value);
  }
});

// Manejar envío del formulario
formularioPerfil.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    let avatarUrl = fields.avatar.value.trim();

    // Si hay un archivo seleccionado, subirlo primero
    if (fields.avatarFile.files[0]) {
      showMsg("Subiendo imagen...");
      const formData = new FormData();
      formData.append('avatar', fields.avatarFile.files[0]);

      const uploadResponse = await fetch(`${API_USERS}/profile/upload-avatar`, {
        method: "POST",
        headers: {
          "user-id": user._id
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        let uploadError = "Error al subir imagen";
        try {
          const errorData = await uploadResponse.json();
          uploadError = errorData.message || uploadError;
        } catch {
          uploadError = "Servidor no responde. Verifica backend en puerto 5000.";
        }
        throw new Error(uploadError);
      }

      const uploadData = await uploadResponse.json();
      avatarUrl = uploadData.avatarUrl;

      // Actualizar usuario en localStorage con la nueva URL
      user.avatar = avatarUrl;
      localStorage.setItem("user", JSON.stringify(user));
    }

    // Recopilar datos del formulario
    const datosActualizados = {
      nombre: fields.nombre.value.trim(),
      telefono: fields.telefono.value.trim(),
      ciudad: fields.ciudad.value.trim(),
      direccion: fields.direccion.value.trim(),
      descripcion: fields.descripcion.value.trim(),
      avatar: avatarUrl,
      // Enviar fecha como string ISO, no como objeto Date
      fechaNacimiento: fields.fechaNacimiento.value || undefined
    };

    // Remover campos vacíos
    Object.keys(datosActualizados).forEach(key => {
      if (datosActualizados[key] === "" || datosActualizados[key] === undefined) {
        delete datosActualizados[key];
      }
    });

    // Actualizar perfil
    const response = await fetch(`${API_USERS}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "user-id": user._id
      },
      body: JSON.stringify(datosActualizados)
    });

    if (!response.ok) {
      let errorMsg = `Error HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch {
        // Si no es JSON (HTML), mensaje claro
        errorMsg = "Backend no responde con JSON. Verifica que esté corriendo en http://localhost:5000";
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    showMsg("✅ Perfil actualizado exitosamente");

    // Actualizar usuario en localStorage
    user = { ...user, ...data.user };
    localStorage.setItem("user", JSON.stringify(user));

    // Actualizar nombre en el header y perfil
    nombreHeaderLink.innerText = `🌱 ${user.correo}`;
    profileName.innerText = user.nombre || user.correo;
    profileEmail.innerText = user.correo;
    profileDescription.innerText = user.descripcion || "Contribuyendo al medio ambiente con compras sostenibles";
    actualizarAvatar(user.avatar);
    
    // Actualizar header del usuario
    if (typeof actualizarHeaderUsuario === 'function') {
      actualizarHeaderUsuario();
    }

  } catch (error) {
    console.error("Error actualizando perfil:", error);
    showMsg("❌ Error al actualizar el perfil: " + error.message, true);
  }
});

// Manejar cancelar
btnCancelar.addEventListener("click", () => {
  // Recargar datos desde localStorage en lugar de hacer petición al backend
  if (user) {
    fields.nombre.value = user.nombre || "";
    fields.telefono.value = user.telefono || "";
    fields.ciudad.value = user.ciudad || "";
    fields.direccion.value = user.direccion || "";
    fields.descripcion.value = user.descripcion || "";
    fields.avatar.value = user.avatar || "";

    // Formatear fecha de nacimiento si existe
    if (user.fechaNacimiento) {
      const fecha = new Date(user.fechaNacimiento);
      fields.fechaNacimiento.value = fecha.toISOString().split('T')[0];
    } else {
      fields.fechaNacimiento.value = "";
    }

    // Actualizar avatar en la interfaz
    actualizarAvatar(user.avatar);
  }
  showMsg("Cambios cancelados");
});

// Manejar cierre de sesión
btnSalir.addEventListener("click", () => {
  localStorage.removeItem("user");
  user = null;
  window.location.href = "index.html";
});

// Manejar cambio de contraseña
document.getElementById('formChangePass').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgPass = document.getElementById('msgPass');
  try {
    const passVieja = document.getElementById('passVieja').value;
    const passNueva = document.getElementById('passNueva').value;
    if (passNueva.length < 6) throw new Error('Nueva contraseña debe tener al menos 6 caracteres');

    const response = await fetch(`${API_USERS}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'user-id': user._id },
      body: JSON.stringify({ contraseñaVieja: passVieja, nuevaContraseña: passNueva })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Error del servidor' }));
      throw new Error(data.message);
    }

    showMsgPass('✅ Contraseña cambiada exitosamente');
    document.getElementById('formChangePass').reset();
  } catch (err) {
    showMsgPass('❌ ' + err.message, true);
  }
});

function showMsgPass(text, isError = false) {
  const msgPass = document.getElementById('msgPass');
  msgPass.style.display = 'block';
  msgPass.innerText = text;
  msgPass.style.background = isError ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  msgPass.style.color = 'white';
  setTimeout(() => msgPass.style.display = 'none', 4000);
}

// Manejar olvidé contraseña
document.getElementById('btnForgot').addEventListener('click', async () => {
  const emailForgot = document.getElementById('emailForgot').value;
  const msgForgot = document.getElementById('msgForgot');
  if (!emailForgot) return msgForgot.innerText = 'Ingresa tu email';

  try {
    const response = await fetch(`${API_USERS}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: emailForgot })
    });

    const data = await response.json();
    if (response.ok) {
      msgForgot.innerText = data.message || 'Email enviado (ver console)';
      msgForgot.style.color = '#10b981';
    } else {
      msgForgot.innerText = data.message;
      msgForgot.style.color = '#ef4444';
    }
  } catch (err) {
    msgForgot.innerText = 'Error: ' + err.message;
    msgForgot.style.color = '#ef4444';
  }
});

// Fix fetch para evitar JSON parse error en profile/update
const originalFetchPerfil = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `HTTP ${response.status}: ${await response.text().substring(0, 100)}` };
    }
    throw new Error(errorData.message || 'Error desconocido');
  }
  return response.json();
};

// Reemplazar fetch en cargarPerfilUsuario y update
// (aplicado manual en funciones existentes, o wrap si necesario)

// Inicializar cuando se carga la página
document.addEventListener("DOMContentLoaded", setUserFromStorage);
