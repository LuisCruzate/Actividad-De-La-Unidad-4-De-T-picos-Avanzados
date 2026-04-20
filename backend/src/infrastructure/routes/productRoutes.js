import express from "express";
import { listarProductos, listarPorCategoria, obtenerProductoPorId, crearProducto, actualizarProducto, eliminarProducto } from "../../application/productService.js";
import { upload } from "../multerConfig.js";

console.log("🚨🚨🚨 PRODUCTROUTES.JS CARGADO - NUEVA VERSIÓN 🚨🚨🚨");

const router = express.Router();

// GET /api/products/debug/form-test -> endpoint para debuggear FormData
router.post("/debug/form-test", upload.array('imagenes', 5), async (req, res) => {
  console.log("\n🧪 [DEBUG FORMDATA] Petición recibida");
  console.log("   Headers:", req.headers);
  console.log("   Files:", req.files?.length || 0, req.files?.map(f => f.filename) || []);
  console.log("   Body completo:", JSON.stringify(req.body, null, 2));
  console.log("   Body keys:", Object.keys(req.body));
  
  // Extraer URLs externas
  const externalImagesCount = parseInt(req.body.externalImagesCount) || 0;
  console.log("   External images count:", externalImagesCount);
  
  const externalUrls = [];
  for (let i = 0; i < externalImagesCount; i++) {
    const fieldName = `externalImage${i}`;
    if (req.body[fieldName]) {
      externalUrls.push(req.body[fieldName]);
      console.log(`   [${i}]:`, req.body[fieldName]);
    }
  }
  
  res.json({
    message: "Debug completado",
    filesCount: req.files?.length || 0,
    bodyKeys: Object.keys(req.body),
    externalImagesCount,
    externalUrls
  });
});

// GET /api/products/debug/all -> mostrar todos los productos con detalles
router.get("/debug/all", async (req, res) => {
  try {
    const productos = await listarProductos();
    console.log("🧪 [DEBUG] Productos en BD:", JSON.stringify(productos, null, 2));
    res.json({
      total: productos.length,
      productos: productos.map(p => ({
        _id: p._id,
        nombre: p.nombre,
        imagenes: p.imagenes,
        imagenesCount: p.imagenes ? p.imagenes.length : 0,
        imagenesTypes: p.imagenes ? p.imagenes.map(img => ({
          url: img,
          esLocalFile: img.startsWith('/'),
          esExterna: img.startsWith('http')
        })) : []
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products  -> listar todos
router.get("/", async (req, res) => {
  try {
    const productos = await listarProductos();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// GET /api/products/category/:categoria
router.get("/category/:categoria", async (req, res) => {
  try {
    const cat = req.params.categoria;
    const productos = await listarPorCategoria(cat);
    res.json(productos);
  } catch (err) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// GET /api/products/:id  -> obtener un producto por ID
router.get("/:id", async (req, res) => {
  try {
    const producto = await obtenerProductoPorId(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(producto);
  } catch (err) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// POST /api/products  -> crear (requiere header x-user-email)
router.post("/", upload.array('imagenes', 5), async (req, res) => {
  try {
    const userEmail = req.headers["x-user-email"];
    if (!userEmail) return res.status(401).json({ message: "Se requiere x-user-email en headers" });

    console.log("\n========== POST PRODUCTO ==========");
    console.log("📨 Headers recibidos:", req.headers);
    console.log("📨 Files.length:", req.files?.length || 0);
    console.log("📨 req.body COMPLETO:", JSON.stringify(req.body, null, 2));
    console.log("📨 req.body keys:", Object.keys(req.body || {}));
    console.log("========== FIN DEBUG ==========\n");

    const data = {
      nombre: req.body.nombre,
      categoria: req.body.categoria,
      descripcion: req.body.descripcion,
      precio: req.body.precio,
      stock: req.body.stock,
      creadoPor: userEmail,
      imagenes: []
    };

    // Procesar archivos subidos
    if (req.files && req.files.length > 0) {
      const archivosGuardados = req.files.map(file => `/uploads/${file.filename}`);
      data.imagenes = archivosGuardados;
      console.log("🖼️ Archivos guardados:", archivosGuardados);
    }

    // Procesar URLs de imágenes (si se envían también)
    // Las URLs vienen como campos separados: externalImage0, externalImage1, etc.
    const externalImagesCount = parseInt(req.body.externalImagesCount) || 0;
    console.log("🔍 externalImagesCount:", externalImagesCount);
    
    if (externalImagesCount > 0) {
      const externalUrls = [];
      for (let i = 0; i < externalImagesCount; i++) {
        const fieldName = `externalImage${i}`;
        const fieldValue = req.body[fieldName];
        console.log(`   [${i}] ${fieldName}:`, fieldValue ? "ENCONTRADO" : "NO ENCONTRADO");
        if (fieldValue) {
          externalUrls.push(fieldValue);
          console.log(`      Valor: ${fieldValue.substring(0, 50)}...`);
        }
      }
      if (externalUrls.length > 0) {
        console.log("🖼️ URLs externas procesadas:", externalUrls);
        data.imagenes = [...data.imagenes, ...externalUrls];
      }
    }

    // Fallback: si aún hay imagenesUrl (old format), procesarla también
    if (req.body.imagenesUrl) {
      try {
        let urls = req.body.imagenesUrl;
        // Si es un string JSON, parsear
        if (typeof urls === 'string') {
          urls = JSON.parse(urls);
        }
        if (Array.isArray(urls) && urls.length > 0) {
          console.log("📸 [POST PRODUCTO] URLs externas recibidas (old format):", urls);
          data.imagenes = [...data.imagenes, ...urls];
        }
      } catch (e) {
        console.error("❌ Error parsing imagenesUrl:", e.message);
      }
    }

    console.log("📸 [POST PRODUCTO] Imágenes finales a guardar:", data.imagenes);

    const producto = await crearProducto(data);
    console.log("✅ [POST PRODUCTO] Producto guardado:", {
      _id: producto._id,
      nombre: producto.nombre,
      imagenes: producto.imagenes,
      imagenesCount: producto.imagenes.length
    });
    res.status(201).json(producto);
  } catch (err) {
    console.error("❌ [POST PRODUCTO] Error:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id  -> actualizar producto (solo creador)
router.put("/:id", upload.array('imagenes', 5), async (req, res) => {
  try {
    const userEmail = req.headers["x-user-email"];
    if (!userEmail) return res.status(401).json({ message: "Se requiere x-user-email en headers" });

    console.log("🔄 [PUT PRODUCTO] ID:", req.params.id);
    console.log("🔄 [PUT PRODUCTO] Archivos recibidos:", req.files?.length || 0);
    console.log("🔄 [PUT PRODUCTO] Body imagenesUrl:", req.body.imagenesUrl);

    // Obtener producto actual para verificar permisos
    const productoActual = await obtenerProductoPorId(req.params.id);
    if (!productoActual) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Verificar que el usuario sea el creador
    if (productoActual.creadoPor !== userEmail) {
      return res.status(403).json({ message: "No tienes permiso para editar este producto" });
    }

    const datos = {
      nombre: req.body.nombre,
      categoria: req.body.categoria,
      descripcion: req.body.descripcion,
      precio: req.body.precio,
      stock: req.body.stock
    };

    let imagenesFinales = [...(productoActual.imagenes || [])];

    // Procesar nuevos archivos subidos
    if (req.files && req.files.length > 0) {
      const nuevasImagenes = req.files.map(file => `/uploads/${file.filename}`);
      console.log("🔄 [PUT PRODUCTO] Nuevos archivos guardados:", nuevasImagenes);
      imagenesFinales = [...imagenesFinales, ...nuevasImagenes];
    }

    // Procesar nuevas imágenes de URL
    // Las URLs vienen como campos separados: externalImage0, externalImage1, etc.
    const externalImagesCount = parseInt(req.body.externalImagesCount) || 0;
    if (externalImagesCount > 0) {
      const externalUrls = [];
      for (let i = 0; i < externalImagesCount; i++) {
        const fieldName = `externalImage${i}`;
        if (req.body[fieldName]) {
          externalUrls.push(req.body[fieldName]);
          console.log(`🔄 [PUT PRODUCTO] URL externa ${i}:`, req.body[fieldName]);
        }
      }
      if (externalUrls.length > 0) {
        console.log("🔄 [PUT PRODUCTO] URLs externas recibidas:", externalUrls);
        imagenesFinales = [...imagenesFinales, ...externalUrls];
      }
    }

    // Fallback: si aún hay imagenesUrl (old format), procesarla también
    if (req.body.imagenesUrl) {
      try {
        let urls = req.body.imagenesUrl;
        // Si es un string JSON, parsear
        if (typeof urls === 'string') {
          urls = JSON.parse(urls);
        }
        if (Array.isArray(urls) && urls.length > 0) {
          console.log("🔄 [PUT PRODUCTO] URLs externas recibidas (old format):", urls);
          imagenesFinales = [...imagenesFinales, ...urls];
        }
      } catch (e) {
        console.error("❌ Error parsing imagenesUrl:", e.message);
      }
    }

    console.log("🔄 [PUT PRODUCTO] Imágenes finales:", imagenesFinales);
    datos.imagenes = imagenesFinales;

    const actualizado = await actualizarProducto(req.params.id, datos);
    console.log("✅ [PUT PRODUCTO] Producto actualizado:", {
      _id: actualizado._id,
      nombre: actualizado.nombre,
      imagenes: actualizado.imagenes,
      imagenesCount: actualizado.imagenes.length
    });
    res.json(actualizado);
  } catch (err) {
    console.error("❌ [PUT PRODUCTO] Error:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id/imagenes/:index -> eliminar una imagen específica
router.delete("/:id/imagenes/:index", async (req, res) => {
  try {
    const userEmail = req.headers["x-user-email"];
    if (!userEmail) return res.status(401).json({ message: "Se requiere x-user-email en headers" });

    const producto = await obtenerProductoPorId(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Verificar que el usuario sea el creador
    if (producto.creadoPor !== userEmail) {
      return res.status(403).json({ message: "No tienes permiso para editar este producto" });
    }

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= producto.imagenes.length) {
      return res.status(400).json({ message: "Índice de imagen inválido" });
    }

    // Eliminar la imagen
    const imagenesActualizadas = producto.imagenes.filter((_, i) => i !== index);
    const actualizado = await actualizarProducto(req.params.id, { imagenes: imagenesActualizadas });
    
    res.json({ message: "Imagen eliminada", producto: actualizado });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id  -> eliminar producto (solo creador)
router.delete("/:id", async (req, res) => {
  try {
    const userEmail = req.headers["x-user-email"];
    if (!userEmail) return res.status(401).json({ message: "Se requiere x-user-email en headers" });

    // Obtener producto para verificar permisos
    const producto = await obtenerProductoPorId(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Verificar que el usuario sea el creador
    if (producto.creadoPor !== userEmail) {
      return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
    }

    const deleted = await eliminarProducto(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Eliminado" });
  } catch (err) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
