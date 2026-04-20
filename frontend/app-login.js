const API = "http://localhost:5000/api/users";

const loginCorreo = document.getElementById("loginCorreo");
const loginPass = document.getElementById("loginPass");
const btnLogin = document.getElementById("btnLogin");

const msg = document.getElementById("msg");
const toProductos = document.getElementById("toProductos");

// mostrar mensaje
function showMsg(text) {
  msg.style.display = "block";
  msg.innerText = text;
  setTimeout(() => msg.style.display = "none", 4000);
}

// LOGIN
btnLogin.addEventListener("click", async () => {
  const correo = loginCorreo.value.trim();
  const contraseña = loginPass.value.trim();
  if (!correo || !contraseña) return showMsg("⚠️ Completa correo y contraseña");

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, contraseña })
  });
  const data = await res.json();
  if (!res.ok) {
    showMsg("❌ " + (data.message || "Error en login"));
  } else {
    localStorage.setItem("user", JSON.stringify(data.user));
    showMsg("✅ Iniciando sesión...");
    setTimeout(() => {
      window.location.href = "productos.html";
    }, 1000);
  }
});

// Si el usuario ya está logeado
if (localStorage.getItem("user")) {
  toProductos.href = "productos.html";
}
