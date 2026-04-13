import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const ticketStyles = `
  #ticket-container {
    width: 80mm; 
    margin: 0 auto;
    padding: 5mm;
    background: white;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    line-height: 1.2;
    color: black;
  }

  @media print {
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background: white;
    }
    #ticket-container {
      width: 80mm;
      margin: 0;
      padding: 4mm;
      box-shadow: none;
    }
    .no-print {
      display: none;
    }
  }

  .center { text-align: center; }
  .bold { font-weight: bold; }
  .border-top { border-top: 1px dashed black; margin-top: 2mm; padding-top: 2mm; }
  .border-bottom { border-bottom: 1px dashed black; margin-bottom: 2mm; padding-bottom: 2mm; }
  
  .ticket-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
  .ticket-table th { text-align: left; border-bottom: 1px dashed black; font-size: 11px; }
  .ticket-table td { vertical-align: top; padding: 1mm 0; font-size: 11px; }
  
  .flex-between { display: flex; justify-content: space-between; }
  .mt-1 { margin-top: 1mm; }
  .mt-2 { margin-top: 4mm; }
  .small { font-size: 10px; }
`;

const TicketPrinter = () => {
  const { ventaId } = useParams();
  const { authFetch } = useAuth();
  const [venta, setVenta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVentaDetalle = async () => {
      try {
        const res = await authFetch(`http://localhost:4000/api/ventas/${ventaId}`);
        if (res.ok) {
          const data = await res.json();
          setVenta(data);
        }
      } catch (error) {
        console.error("Error cargando ticket:", error);
      } finally {
        setLoading(false);
      }
    };
    if (ventaId) fetchVentaDetalle();
  }, [ventaId, authFetch]);

  useEffect(() => {
    if (venta && !loading) {
      const timer = setTimeout(() => {
        window.print();
        // window.close(); // Opcional: cerrar pestaña tras imprimir
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [venta, loading]);

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
      <p className="text-sm text-muted-foreground">Generando ticket...</p>
    </div>
  );

  if (!venta) return <div className="center p-10">Error: No se pudo recuperar la información.</div>;

  return (
    <>
      <style>{ticketStyles}</style>
      <div id="ticket-container">
        {/* ENCABEZADO */}
        <div className="center border-bottom">
          <div className="bold" style={{ fontSize: '18px' }}>
            {venta.empresa?.nombre || 'BOLSUR MEXICO'}
          </div>
          <div className="small">S.A. de C.V.</div>
          <div className="small mt-1">
            <span className="bold">RFC: BM970425QN1</span><br />
            {venta.empresa?.direccion || 'Oaxaca, México'}<br />
            Tel: {venta.empresa?.telefono || '951 XXX XXXX'}<br />
            {venta.empresa?.correo && <div>Email: {venta.empresa.correo}</div>}
            <div className="bold mt-1">EXPEDIDO EN SUCURSAL MATRIZ</div>
          </div>
        </div>

        {/* INFO VENTA */}
        <div className="small border-bottom">
          <div className="flex-between">
            <span className="bold">FOLIO:</span>
            <span className="bold">{venta.saleNumber}</span>
          </div>
          <div className="flex-between">
            <span>FECHA:</span>
            <span>{new Date(venta.date).toLocaleString('es-MX')}</span>
          </div>
          <div className="flex-between">
            <span>VENDEDOR:</span>
            <span>{venta.createdBy?.split(' ')[0]}</span>
          </div>
          <div className="flex-between">
            <span>CLIENTE:</span>
            <span className="bold">{venta.clientName}</span>
          </div>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <table className="ticket-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>CANT</th>
              <th style={{ width: '55%' }}>DESCRIPCIÓN</th>
              <th style={{ width: '30%', textAlign: 'right' }}>IMPORTE</th>
            </tr>
          </thead>
          <tbody>
            {venta.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td>{item.quantity}</td>
                <td>{item.productName}</td>
                <td style={{ textAlign: 'right' }}>
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALES */}
        <div className="border-top">
          <div className="flex-between bold" style={{ fontSize: '14px' }}>
            <span>TOTAL:</span>
            <span>${parseFloat(venta.totalAmount).toFixed(2)} MXN</span>
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="center mt-2 small">
          <div>¡Gracias por su compra!</div>
          <div className="bold">ESTE NO ES UN COMPROBANTE FISCAL</div>
          <div style={{ marginTop: '3mm' }} className="bold">
            --- CUENTA CERRADA ---
          </div>
        </div>
      </div>
    </>
  );
};

export default TicketPrinter;