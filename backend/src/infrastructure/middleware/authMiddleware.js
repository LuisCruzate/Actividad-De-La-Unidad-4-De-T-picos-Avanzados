import jwt from "jsonwebtoken";

/**
 * Middleware de autenticación con JWT
 * Verifica que el token sea válido y lo decodifica
 */
export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        message: "Token requerido. Acceso denegado." 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "tu_clave_secreta_segura");
    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        message: "Token expirado. Por favor inicia sesión nuevamente." 
      });
    }
    res.status(403).json({ 
      message: "Token inválido. Acceso denegado." 
    });
  }
};

/**
 * Middleware para verificar que el usuario puede acceder a su propio perfil
 */
export const ownershipMiddleware = (req, res, next) => {
  const userId = req.params.id || req.body.userId;
  
  if (req.userId !== userId) {
    return res.status(403).json({ 
      message: "No tienes permisos para acceder a este recurso." 
    });
  }
  
  next();
};

/**
 * Middleware para roles (RBAC)
 */
export const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    const userRole = req.user?.role || "user";
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "Acceso denegado. Rol insuficiente." 
      });
    }
    
    next();
  };
};
