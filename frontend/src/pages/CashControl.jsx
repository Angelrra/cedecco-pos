import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Key, Lock, Unlock, DollarSign, Calendar, 
  AlertTriangle, FileText, CheckCircle, HelpCircle, Calculator 
} from 'lucide-react';

const CashControl = () => {
  const { user, activeSession, openSession, closeSession, apiFetch, checkActiveSession } = useAuth();
  
  // Estados de apertura
  const [initialCash, setInitialCash] = useState('2000');
  const [openError, setOpenError] = useState('');
  
  // Estados de cierre
  const [actualCash, setActualCash] = useState('');
  const [actualCard, setActualCard] = useState('');
  const [actualTransfer, setActualTransfer] = useState('');
  const [actualMercadoPago, setActualMercadoPago] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [closeError, setCloseError] = useState('');
  const [closeSuccess, setCloseSuccess] = useState('');

  // Estados del desglose de billetes
  const [showBillsModal, setShowBillsModal] = useState(false);
  const [billCounts, setBillCounts] = useState({
    20000: '',
    10000: '',
    2000: '',
    1000: '',
    500: '',
    200: '',
    100: '',
    50: '',
    20: '',
    10: '',
    5: ''
  });

  const denominations = [20000, 10000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5];

  const getBillsTotal = () => {
    return denominations.reduce((sum, denom) => {
      const count = parseInt(billCounts[denom]) || 0;
      return sum + (denom * count);
    }, 0);
  };

  const handleApplyBills = () => {
    const total = getBillsTotal();
    setActualCash(total.toString());
    setShowBillsModal(false);
  };

  // Historial (Solo Admin)
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterUser, setFilterUser] = useState('');

  const isAdmin = user && user.role === 'admin';

  // Obtener cajeros únicos del historial para el selector de filtro
  const uniqueUsers = Array.from(
    new Map(
      history
        .filter(s => s.user)
        .map(s => [s.user._id, s.user])
    ).values()
  );

  // Filtrar el historial según los filtros aplicados (por fecha y por cajero)
  const filteredHistory = history.filter(session => {
    if (filterDate) {
      const sessionDate = new Date(session.openedAt).toISOString().split('T')[0];
      if (sessionDate !== filterDate) return false;
    }
    if (filterUser) {
      if (!session.user || session.user._id !== filterUser) return false;
    }
    return true;
  });

  // Al cargar el panel de control de caja, forzar la recarga del estado desde el servidor
  // para obtener las ventas y el efectivo esperado actualizados en tiempo real.
  useEffect(() => {
    checkActiveSession();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchHistory();
    }
  }, [activeSession]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await apiFetch('/cash/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpen = async (e) => {
    e.preventDefault();
    setOpenError('');
    if (!initialCash || isNaN(initialCash) || parseFloat(initialCash) < 0) {
      setOpenError('Por favor introduce un monto de apertura inicial válido y mayor o igual a cero');
      return;
    }

    try {
      await openSession(initialCash);
    } catch (err) {
      setOpenError(err.message || 'Error al abrir caja');
    }
  };

  const handleClose = async (e) => {
    e.preventDefault();
    setCloseError('');
    setCloseSuccess('');

    if (actualCash === '' || isNaN(actualCash) || parseFloat(actualCash) < 0) {
      setCloseError('Por favor introduce la cantidad de efectivo real contada en caja (puede ser 0)');
      return;
    }
    if (actualCard === '' || isNaN(actualCard) || parseFloat(actualCard) < 0) {
      setCloseError('Por favor introduce el monto real de tarjetas contado (puede ser 0)');
      return;
    }
    if (actualTransfer === '' || isNaN(actualTransfer) || parseFloat(actualTransfer) < 0) {
      setCloseError('Por favor introduce el monto real de transferencias verificado (puede ser 0)');
      return;
    }
    if (actualMercadoPago === '' || isNaN(actualMercadoPago) || parseFloat(actualMercadoPago) < 0) {
      setCloseError('Por favor introduce el monto real de Mercado Pago verificado (puede ser 0)');
      return;
    }

    try {
      const closedSession = await closeSession(actualCash, actualCard, actualTransfer, actualMercadoPago, closeNotes);
      setCloseSuccess('¡Arqueo y cierre de caja realizados con éxito! Turno cerrado.');
      setActualCash('');
      setActualCard('');
      setActualTransfer('');
      setActualMercadoPago('');
      setCloseNotes('');
      // Limpiar mensaje tras unos segundos
      setTimeout(() => setCloseSuccess(''), 4000);
    } catch (err) {
      setCloseError(err.message || 'Error al realizar el cierre de caja');
    }
  };

  // Cálculo de discrepancia dinámica mientras escriben el arqueo
  const getDynamicDiscrepancy = () => {
    if (!actualCash || isNaN(actualCash) || !activeSession || activeSession.expectedCash === null) return null;
    const actual = parseFloat(actualCash);
    const expected = activeSession.expectedCash;
    return actual - expected;
  };

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Control de Caja Registradora</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Apertura, cierre de turnos y arqueos diarios de efectivo.</p>
      </div>

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1.2fr 1fr' : '1fr', gap: '20px', marginBottom: '30px' }}>
        
        {/* LADO IZQUIERDO: Apertura / Cierre de Turno Activo */}
        <div>
          {!activeSession ? (
            /* CASO: CAJA CERRADA -> FORMULARIO DE APERTURA */
            <div className="glass-panel" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '15px' }}>
                <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                  <Lock size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem' }}>Caja Registradora Cerrada</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No puedes registrar ventas en este momento</span>
                </div>
              </div>

              {openError && (
                <div className="badge-danger" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '15px', display: 'block' }}>
                  {openError}
                </div>
              )}

              {closeSuccess && (
                <div className="badge-success" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '15px', display: 'block' }}>
                  {closeSuccess}
                </div>
              )}

              <form onSubmit={handleOpen}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
                  Para iniciar las ventas del turno, debes realizar la apertura de la caja ingresando el fondo de efectivo inicial en la gaveta (para cambio/vuelto).
                </p>

                <div className="input-group" style={{ maxWidth: '320px', marginBottom: '25px' }}>
                  <label className="input-label">Monto de Apertura Inicial ($) *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)', fontWeight: 600 }}>
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={initialCash}
                      onChange={(e) => setInitialCash(e.target.value)}
                      style={{ paddingLeft: '28px' }}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-success" style={{ padding: '12px 24px', fontSize: '1rem' }}>
                  <Unlock size={18} />
                  <span>Iniciar Turno y Abrir Caja</span>
                </button>
              </form>
            </div>
          ) : (
            /* CASO: CAJA ABIERTA -> RESUMEN DE TURNO Y CIERRE */
            <div className="glass-panel" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '15px' }}>
                <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                  <Unlock size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem' }}>Caja Registradora Abierta</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Turno activo y terminal de POS lista para facturar</span>
                </div>
              </div>

              {closeError && (
                <div className="badge-danger" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '15px', display: 'block' }}>
                  {closeError}
                </div>
              )}

              {isAdmin ? (
                <>
                  {/* Estadísticas de caja en tiempo real para Admin */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <span className="input-label" style={{ fontSize: '0.75rem' }}>Fondo Inicial</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '5px' }}>
                        ${activeSession.initialCash.toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        Apertura: {new Date(activeSession.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <span className="input-label" style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>Ventas en Efectivo</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '5px' }}>
                        ${(activeSession.salesCash || 0).toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Registrado por el POS</span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <span className="input-label" style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)' }}>Efectivo Esperado</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary-light)', marginTop: '5px' }}>
                        ${(activeSession.expectedCash || 0).toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Fondo + Ventas en Efectivo</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <span className="input-label" style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Ventas con Tarjeta</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '5px' }}>
                        ${(activeSession.salesCard || 0).toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Tickets / Lote POS</span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <span className="input-label" style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)' }}>Ventas por Transferencia</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary-light)', marginTop: '5px' }}>
                        ${(activeSession.salesTransfer || 0).toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Cuentas bancarias</span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <span className="input-label" style={{ fontSize: '0.75rem', color: '#00b1ea' }}>Mercado Pago QR</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00b1ea', marginTop: '5px' }}>
                        ${(activeSession.salesMercadoPago || 0).toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Cobro automático QR</span>
                    </div>

                    <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <span className="input-label" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Total de Ventas (Turno)</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: '5px' }}>
                        ${(activeSession.totalSales || 0).toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Suma de todos los cobros</span>
                    </div>
                  </div>
                </>
              ) : (
                /* Para Cajeros/Vendedores, mostrar aviso del turno activo pero sin revelar montos */
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%)', 
                  padding: '20px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-light)', 
                  marginBottom: '25px' 
                }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} />
                    <span>Turno de Caja Activo</span>
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    Tu sesión de caja está abierta y lista para operar. Puedes registrar ventas normalmente en el Punto de Venta. 
                    Al finalizar tu turno, realiza tu declaración ingresando los montos físicos exactos que has contado de efectivo, tarjeta y transferencia en los campos de abajo.
                  </p>
                </div>
              )}

              {/* Formulario de Cierre de Caja */}
              <form onSubmit={handleClose} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Formulario de Arqueo y Cierre</h4>

                {/* Fila 1: Efectivo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label className="input-label" style={{ marginBottom: 0 }}>Efectivo Físico en Gaveta ($) *</label>
                      <button
                        type="button"
                        onClick={() => setShowBillsModal(true)}
                        className="btn btn-secondary"
                        style={{ 
                          padding: '4px 10px', 
                          fontSize: '0.75rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'var(--border-light)'
                        }}
                      >
                        <Calculator size={12} />
                        <span>Desglosar Billetes</span>
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }}>
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="Monto real contado..."
                        value={actualCash}
                        onChange={(e) => setActualCash(e.target.value)}
                        style={{ paddingLeft: '25px' }}
                        required
                      />
                    </div>
                  </div>

                  {isAdmin ? (
                    /* Visualización de diferencia de efectivo en tiempo real para Admin */
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span className="input-label">Diferencia de Efectivo</span>
                      {getDynamicDiscrepancy() !== null ? (
                        <span style={{ 
                          fontSize: '1.4rem', 
                          fontWeight: 800, 
                          marginTop: '4px',
                          color: getDynamicDiscrepancy() === 0 
                            ? 'var(--color-success)' 
                            : getDynamicDiscrepancy() > 0 
                              ? 'var(--color-secondary)' 
                              : 'var(--color-danger)'
                        }}>
                          ${getDynamicDiscrepancy().toFixed(2)}{' '}
                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                            {getDynamicDiscrepancy() === 0 
                              ? '(Caja Cuadrada)' 
                              : getDynamicDiscrepancy() > 0 
                                ? '(Sobrante)' 
                                : '(Faltante)'}
                          </span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                          Ingresa el efectivo real
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Para cajeros, mostrar recordatorio discreto */
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', paddingLeft: '10px' }}>
                      <span>Por favor cuenta cuidadosamente el efectivo físico de tu gaveta.</span>
                    </div>
                  )}
                </div>

                {/* Fila 2: Tarjetas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Tarjeta - Lote POS ($) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }}>
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="Monto total en cupones..."
                        value={actualCard}
                        onChange={(e) => setActualCard(e.target.value)}
                        style={{ paddingLeft: '25px' }}
                        required
                      />
                    </div>
                  </div>

                  {isAdmin ? (
                    /* Diferencia de tarjetas en tiempo real para Admin */
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span className="input-label">Diferencia de Tarjeta</span>
                      {actualCard !== '' && !isNaN(actualCard) ? (
                        <span style={{ 
                          fontSize: '1.4rem', 
                          fontWeight: 800, 
                          marginTop: '4px',
                          color: (parseFloat(actualCard) - (activeSession.expectedCard || 0)) === 0 
                            ? 'var(--color-success)' 
                            : (parseFloat(actualCard) - (activeSession.expectedCard || 0)) > 0 
                              ? 'var(--color-secondary)' 
                              : 'var(--color-danger)'
                        }}>
                          ${(parseFloat(actualCard) - (activeSession.expectedCard || 0)).toFixed(2)}{' '}
                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                            {(parseFloat(actualCard) - (activeSession.expectedCard || 0)) === 0 ? '(Caja Cuadrada)' : '(Diferencia)'}
                          </span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                          Ingresa las tarjetas reales
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', paddingLeft: '10px' }}>
                      <span>Suma los tickets y comprobantes impresos por la terminal POS.</span>
                    </div>
                  )}
                </div>

                {/* Fila 3: Transferencias */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Transferencias Recibidas ($) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }}>
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="Monto total transferido..."
                        value={actualTransfer}
                        onChange={(e) => setActualTransfer(e.target.value)}
                        style={{ paddingLeft: '25px' }}
                        required
                      />
                    </div>
                  </div>

                  {isAdmin ? (
                    /* Diferencia de transferencias en tiempo real para Admin */
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span className="input-label">Diferencia de Transferencias</span>
                      {actualTransfer !== '' && !isNaN(actualTransfer) ? (
                        <span style={{ 
                          fontSize: '1.4rem', 
                          fontWeight: 800, 
                          marginTop: '4px',
                          color: (parseFloat(actualTransfer) - (activeSession.expectedTransfer || 0)) === 0 
                            ? 'var(--color-success)' 
                            : (parseFloat(actualTransfer) - (activeSession.expectedTransfer || 0)) > 0 
                              ? 'var(--color-secondary)' 
                              : 'var(--color-danger)'
                        }}>
                          ${(parseFloat(actualTransfer) - (activeSession.expectedTransfer || 0)).toFixed(2)}{' '}
                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                            {(parseFloat(actualTransfer) - (activeSession.expectedTransfer || 0)) === 0 ? '(Caja Cuadrada)' : '(Diferencia)'}
                          </span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                          Ingresa las transferencias reales
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', paddingLeft: '10px' }}>
                      <span>Verifica y suma las transferencias registradas en la cuenta bancaria.</span>
                    </div>
                  )}
                </div>

                {/* Fila 4: Mercado Pago */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Mercado Pago Contado ($) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }}>
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="Monto real verificado..."
                        value={actualMercadoPago}
                        onChange={(e) => setActualMercadoPago(e.target.value)}
                        style={{ paddingLeft: '25px' }}
                        required
                      />
                    </div>
                  </div>

                  {isAdmin ? (
                    /* Diferencia de Mercado Pago en tiempo real para Admin */
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span className="input-label">Diferencia de Mercado Pago</span>
                      {actualMercadoPago !== '' && !isNaN(actualMercadoPago) ? (
                        <span style={{ 
                          fontSize: '1.4rem', 
                          fontWeight: 800, 
                          marginTop: '4px',
                          color: (parseFloat(actualMercadoPago) - (activeSession.expectedMercadoPago || 0)) === 0 
                            ? 'var(--color-success)' 
                            : (parseFloat(actualMercadoPago) - (activeSession.expectedMercadoPago || 0)) > 0 
                              ? 'var(--color-secondary)' 
                              : 'var(--color-danger)'
                        }}>
                          ${(parseFloat(actualMercadoPago) - (activeSession.expectedMercadoPago || 0)).toFixed(2)}{' '}
                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                            {(parseFloat(actualMercadoPago) - (activeSession.expectedMercadoPago || 0)) === 0 ? '(Caja Cuadrada)' : '(Diferencia)'}
                          </span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                          Ingresa Mercado Pago real
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', paddingLeft: '10px' }}>
                      <span>Suma los cobros liquidados que figuren aprobados en la app de Mercado Pago.</span>
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">Notas u Observaciones del Cierre</label>
                  <textarea
                    className="form-input"
                    placeholder="Describe motivos de descuadre si los hay, u observaciones..."
                    rows="2"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>

                <button type="submit" className="btn btn-danger" style={{ padding: '12px 24px', fontSize: '1rem', marginTop: '10px' }}>
                  <Lock size={18} />
                  <span>Realizar Arqueo y Cerrar Caja</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* LADO DERECHO: Historial de Turnos de Caja (Solo visible a Admin) */}
        {isAdmin && (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '15px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} style={{ color: 'var(--color-primary-light)' }} />
              <span>Auditoría de Turnos de Caja</span>
            </h3>

            {/* Panel de Filtros para días anteriores y cajeros */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div>
                <label className="input-label" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>Filtrar por Fecha</label>
                <input
                  type="date"
                  className="form-input"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'var(--bg-main)' }}
                />
              </div>
              <div>
                <label className="input-label" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>Filtrar por Cajero</label>
                <select
                  className="form-input"
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'var(--bg-main)' }}
                >
                  <option value="">Todos los cajeros</option>
                  {uniqueUsers.map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              {(filterDate || filterUser) && (
                <button 
                  onClick={() => { setFilterDate(''); setFilterUser(''); }}
                  className="btn btn-secondary"
                  style={{ gridColumn: '1 / -1', padding: '6px 12px', fontSize: '0.75rem', marginTop: '5px' }}
                >
                  Limpiar Filtros
                </button>
              )}
            </div>

            <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  Cargando arqueos históricos...
                </div>
              ) : filteredHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {history.length > 0 ? 'No se encontraron turnos con los filtros aplicados.' : 'No se registran cierres de caja en el sistema.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredHistory.map(session => {
                    const isClosed = session.status === 'cerrada';
                    
                    return (
                      <div 
                        key={session._id}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {session.user?.name || 'Usuario'}
                          </span>
                          <span className={`badge ${isClosed ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                            {session.status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <span>Apertura: {new Date(session.openedAt).toLocaleDateString()} {new Date(session.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          {isClosed && (
                            <span>Cierre: {new Date(session.closedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '2px' }}>
                          <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Fondo Inicial:</span>{' '}
                            <span style={{ fontWeight: 600 }}>${session.initialCash.toFixed(2)}</span>
                          </div>
                          {!isClosed && (
                            <div>
                              <span style={{ color: 'var(--color-text-muted)' }}>Esperado:</span>{' '}
                              <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>${(session.expectedCash || 0).toFixed(2)}</span>
                            </div>
                          )}
                        </div>

                        {isClosed && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '4px', marginTop: '6px' }}>
                            {/* Desglose Efectivo */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Efectivo:</span>
                              <span style={{ color: '#fff' }}>Esp: ${(session.expectedCash || 0).toFixed(2)} | Real: ${(session.actualCash || 0).toFixed(2)}</span>
                              <span style={{ 
                                fontWeight: 700,
                                color: (session.discrepancy || 0) === 0 
                                  ? 'var(--color-success)' 
                                  : (session.discrepancy || 0) > 0 
                                    ? 'var(--color-secondary)' 
                                    : 'var(--color-danger)'
                              }}>
                                {(session.discrepancy || 0) >= 0 ? '+' : ''}${(session.discrepancy || 0).toFixed(2)}
                              </span>
                            </div>

                            {/* Desglose Tarjetas */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Tarjeta:</span>
                              <span style={{ color: '#fff' }}>Esp: ${(session.expectedCard || 0).toFixed(2)} | Real: ${(session.actualCard || 0).toFixed(2)}</span>
                              <span style={{ 
                                fontWeight: 700,
                                color: (session.discrepancyCard || 0) === 0 
                                  ? 'var(--color-success)' 
                                  : (session.discrepancyCard || 0) > 0 
                                    ? 'var(--color-secondary)' 
                                    : 'var(--color-danger)'
                              }}>
                                {(session.discrepancyCard || 0) >= 0 ? '+' : ''}${(session.discrepancyCard || 0).toFixed(2)}
                              </span>
                            </div>

                            {/* Desglose Transferencias */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Transf:</span>
                              <span style={{ color: '#fff' }}>Esp: ${(session.expectedTransfer || 0).toFixed(2)} | Real: ${(session.actualTransfer || 0).toFixed(2)}</span>
                              <span style={{ 
                                fontWeight: 700,
                                color: (session.discrepancyTransfer || 0) === 0 
                                  ? 'var(--color-success)' 
                                  : (session.discrepancyTransfer || 0) > 0 
                                    ? 'var(--color-secondary)' 
                                    : 'var(--color-danger)'
                              }}>
                                {(session.discrepancyTransfer || 0) >= 0 ? '+' : ''}${(session.discrepancyTransfer || 0).toFixed(2)}
                              </span>
                            </div>

                            {/* Desglose Mercado Pago */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>M. Pago:</span>
                              <span style={{ color: '#fff' }}>Esp: ${(session.expectedMercadoPago || 0).toFixed(2)} | Real: ${(session.actualMercadoPago || 0).toFixed(2)}</span>
                              <span style={{ 
                                fontWeight: 700,
                                color: (session.discrepancyMercadoPago || 0) === 0 
                                  ? 'var(--color-success)' 
                                  : (session.discrepancyMercadoPago || 0) > 0 
                                    ? 'var(--color-secondary)' 
                                    : 'var(--color-danger)'
                              }}>
                                {(session.discrepancyMercadoPago || 0) >= 0 ? '+' : ''}${(session.discrepancyMercadoPago || 0).toFixed(2)}
                              </span>
                            </div>

                            {/* Total General */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              fontWeight: 800, 
                              borderTop: '1px solid rgba(255,255,255,0.08)', 
                              paddingTop: '4px', 
                              marginTop: '4px',
                              fontSize: '0.8rem',
                              color: 'var(--color-primary-light)'
                            }}>
                              <span>Total Gral:</span>
                              <span style={{ color: '#fff' }}>Esp: ${(session.expectedCash + (session.expectedCard || 0) + (session.expectedTransfer || 0) + (session.expectedMercadoPago || 0)).toFixed(2)} | Real: ${(session.actualCash + (session.actualCard || 0) + (session.actualTransfer || 0) + (session.actualMercadoPago || 0)).toFixed(2)}</span>
                              {(() => {
                                const totalDisc = (session.discrepancy || 0) + (session.discrepancyCard || 0) + (session.discrepancyTransfer || 0) + (session.discrepancyMercadoPago || 0);
                                return (
                                  <span style={{ 
                                    fontWeight: 800,
                                    color: totalDisc === 0 
                                      ? 'var(--color-success)' 
                                      : totalDisc > 0 
                                        ? 'var(--color-secondary)' 
                                        : 'var(--color-danger)'
                                  }}>
                                    {totalDisc >= 0 ? '+' : ''}${totalDisc.toFixed(2)}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {session.notes && (
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                            Nota: "{session.notes}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL DE DESGLOSE DE BILLETES */}
      {showBillsModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="glass-panel modal-content" style={{ 
            maxWidth: '440px', 
            width: '100%',
            background: '#ffffff', 
            color: '#1f2937', 
            padding: '24px', 
            borderRadius: '12px', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 10px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
              Calculadora de Billetes (Arqueo)
            </h3>
            
            {/* Scrollable list of bills */}
            <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '15px' }}>
                Ingresa la cantidad física de cada billete para calcular el total de efectivo:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {denominations.map(denom => {
                  const count = billCounts[denom];
                  const subtotal = (parseInt(count) || 0) * denom;
                  
                  return (
                    <div 
                      key={denom} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        background: '#f9fafb',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#374151', minWidth: '80px' }}>
                        ${denom.toLocaleString('es-AR')}
                      </span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>x</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={count}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || (parseInt(val) >= 0 && !isNaN(val))) {
                              setBillCounts(prev => ({
                                ...prev,
                                [denom]: val === '' ? '' : parseInt(val).toString()
                              }));
                            }
                          }}
                          style={{ 
                            width: '80px', 
                            padding: '6px 8px', 
                            fontSize: '0.85rem', 
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            color: '#000',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                      
                      <span style={{ fontWeight: 600, color: '#059669', minWidth: '95px', textAlign: 'right' }}>
                        ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Totales y Acciones */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#4b5563' }}>Total Calculado:</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>
                  ${getBillsTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBillsModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px', background: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyBills}
                  className="btn btn-primary"
                  style={{ flex: 1.5, padding: '10px', background: '#059669', borderColor: '#059669', color: '#ffffff' }}
                >
                  Aplicar al Arqueo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashControl;
