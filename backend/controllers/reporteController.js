import PDFDocument from 'pdfkit';
import pool from '../config/db.js';

// Obtiene estadísticas generales y datos para gráficas del dashboard
export const getDashboardStats = async (req, res) => {
    const { range } = req.query; 

    // Define el filtro temporal para las consultas SQL
    let dateFilter = "CURRENT_DATE";
    if (range === 'thisWeek') dateFilter = "date_trunc('week', NOW())";
    if (range === 'thisMonth') dateFilter = "date_trunc('month', NOW())";
    if (range === 'thisYear') dateFilter = "date_trunc('year', NOW())";

    try {
        // 1. Cálculo de ingresos totales en el periodo
        const ingresosRes = await pool.query(
            `SELECT COALESCE(SUM(total), 0) as total FROM bolsur_dbnormal.ventas 
             WHERE fecha_venta >= ${dateFilter}`
        );

        // 2. Conteo total de pedidos en el periodo
        const pedidosCountRes = await pool.query(
            `SELECT COUNT(*) as total FROM bolsur_dbnormal.pedidos 
             WHERE created_at >= ${dateFilter}`
        );

        // 3. Identificación de productos con stock crítico
        const stockBajoRes = await pool.query(
            `SELECT COUNT(*) as total FROM bolsur_dbnormal.productos 
             WHERE stock_actual <= stock_minimo`
        );

        // 4. Agrupación de pedidos por estado actual
        const pedidosEstadoRes = await pool.query(
            `SELECT estado, COUNT(*) as cantidad 
             FROM bolsur_dbnormal.pedidos 
             WHERE created_at >= ${dateFilter}
             GROUP BY estado`
        );

        // 5. Histórico de ventas de las últimas 4 semanas
        const ventasSemanaRes = await pool.query(
            `SELECT 
                to_char(date_trunc('week', fecha_venta), 'DD Mon') as semana,
                SUM(total) as ventas
             FROM bolsur_dbnormal.ventas
             WHERE fecha_venta >= NOW() - INTERVAL '4 weeks'
             GROUP BY date_trunc('week', fecha_venta)
             ORDER BY date_trunc('week', fecha_venta) ASC`
        );

        res.json({
            stats: {
                ingresosTotales: parseFloat(ingresosRes.rows[0].total),
                pedidosTotales: parseInt(pedidosCountRes.rows[0].total),
                stockBajo: parseInt(stockBajoRes.rows[0].total),
                ticketPromedio: ingresosRes.rows[0].total > 0 
                    ? parseFloat(ingresosRes.rows[0].total) / parseInt(pedidosCountRes.rows[0].total || 1) 
                    : 0
            },
            charts: {
                pedidosEstado: pedidosEstadoRes.rows,
                ventasSemana: ventasSemanaRes.rows
            }
        });

    } catch (error) {
        console.error("ERROR REPORTE CONTROLLER:", error);
        res.status(500).json({ error: "Error al recopilar datos del reporte" });
    }
};

// Genera un documento PDF detallado con la lista de pedidos
export const generarReportePedidosPDF = async (req, res) => {
    const { range } = req.query;
    
    let dateFilter = "CURRENT_DATE";
    if (range === 'thisWeek') dateFilter = "date_trunc('week', NOW())";
    if (range === 'thisMonth') dateFilter = "date_trunc('month', NOW())";
    if (range === 'thisYear') dateFilter = "date_trunc('year', NOW())";

    try {
        const query = `
            SELECT 
                p.id, 
                c.nombre_comercial as cliente, 
                p.fecha_entrega, 
                p.estado, 
                p.total,
                p.created_at
            FROM bolsur_dbnormal.pedidos p
            JOIN bolsur_dbnormal.clientes c ON p.cliente_id = c.id
            WHERE p.created_at >= ${dateFilter}
            ORDER BY p.created_at DESC`;

        const result = await pool.query(query);

        const doc = new PDFDocument({ margin: 30, size: 'LETTER' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-pedidos-${range}.pdf`);
        doc.pipe(res);

        // Diseño de encabezado corporativo
        doc.rect(0, 0, 612, 100).fill('#1e293b'); 
        doc.fillColor('#ffffff').fontSize(22).text("BOLSUR MÉXICO", 40, 35);
        doc.fontSize(10).text("REPORTE OPERATIVO DE PEDIDOS", 40, 65, { characterSpacing: 1 });
        
        doc.fillColor('#ffffff').fontSize(9)
           .text(`Rango: ${range.toUpperCase()}`, 450, 40, { align: 'right' })
           .text(`Generado: ${new Date().toLocaleString('es-MX')}`, 450, 55, { align: 'right' });

        // Dibujado de cabecera de tabla
        const tableTop = 130;
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold');
        
        doc.text("FOLIO", 40, tableTop);
        doc.text("CLIENTE", 100, tableTop);
        doc.text("ENTREGA", 300, tableTop);
        doc.text("ESTADO", 400, tableTop);
        doc.text("TOTAL", 500, tableTop, { align: 'right' });

        doc.moveTo(40, tableTop + 15).lineTo(570, tableTop + 15).strokeColor('#e2e8f0').stroke();

        let currentY = tableTop + 30;
        doc.font('Helvetica').fontSize(9);

        // Mapeo de estados numéricos a etiquetas visuales
        const statusMap = { 
            1: { txt: 'PENDIENTE', col: '#f59e0b' }, 
            2: { txt: 'EN PROCESO', col: '#3b82f6' }, 
            3: { txt: 'TERMINADO', col: '#10b981' }, 
            4: { txt: 'ENTREGADO', col: '#64748b' } 
        };

        result.rows.forEach((pedido) => {
            if (currentY > 730) { doc.addPage(); currentY = 50; }

            const status = statusMap[pedido.estado] || { txt: 'OTRO', col: '#000' };

            doc.fillColor('#475569').text(`PED-${String(pedido.id).padStart(4, '0')}`, 40, currentY);
            doc.fillColor('#1e293b').text(pedido.cliente, 100, currentY, { width: 180 });
            
            const hCliente = doc.heightOfString(pedido.cliente, { width: 180 });

            doc.fillColor('#475569').text(new Date(pedido.fecha_entrega).toLocaleDateString('es-MX'), 300, currentY);
            doc.fillColor(status.col).font('Helvetica-Bold').text(status.txt, 400, currentY);
            doc.font('Helvetica').fillColor('#1e293b').text(`$${parseFloat(pedido.total).toFixed(2)}`, 500, currentY, { align: 'right' });

            currentY += Math.max(hCliente + 10, 25);
            doc.moveTo(40, currentY - 8).lineTo(570, currentY - 8).strokeColor('#f1f5f9').stroke();
        });

        doc.end();

    } catch (error) {
        console.error("Error Reporte Pedidos:", error);
        res.status(500).json({ error: "Fallo al generar PDF" });
    }
};

// Genera un resumen ejecutivo de ventas con KPIs y listado de transacciones
export const generarReporteVentasPDF = async (req, res) => {
    const { range } = req.query;
    
    let dateFilter = "CURRENT_DATE";
    if (range === 'thisWeek') dateFilter = "date_trunc('week', NOW())";
    if (range === 'thisMonth') dateFilter = "date_trunc('month', NOW())";
    if (range === 'thisYear') dateFilter = "date_trunc('year', NOW())";

    try {
        const query = `
            SELECT 
                v.numero_venta, 
                c.nombre_comercial as cliente, 
                v.fecha_venta, 
                v.total
            FROM bolsur_dbnormal.ventas v
            JOIN bolsur_dbnormal.clientes c ON v.cliente_id = c.id
            WHERE v.fecha_venta >= ${dateFilter}
            ORDER BY v.fecha_venta DESC`;

        const result = await pool.query(query);

        const totalVentas = result.rows.length;
        const ingresosTotales = result.rows.reduce((sum, v) => sum + parseFloat(v.total), 0);
        const ticketPromedio = totalVentas > 0 ? ingresosTotales / totalVentas : 0;

        const doc = new PDFDocument({ margin: 30, size: 'LETTER' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-ventas-${range}.pdf`);
        doc.pipe(res);

        // Encabezado de ventas
        doc.rect(0, 0, 612, 100).fill('#0f172a'); 
        doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text("BOLSUR MÉXICO", 40, 35);
        doc.fontSize(10).font('Helvetica').text("RESUMEN EJECUTIVO DE VENTAS", 40, 65, { characterSpacing: 1 });
        
        doc.fillColor('#ffffff').fontSize(9)
           .text(`PERIODO: ${range.toUpperCase()}`, 450, 40, { align: 'right' })
           .text(`FECHA REPORTE: ${new Date().toLocaleDateString('es-MX')}`, 450, 55, { align: 'right' });

        // Sección de indicadores clave (KPIs)
        doc.rect(30, 120, 552, 60).fill('#f1f5f9'); 
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10);
        
        const fmt = (val) => val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        doc.text("INGRESOS TOTALES", 60, 135);
        doc.text("VENTAS REALIZADAS", 240, 135);
        doc.text("TICKET PROMEDIO", 410, 135);

        doc.font('Helvetica').fontSize(14).fillColor('#0f172a');
        doc.text(`$${fmt(ingresosTotales)}`, 60, 155);
        doc.text(`${totalVentas}`, 240, 155);
        doc.text(`$${fmt(ticketPromedio)}`, 410, 155);

        const tableTop = 210;
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold');
        
        doc.text("FOLIO VENTA", 40, tableTop);
        doc.text("CLIENTE", 160, tableTop);
        doc.text("FECHA", 380, tableTop);
        doc.text("MONTO TOTAL", 500, tableTop, { align: 'right' });

        doc.moveTo(40, tableTop + 15).lineTo(570, tableTop + 15).strokeColor('#cbd5e1').stroke();

        let currentY = tableTop + 30;
        doc.font('Helvetica').fontSize(9).fillColor('#475569');

        result.rows.forEach((v) => {
            if (currentY > 730) { doc.addPage(); currentY = 50; }

            doc.text(v.numero_venta, 40, currentY);
            doc.fillColor('#1e293b').text(v.cliente, 160, currentY, { width: 200 }); 
            const hCliente = doc.heightOfString(v.cliente, { width: 200 });

            doc.fillColor('#475569').text(new Date(v.fecha_venta).toLocaleDateString('es-MX'), 380, currentY);
            doc.fillColor('#0f172a').font('Helvetica-Bold').text(`$${parseFloat(v.total).toFixed(2)}`, 500, currentY, { align: 'right' });

            currentY += Math.max(hCliente + 10, 25);
            doc.moveTo(40, currentY - 8).lineTo(570, currentY - 8).strokeColor('#f1f5f9').stroke();
        });

        doc.end();

    } catch (error) {
        console.error("Error Reporte Ventas:", error);
        res.status(500).json({ error: "Error de servidor al generar PDF" });
    }
};

// Genera un reporte de inventario destacando productos que requieren reabastecimiento
export const generarReporteInventarioPDF = async (req, res) => {
    try {
        const inventarioRes = await pool.query(
            `SELECT 
                p.nombre, 
                p.stock_actual, 
                p.stock_minimo, 
                p.precio_venta,
                COALESCE(c.nombre, 'Sin Categoría') as nombre_categoria
             FROM bolsur_dbnormal.productos p
             LEFT JOIN bolsur_dbnormal.categorias c ON p.categoria_id = c.id
             ORDER BY (p.stock_actual <= p.stock_minimo) DESC, c.nombre ASC, p.nombre ASC`
        );

        const doc = new PDFDocument({ margin: 30, size: 'LETTER' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-inventario.pdf');
        doc.pipe(res);

        // Encabezado de inventario
        doc.rect(0, 0, 612, 100).fill('#9f1239'); 
        doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text("BOLSUR MÉXICO", 40, 35);
        doc.fontSize(10).font('Helvetica').text("ESTADO ACTUAL DE INVENTARIO Y REABASTECIMIENTO", 40, 65, { characterSpacing: 1 });
        
        doc.fillColor('#ffffff').fontSize(9)
           .text(`FECHA REPORTE: ${new Date().toLocaleString('es-MX')}`, 450, 50, { align: 'right' });

        // Banner de alerta para stock crítico
        const criticos = inventarioRes.rows.filter(p => p.stock_actual <= p.stock_minimo).length;
        doc.rect(30, 120, 552, 35).fill('#fff1f2'); 
        doc.fillColor('#9f1239').font('Helvetica-Bold').fontSize(10)
           .text(`ATENCIÓN: Tienes ${criticos} productos por debajo del stock mínimo.`, 60, 132);

        const tableTop = 175;
        doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
        doc.text("PRODUCTO", 40, tableTop);
        doc.text("CATEGORÍA", 200, tableTop);
        doc.text("ACTUAL", 350, tableTop);
        doc.text("MÍNIMO", 430, tableTop);
        doc.text("ESTADO", 520, tableTop, { align: 'right' });

        doc.moveTo(40, tableTop + 12).lineTo(570, tableTop + 12).strokeColor('#cbd5e1').stroke();

        let currentY = tableTop + 25;
        doc.font('Helvetica').fontSize(8);

        inventarioRes.rows.forEach((p) => {
            if (currentY > 730) { doc.addPage(); currentY = 50; }

            const esCritico = p.stock_actual <= p.stock_minimo;
            
            doc.fillColor('#1e293b').font('Helvetica-Bold').text(p.nombre, 40, currentY, { width: 150 });
            doc.fillColor('#64748b').font('Helvetica').text(p.nombre_categoria, 200, currentY, { width: 130 });
            
            const hNombre = doc.heightOfString(p.nombre, { width: 150 });
            const hCat = doc.heightOfString(p.nombre_categoria, { width: 130 });

            doc.fillColor(esCritico ? '#e11d48' : '#475569')
               .text(p.stock_actual.toString(), 350, currentY)
               .text(p.stock_minimo.toString(), 430, currentY);

            // Etiquetado de estado de stock
            if (esCritico) {
                doc.fillColor('#e11d48').font('Helvetica-Bold').text("REABASTECER", 520, currentY, { align: 'right' });
            } else {
                doc.fillColor('#10b981').text("ÓPTIMO", 520, currentY, { align: 'right' });
            }

            currentY += Math.max(hNombre, hCat, 20) + 10;
            doc.moveTo(40, currentY - 5).lineTo(570, currentY - 5).strokeColor('#f1f5f9').stroke();
        });

        doc.end();

    } catch (error) {
        console.error("Error Reporte Inventario:", error);
        res.status(500).json({ error: "Fallo al generar reporte con categorías" });
    }
};