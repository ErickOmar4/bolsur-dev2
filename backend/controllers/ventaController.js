// controllers/ventaController.js
import pool from '../config/db.js';
import nodemailer from 'nodemailer';

/**
 * Registra una venta, gestiona clientes y actualiza inventario
 */
export const registrarVenta = async (req, res) => {
  const { cliente_id, total, items, clientName } = req.body;
  const usuario_id = req.user.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let finalClienteId = cliente_id;

    // Gestión automática de clientes: busca existencia o crea uno nuevo
    if (!cliente_id && clientName && clientName.trim() !== "") {
      const nombreLimpio = clientName.trim();
      const checkCliente = await client.query(
        "SELECT id FROM bolsur_dbnormal.clientes WHERE UPPER(nombre_comercial) = UPPER($1) LIMIT 1",
        [nombreLimpio]
      );

      if (checkCliente.rows.length > 0) {
        finalClienteId = checkCliente.rows[0].id;
      } else {
        const nuevoCliente = await client.query(
          `INSERT INTO bolsur_dbnormal.clientes (nombre_comercial, activo, created_at, updated_at) 
            VALUES ($1, true, NOW(), NOW()) RETURNING id`,
          [nombreLimpio]
        );
        finalClienteId = nuevoCliente.rows[0].id;
      }
    } else if (!cliente_id) {
      finalClienteId = 1; 
    }

    const numero_venta = `VNT-${Date.now()}`;
    
    // Inserción de cabecera de venta
    const ventaRes = await client.query(
      `INSERT INTO bolsur_dbnormal.ventas (
        numero_venta, cliente_id, usuario_id, fecha_venta, total, created_at, updated_at
      ) VALUES ($1, $2, $3, CURRENT_DATE, $4, NOW(), NOW()) RETURNING id`,
      [numero_venta, finalClienteId, usuario_id, total]
    );

    const ventaId = ventaRes.rows[0].id;

    // Registro de artículos y actualización de existencias
    for (const item of items) {
      await client.query(
        `INSERT INTO bolsur_dbnormal.detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) 
          VALUES ($1, $2, $3, $4)`,
        [ventaId, item.productId, item.quantity, item.price] 
      );

      const stockRes = await client.query(
        `UPDATE bolsur_dbnormal.productos SET stock_actual = stock_actual - $1, updated_at = NOW()
          WHERE id = $2 AND stock_actual >= $1`,
        [item.quantity, item.productId]
      );

      if (stockRes.rowCount === 0) throw new Error(`Sin stock para ID: ${item.productId}`);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, ventaId, numero_venta });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

/**
 * Obtiene el detalle completo de una venta para visualización y ticket
 */
export const obtenerVentaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const ventaCabecera = await pool.query(
      `SELECT v.id, v.numero_venta as "saleNumber", v.fecha_venta as "date", 
              v.total as "totalAmount", c.nombre_comercial as "clientName",
              u.nombre_completo as "createdBy"
       FROM bolsur_dbnormal.ventas v
       JOIN bolsur_dbnormal.clientes c ON v.cliente_id = c.id
       JOIN bolsur_dbnormal.usuarios u ON v.usuario_id = u.id
       WHERE v.id = $1`, [id]
    );

    if (ventaCabecera.rows.length === 0) return res.status(404).json({ error: "No encontrada" });

    const ventaDetalle = await pool.query(
      `SELECT dv.id, dv.producto_id as "productId", p.nombre as "productName",
              dv.cantidad as "quantity", dv.precio_unitario as "unitPrice"
       FROM bolsur_dbnormal.detalle_ventas dv
       JOIN bolsur_dbnormal.productos p ON dv.producto_id = p.id
       WHERE dv.venta_id = $1`, [id]
    );

    const infoEmpresa = await pool.query(
      `SELECT nombre, telefono, direccion, correo FROM bolsur_dbnormal.empresa WHERE id_empresa = 1 LIMIT 1`
    );

    res.json({ ...ventaCabecera.rows[0], items: ventaDetalle.rows, empresa: infoEmpresa.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Recupera el histórico de todas las ventas realizadas
 */
export const obtenerTodasVentas = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.id, v.numero_venta AS "saleNumber", c.nombre_comercial AS "clientName", 
              v.fecha_venta AS "date", v.total AS "totalAmount",
        (SELECT json_agg(json_build_object('productName', p.nombre))
         FROM bolsur_dbnormal.detalle_ventas dv
         JOIN bolsur_dbnormal.productos p ON dv.producto_id = p.id
         WHERE dv.venta_id = v.id) as items
       FROM bolsur_dbnormal.ventas v
       JOIN bolsur_dbnormal.clientes c ON v.cliente_id = c.id
       ORDER BY v.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error historial" });
  }
};

/**
 * Envía el recibo de compra en formato HTML profesional al cliente
 */
export const enviarTicketEmail = async (req, res) => {
  const { saleId, email, subject, message } = req.body;

  try {
    const ventaRes = await pool.query(`
      SELECT v.numero_venta, v.fecha_venta, v.total, c.nombre_comercial, u.nombre_completo
      FROM bolsur_dbnormal.ventas v
      JOIN bolsur_dbnormal.clientes c ON v.cliente_id = c.id
      JOIN bolsur_dbnormal.usuarios u ON v.usuario_id = u.id
      WHERE v.id = $1`, [saleId]);
    
    const itemsRes = await pool.query(`
      SELECT p.nombre, dv.cantidad, dv.precio_unitario 
      FROM bolsur_dbnormal.detalle_ventas dv
      JOIN bolsur_dbnormal.productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = $1`, [saleId]);

    const venta = ventaRes.rows[0];
    const items = itemsRes.rows;

    // Configuración del servicio de correo saliente
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    // Generación de filas de la tabla de productos para el correo
    const filasProductos = items.map(item => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">${item.nombre} <br><span style="color: #666; font-size: 12px;">Cant: ${item.cantidad}</span></td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top;">$${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="background-color: #f4f4f4; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #1e293b; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; letter-spacing: 1px;">BOLSUR MÉXICO</h1>
            <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">Confirmación de Pedido</p>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Hola <strong>${venta.nombre_comercial}</strong>,</p>
            <p style="color: #666; line-height: 1.5;">${message}</p>
            
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <table style="width: 100%; font-size: 13px; color: #475569;">
                <tr><td style="padding-bottom: 5px;"><strong>Folio:</strong> ${venta.numero_venta}</td></tr>
                <tr><td style="padding-bottom: 5px;"><strong>Fecha:</strong> ${new Date(venta.fecha_venta).toLocaleDateString('es-MX')}</td></tr>
                <tr><td><strong>Vendedor:</strong> ${venta.nombre_completo}</td></tr>
              </table>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="color: #64748b; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #f1f5f9;">
                  <th style="text-align: left; padding: 10px 8px;">Producto</th>
                  <th style="text-align: right; padding: 10px 8px;">Total</th>
                </tr>
              </thead>
              <tbody style="font-size: 14px; color: #1e293b;">
                ${filasProductos}
              </tbody>
            </table>

            <div style="text-align: right; margin-top: 30px; padding-top: 20px; border-top: 2px solid #f1f5f9;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Total pagado</p>
              <p style="margin: 5px 0 0; font-size: 24px; color: #0f172a; font-weight: bold;">$${parseFloat(venta.total).toFixed(2)} MXN</p>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
            <p style="margin: 0;">BOLSUR MÉXICO S.A. DE C.V.</p>
            <p style="margin: 5px 0 0;">Oaxaca, México. Este documento es un comprobante de compra interno.</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Bolsur México" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject || `Recibo de compra: ${venta.numero_venta}`,
      html: htmlContent
    });

    res.json({ success: true, message: "Correo enviado" });
  } catch (error) {
    console.error("ERROR EMAIL:", error.message);
    res.status(500).json({ error: "Fallo envío", details: error.message });
  }
};