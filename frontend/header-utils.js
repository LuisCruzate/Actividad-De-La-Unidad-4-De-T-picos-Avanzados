// Utilidad compartida para actualizar el header con usuario en todas las páginas

function actualizarHeaderUsuario() {
  const user = localStorage.getItem("user");
  const usuarioInfo = document.getElementById("usuarioInfo");
  
  if (!usuarioInfo) return; // Si no existe el elemento, salir
  
  // Limpiar contenido anterior
  usuarioInfo.innerHTML = '';
  
  if (user) {
    const userData = JSON.parse(user);
    
    // Crear contenedor del usuario con foto y nombre
    const userContainer = document.createElement('div');
    userContainer.style.display = 'flex';
    userContainer.style.alignItems = 'center';
    userContainer.style.gap = '0.5rem';
    userContainer.style.cursor = 'pointer';
    userContainer.style.transition = 'all 0.2s ease';
    
    // Avatar pequeño
    const avatarSmall = document.createElement('div');
    avatarSmall.style.width = '32px';
    avatarSmall.style.height = '32px';
    avatarSmall.style.borderRadius = '50%';
    avatarSmall.style.background = 'var(--primary-color)';
    avatarSmall.style.display = 'flex';
    avatarSmall.style.alignItems = 'center';
    avatarSmall.style.justifyContent = 'center';
    avatarSmall.style.fontSize = '1.25rem';
    avatarSmall.style.color = 'white';
    avatarSmall.style.overflow = 'hidden';
    avatarSmall.style.flexShrink = 0;
    
    if (userData.avatar) {
      const img = document.createElement('img');
      img.src = resolveUrl(userData.avatar);
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      avatarSmall.appendChild(img);
    } else {
      avatarSmall.innerHTML = '🌱';
    }
    
    // Nombre del usuario
    const nameSpan = document.createElement('span');
    nameSpan.style.fontWeight = '500';
    nameSpan.style.color = 'var(--text-color)';
    nameSpan.style.fontSize = '0.875rem';
    nameSpan.style.maxWidth = '150px';
    nameSpan.style.overflow = 'hidden';
    nameSpan.style.textOverflow = 'ellipsis';
    nameSpan.style.whiteSpace = 'nowrap';
    nameSpan.innerText = userData.nombre || userData.correo;
    
    userContainer.appendChild(avatarSmall);
    userContainer.appendChild(nameSpan);
    
    // Tooltip de descripción
    const tooltip = document.createElement('div');
    tooltip.className = 'user-tooltip';
    tooltip.innerHTML = `
      <div class="user-tooltip-title">Sobre mí</div>
      <div class="user-tooltip-text">${userData.descripcion ? userData.descripcion : 'No hay descripción disponible.'}</div>
    `;
    usuarioInfo.appendChild(tooltip);

    // Agregar hover effect
    userContainer.addEventListener('mouseenter', () => {
      userContainer.style.opacity = '0.8';
    });
    userContainer.addEventListener('mouseleave', () => {
      userContainer.style.opacity = '1';
    });

    userContainer.addEventListener('click', () => {
      tooltip.classList.toggle('visible');
    });

    if (!usuarioInfo.dataset.tooltipListenerAdded) {
      document.addEventListener('click', (event) => {
        const tooltipElement = usuarioInfo.querySelector('.user-tooltip');
        if (tooltipElement && !usuarioInfo.contains(event.target)) {
          tooltipElement.classList.remove('visible');
        }
      });
      usuarioInfo.dataset.tooltipListenerAdded = 'true';
    }

    usuarioInfo.appendChild(userContainer);
  } else {
    usuarioInfo.innerHTML = '🌱 Visitante';
  }
}

function resolveUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) {
    if (window.location.origin && window.location.origin !== 'null') {
      return window.location.origin + url;
    }
    return 'http://localhost:5000' + url;
  }
  return url;
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', actualizarHeaderUsuario);
