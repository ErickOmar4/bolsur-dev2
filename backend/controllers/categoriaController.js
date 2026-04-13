import pool from '../config/db.js';

export const getCategorias = async (req, res) => {
  try {
    // Obtiene categorías activas ordenadas alfabéticamente
    const query = `
      SELECT id, nombre 
      FROM categorias 
      WHERE activo = true 
      ORDER BY nombre ASC
    `;
    const result = await pool.query(query);
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener categorías:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
};