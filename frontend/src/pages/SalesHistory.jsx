import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Eye, Calendar, Printer, X, CreditCard, DollarSign } from 'lucide-react';

const SalesHistory = () => {
  const { apiFetch, systemSettings } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Detalles de Venta (Modal Recibo)
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetchSalesHistory();
  }, [startDate, endDate, paymentMethod]);

  const fetchSalesHistory = async () => {
    try {
      setLoading(true);
      let query = '';
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (paymentMethod) params.push(`paymentMethod=${paymentMethod}`);
      if (params.length > 0) query = `?${params.join('&')}`;

      const res = await apiFetch(`/sales${query}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error('Error cargando historial de ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = (sale) => {
    setSelectedSale(sale);
    setShowReceipt(true);
  };

  // Calcular total facturado en la consulta actual
  const getTotalAccumulated = () => {
    return sales.reduce((acc, sale) => acc + sale.total, 0);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Historial de Ventas</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Registro cronológico de transacciones y facturación.</p>
        </div>
      </div>

      {/* Caja de Métricas Rápidas y Filtros */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px' }}>
        
        {/* Controles de Filtro */}
        <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', padding: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--color-primary-light)' }} />
            <span className="input-label" style={{ marginBottom: 0 }}>Rango Fechas:</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '6px 12px', width: '140px', fontSize: '0.85rem' }}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>al</span>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '6px 12px', width: '140px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <select
              className="form-input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'var(--bg-main)' }}
            >
              <option value="">Cualquier Pago</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
        </div>

        {/* Total Facturado */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <span className="input-label" style={{ fontSize: '0.75rem' }}>Total Facturado (Filtro)</span>
            <div className="kpi-val" style={{ color: 'var(--color-secondary)' }}>
              ${getTotalAccumulated().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {sales.length} ventas realizadas
            </p>
          </div>
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-secondary)' }}>
            <DollarSign size={24} />
          </div>
        </div>

      </div>

      {/* Tabla de Historial */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            Cargando historial de ventas...
          </div>
        ) : sales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            No se registraron ventas en el período o filtros seleccionados.
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Código de Venta</th>
                  <th>Fecha y Hora</th>
                  <th>Vendedor</th>
                  <th>Método Pago</th>
                  <th>Artículos</th>
                  <th>Descuento</th>
                  <th>Total Cobrado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => {
                  const qtyItems = sale.items.reduce((acc, item) => acc + item.quantity, 0);
                  const saleCode = sale._id.substring(sale._id.length - 8).toUpperCase();

                  return (
                    <tr key={sale._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary-light)' }}>
                        #{saleCode}
                      </td>
                      <td>{new Date(sale.createdAt).toLocaleString('es-AR')}</td>
                      <td>{sale.user?.name || 'Sistema'}</td>
                      <td>
                        <span style={{ textTransform: 'capitalize' }}>{sale.paymentMethod}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{qtyItems} unidades</td>
                      <td style={{ color: sale.discount > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                        {sale.discount > 0 ? `-$${sale.discount.toFixed(2)}` : '$0.00'}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--color-secondary)', fontSize: '1rem' }}>
                        ${sale.total.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handleOpenReceipt(sale)} 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <Eye size={14} />
                          <span>Ver Ticket</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL RECIBO DE VENTA DETALLADO */}
      {showReceipt && selectedSale && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '380px', background: '#ffffff', color: '#1f2937', padding: '24px', borderRadius: '8px' }}>
            
            {/* Cabecera del ticket */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #9ca3af', paddingBottom: '15px', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', margin: 0 }}>{systemSettings?.ticketName || 'CEDECCO INSUMOS INFORMÁTICOS'}</h3>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0 0' }}>{systemSettings?.ticketAddress || 'Av. del Puerto 1234, CABA'}</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0 0 0' }}>{systemSettings?.ticketPhone || 'Tel: 4567-8910'}</p>
            </div>

            {/* Metadatos */}
            <div style={{ fontSize: '0.75rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justify: 'space-between' }}>
                <span>Nro Venta:</span>
                <span style={{ fontWeight: 600 }}>#{selectedSale._id.substring(selectedSale._id.length - 8).toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justify: 'space-between' }}>
                <span>Fecha:</span>
                <span>{new Date(selectedSale.createdAt).toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display: 'flex', justify: 'space-between' }}>
                <span>Vendedor:</span>
                <span>{selectedSale.user?.name || 'Sistema'}</span>
              </div>
              <div style={{ display: 'flex', justify: 'space-between' }}>
                <span>Método Pago:</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{selectedSale.paymentMethod}</span>
              </div>
            </div>

            {/* Lista artículos */}
            <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                  <th style={{ paddingBottom: '6px' }}>Cant. Prod</th>
                  <th style={{ textAlign: 'right', paddingBottom: '6px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items.map(item => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px 0' }}>
                      <span style={{ fontWeight: 600 }}>{item.quantity}</span> x {item.name}
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280' }}>
                        ${item.salePrice.toFixed(2)} c/u
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '6px 0', verticalAlign: 'top', fontWeight: 600 }}>
                      ${(item.salePrice * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div style={{ borderTop: '1px dashed #9ca3af', paddingTop: '10px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justify: 'space-between' }}>
                <span>Subtotal:</span>
                <span>${selectedSale.subtotal.toFixed(2)}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div style={{ display: 'flex', justify: 'space-between', color: '#b91c1c' }}>
                  <span>Descuento:</span>
                  <span>-${selectedSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justify: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginTop: '5px', borderTop: '1px solid #e5e7eb', paddingTop: '5px' }}>
                <span>Total Cobrado:</span>
                <span>${selectedSale.total.toFixed(2)}</span>
              </div>
              
              {selectedSale.paymentMethod === 'efectivo' && (
                <>
                  <div style={{ display: 'flex', justify: 'space-between', color: '#4b5563', fontSize: '0.75rem', marginTop: '4px' }}>
                    <span>Efectivo Recibido:</span>
                    <span>${selectedSale.cashReceived.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justify: 'space-between', color: '#15803d', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span>Vuelto Entregado:</span>
                    <span>${selectedSale.changeGiven.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Controles de Modal */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => window.print()} 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '10px', background: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }}
              >
                <Printer size={16} />
                <span>Imprimir</span>
              </button>
              <button 
                onClick={() => setShowReceipt(false)} 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '10px' }}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SalesHistory;
