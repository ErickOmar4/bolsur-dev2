// controllers/empresaController.js
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

// Configuración de conexión específica para el módulo de empresa
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  options: `-c search_path=${process.env.DB_SCHEMA}`,
});

export const getEmpresa = async (req, res) => {
  try {
    // Recupera la configuración de la única empresa registrada (ID 1)
    const result = await pool.query("SELECT * FROM empresa LIMIT 1");
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No hay datos de empresa configurados" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener datos de la empresa" });
  }
};

export const actualizarEmpresa = async (req, res) => {
  const { nombre, telefono, direccion, correo } = req.body;

  try {
    // Actualización de los datos de contacto y nombre de la empresa
    const result = await pool.query(
      `UPDATE empresa 
       SET nombre = $1, telefono = $2, direccion = $3, correo = $4 
       WHERE id_empresa = (SELECT id_empresa FROM empresa LIMIT 1)
       RETURNING *`,
      [nombre, telefono, direccion, correo]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No se encontró la empresa para actualizar" });
    }

    res.json({ mensaje: "Datos de empresa actualizados", empresa: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar la base de datos" });
  }
};