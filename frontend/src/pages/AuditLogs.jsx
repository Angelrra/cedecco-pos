import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, RefreshCw, ShoppingCart, 
  Package, Key, Lock, Unlock, Clock, User 
} from 'lucide-react';

const AuditLogs = () => {
  const { apiFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'venta', 'stock', 'caja'
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setRefreshing(true);
      const res = await apiFetch('/audit/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error al obtener la bitácora:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getFilteredLogs = () => {
    if (filterType === 'all') return logs;
    if (filterType === 'caja') {
      return logs.filter(log => log.type === 'caja_apertura' || log.type === 'caja_cierre');
    }
    return logs.filter(log => log.type === filterType);
  };

  // Helper para renderizar íconos según tipo
  const renderLogIcon = (type) => {
    switch (type) {
      case 'venta':
        return (
          <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(6,182,212,0.15)', color: 'var(--color-secondary)' }}>
            <ShoppingCart size={18} />
          </div>
        );
      case 'stock':
        return (
          <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)' }}>
            <Package size={18} />
          </div>
        );
      case 'caja_apertura':
        return (
          <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.15)', color: 'var(--color-success)' }}>
            <Unlock size={18} />
          </div>
        );
      case 'caja_cierre':
        return (
          <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)' }}>
            <Lock size={18} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Bitácora Testigo (Auditoría)</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Historial detallado y testigo de transacciones, caja y stock de personal en tiempo real.</p>
        </div>
        <button 
          onClick={fetchLogs} 
          className="btn btn-secondary" 
          disabled={refreshing}
          style={{ padding: '10px 14px' }}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Actualizando...' : 'Refrescar'}</span>
        </button>
      </div>

      {/* Controles de Filtros */}
      <div className="glass-panel" style={{ display: 'flex', gap: '10px', padding: '15px 20px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setFilterType('all')} 
          className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          Todos los Movimientos
        </button>
        <button 
          onClick={() => setFilterType('venta')} 
          className={`btn ${filterType === 'venta' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <ShoppingCart size={14} />
          <span>Ventas Facturadas</span>
        </button>
        <button 
          onClick={() => setFilterType('stock')} 
          className={`btn ${filterType === 'stock' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Package size={14} />
          <span>Ajustes de Inventario</span>
        </button>
        <button 
          onClick={() => setFilterType('caja')} 
          className={`btn ${filterType === 'caja' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <span>Turnos de Caja</span>
        </button>
      </div>

      {/* Feed del Testigo */}
      <div className="glass-panel" style={{ padding: '24px 30px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            Cargando bitácora testigo...
          </div>
        ) : getFilteredLogs().length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            No se encontraron eventos registrados para la categoría seleccionada.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border-light)' }}>
            
            {getFilteredLogs().map((log, idx) => (
              <div 
                key={log._id || idx}
                style={{
                  position: 'relative',
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '15px',
                  alignItems: 'flex-start',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                {/* Viñeta de Línea de Tiempo */}
                <div style={{
                  position: 'absolute',
                  left: '-29px',
                  top: '12px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: log.type === 'venta' 
                    ? 'var(--color-secondary)' 
                    : log.type === 'stock' 
                      ? 'var(--color-warning)' 
                      : log.type === 'caja_apertura' 
                        ? 'var(--color-success)' 
                        : 'var(--color-danger)',
                  border: '3px solid var(--bg-main)',
                  boxShadow: '0 0 8px rgba(255,255,255,0.1)'
                }}></div>

                {/* Ícono de Categoría */}
                {renderLogIcon(log.type)}

                {/* Contenido de la Tarjeta */}
                <div 
                  className="glass-panel"
                  style={{
                    flexGrow: 1,
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{log.description}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {new Date(log.timestamp).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    <User size={12} />
                    <span>Realizado por: <strong style={{ color: 'var(--color-text-main)' }}>{log.user}</strong></span>
                    {log.userEmail && <span>({log.userEmail})</span>}
                  </div>

                  {/* Detalles adicionales según tipo */}
                  {log.type === 'venta' && (
                    <div style={{ fontSize: '0.8rem', marginTop: '6px', padding: '6px 10px', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)', display: 'inline-flex', gap: '15px' }}>
                      <span>Artículos: <strong>{log.details.itemsCount}</strong></span>
                      <span>Método Pago: <strong style={{ textTransform: 'capitalize' }}>{log.details.paymentMethod}</strong></span>
                    </div>
                  )}

                  {log.type === 'stock' && log.details.reason && (
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', fontStyle: 'italic', color: 'var(--color-warning)' }}>
                      Motivo: "{log.details.reason}"
                    </div>
                  )}

                  {log.type === 'caja_cierre' && (
                    <div style={{ fontSize: '0.8rem', marginTop: '6px', padding: '10px', background: 'rgba(239,68,68,0.05)', border: '1px dashed var(--border-danger)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <span>Inicial: <strong>${log.details.initialCash.toFixed(2)}</strong></span>
                        <span>Esperado: <strong>${log.details.expectedCash.toFixed(2)}</strong></span>
                        <span>Físico: <strong>${log.details.actualCash.toFixed(2)}</strong></span>
                      </div>
                      {log.details.notes && (
                        <div style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Observación: "{log.details.notes}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ))}

          </div>
        )}
      </div>

    </div>
  );
};

export default AuditLogs;
