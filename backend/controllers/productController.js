// controllers/productController.js
import pool from '../config/db.js';
import { revisarStockProducto } from '../services/cronService.js';

// Obtiene productos activos que tengan existencia en stock
export const getProductosDisponibles = async (req, res) => {
  try {
    const query = `
      SELECT id, nombre, descripcion, precio_venta, stock_actual, stock_minimo, alto_cm, ancho_cm 
      FROM productos 
      WHERE activo = true AND stock_actual > 0 
      ORDER BY nombre ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error en DB:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
};

// Obtiene el listado completo de productos para el módulo de inventario
export const getInventarioCompleto = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, 
        p.id AS sku,
        p.nombre AS "name", 
        p.descripcion AS description,
        c.nombre AS category, 
        p.precio_venta AS "unitPrice", 
        p.stock_actual AS stock, 
        p.stock_minimo AS "minStock",
        p.alto_cm AS height,
        p.ancho_cm AS width
      FROM bolsur_dbnormal.productos p
      LEFT JOIN bolsur_dbnormal.categorias c ON p.categoria_id = c.id
      WHERE p.activo = true
      ORDER BY p.nombre ASC
    `;
    const result = await pool.query(query);

    const products = result.rows.map(row => ({
      ...row,
      dimensions: { height: row.height, width: row.width, unit: 'cm' }
    }));

    res.json(products);
  } catch (err) {
    console.error("Error al obtener inventario:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
};

// Realiza un borrado lógico del producto
export const desactivarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE bolsur_dbnormal.productos SET activo = false, updated_at = NOW() WHERE id = $1 RETURNING nombre",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json({ success: true, message: `Producto "${result.rows[0].nombre}" desactivado correctamente` });
  } catch (error) {
    console.error("Error al desactivar producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Registra un nuevo producto validando duplicados por nombre
export const crearProducto = async (req, res) => {
  const { name, category_id, unitPrice, stock, minStock, height, width, description } = req.body;

  try {
    const existe = await pool.query(
      "SELECT id FROM bolsur_dbnormal.productos WHERE UPPER(nombre) = UPPER($1) AND activo = true",
      [name]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: `El producto "${name}" ya existe en el inventario.` });
    }

    const query = `
      INSERT INTO bolsur_dbnormal.productos 
      (nombre, categoria_id, precio_venta, stock_actual, stock_minimo, alto_cm, ancho_cm, descripcion, activo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
      RETURNING id, nombre AS name;
    `;
    const values = [name, category_id, unitPrice, stock, minStock, height, width, description];
    const result = await pool.query(query, values);

    const nuevoId = result.rows[0].id;

    // FIX: revisar stock inmediatamente al crear (sin esperar el cron)
    // Se hace async sin await para no bloquear la respuesta HTTP
    revisarStockProducto(nuevoId).catch(console.error);

    res.status(201).json({
      success: true,
      message: "Producto registrado con éxito",
      producto: result.rows[0]
    });

  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualiza los datos de un producto existente
export const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { name, unitPrice, stock, minStock, height, width, description } = req.body;

  try {
    const existe = await pool.query(
      "SELECT id FROM bolsur_dbnormal.productos WHERE UPPER(nombre) = UPPER($1) AND id <> $2 AND activo = true",
      [name, id]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: "Ya existe otro producto con este nombre." });
    }

    const query = `
      UPDATE bolsur_dbnormal.productos 
      SET nombre = $1, precio_venta = $2, stock_actual = $3, stock_minimo = $4, 
          alto_cm = $5, ancho_cm = $6, descripcion = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `;
    const result = await pool.query(query, [name, unitPrice, stock, minStock, height, width, description, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // FIX: revisar stock inmediatamente al actualizar (sin esperar el cron)
    revisarStockProducto(parseInt(id)).catch(console.error);

    res.json({ success: true, message: "Actualizado correctamente" });

  } catch (error) {
    console.error("Error al actualizar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};