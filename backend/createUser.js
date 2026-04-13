import pkg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pkg;

// Configuración de la DB
const pool = new Pool({
  user: 'bolsur_user',
  host: 'localhost',
  database: 'bolsur_dbnormal',
  password: 'admin123',
  port: 5432,
  options: '-c search_path=bolsur_dbnormal'
});

async function createUser({ nombre_completo, email, password, rol_id, activo, empresa_id_empresa }) {
  try {
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre_completo, email, password_hash, rol_id, activo, empresa_id_empresa)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nombre_completo, email, rol_id, activo, empresa_id_empresa`,
      [nombre_completo, email, password_hash, rol_id, activo, empresa_id_empresa]
    );

    console.log('Usuario creado:', result.rows[0]);
  } catch (err) {
    console.error('Error creando usuario:', err);
  } finally {
    await pool.end();
  }
}

// Ejemplo de uso
createUser({
  nombre_completo: 'Tester',
  email: 'tester@bolsur.com',
  password: '123456',
  rol_id: 1,
  activo: true,
  empresa_id_empresa: 1
});