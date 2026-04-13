import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configuración del pool de conexiones usando variables de entorno
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: `-c search_path=${process.env.DB_SCHEMA}`
});

// Evento que asegura el esquema correcto al establecer cada conexión
pool.on('connect', (client) => {
  client.query(`SET search_path TO ${process.env.DB_SCHEMA}`)
    .then(() => {
      console.log(`Conectado a PostgreSQL - Esquema configurado: ${process.env.DB_SCHEMA}`);
    })
    .catch(err => {
      console.error('Error al establecer el search_path:', err);
    });
});

export default pool;