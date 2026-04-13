import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import empresaRoutes from './routes/empresa.js';
import productosRoutes from './routes/productos.js';
import ventasRoutes from './routes/ventas.js';
import usuarioRoutes from './routes/usuario.js'
import categorias from './routes/categorias.js';
import pedidosRoutes from './routes/pedidos.js';
import pagosRoutes from './routes/pagos.js';
import reporteRoutes from './routes/reportes.js';
import notificacionRoutes from './routes/notificaciones.js';
import { initCronJobs } from './services/cronService.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/empresa', empresaRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes)
app.use("/api/usuarios", usuarioRoutes);
app.use('/api/categorias', categorias);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/dashboard', dashboardRoutes);


initCronJobs();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

