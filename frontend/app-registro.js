const API = "http://localhost:5000/api/users";

const regNombre = document.getElementById("regNombre");
const regCorreo = document.getElementById("regCorreo");
const regPass = document.getElementById("regPass");
const btnRegistro = document.getElementById("btnRegistro");

const msg = document.getElementById("msg");

// mostrar mensaje
function showMsg(text) {
  msg.style.display = "block";
  msg.innerText = text;
  setTimeout(() => msg.style.display = "none", 4000);
}

// REGISTRO
btnRegistro.addEventListener("click", async () => {
  const nombre = regNombre.value.trim();
  const correo = regCorreo.value.trim();
  const contraseña = regPass.value.trim();
  if (!correo || !contraseña) return showMsg("⚠️ Correo y contraseña son requeridos");

  const res = await fetch(API + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, correo, contraseña })
  });
  const data = await res.json();
  if (!res.ok) {
    showMsg("❌ " + (data.message || "Error en registro"));
  } else {
    showMsg("✅ Usuario registrado. Redirigiendo a iniciar sesión...");
    regNombre.value = regCorreo.value = regPass.value = "";
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  }
});