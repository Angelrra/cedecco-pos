import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, ShoppingBag, AlertTriangle, 
  Calendar, Award, DollarSign, RefreshCw 
} from 'lucide-react';

const Dashboard = () => {
  const { apiFetch, systemSettings } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setError('');
      const res = await apiFetch('/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        throw new Error('No se pudieron obtener las estadísticas');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Cargando estadísticas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
        <h3 style={{ color: 'var(--color-danger)', marginBottom: '15px' }}>Error al cargar el panel</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchStats} className="btn btn-primary">Reintentar</button>
      </div>
    );
  }

  const { kpis, topProducts, chartData, lowStockAlerts, expiringAlerts } = stats;

  // Encontrar el valor máximo en los últimos 7 días para escalar el gráfico SVG
  const maxSalesVal = Math.max(...chartData.map(d => d.total), 100);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Panel de Control</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Bienvenido a {systemSettings?.ticketName || 'AuraStock'}. Resumen de rendimiento de consumibles.</p>
        </div>
        <button 
          onClick={handleRefresh} 
          className="btn btn-secondary" 
          disabled={refreshing}
          style={{ padding: '10px 14px' }}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <div className="glass-panel kpi-card">
          <div>
            <span className="input-label">Ventas de Hoy</span>
            <div className="kpi-val">${kpis.revenueToday.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {kpis.transactionsToday} transacciones
            </p>
          </div>
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary-light)' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div>
            <span className="input-label">Ingresos Totales</span>
            <div className="kpi-val">${kpis.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Histórico facturado</p>
          </div>
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-secondary)' }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div>
            <span className="input-label">Alertas de Stock</span>
            <div className="kpi-val" style={{ color: kpis.lowStockCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {kpis.lowStockCount}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Productos bajos de stock</p>
          </div>
          <div className="kpi-icon-wrapper" style={{ 
            background: kpis.lowStockCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
            color: kpis.lowStockCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' 
          }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div>
            <span className="input-label">Vencidos</span>
            <div className="kpi-val" style={{ color: kpis.expiredCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {kpis.expiredCount}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Retirar de góndolas</p>
          </div>
          <div className="kpi-icon-wrapper" style={{ 
            background: kpis.expiredCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
            color: kpis.expiredCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' 
          }}>
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        
        {/* Gráfico de Ventas Semanales */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Tendencia de Ventas (Últimos 7 Días)</h3>
          
          <div style={{ flexGrow: 1, position: 'relative', minHeight: '220px', marginTop: '10px' }}>
            <svg style={{ width: '100%', height: '100%', minHeight: '220px' }} viewBox="0 0 600 200">
              {/* Grilla horizontal */}
              <line x1="40" y1="20" x2="580" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1="40" y1="75" x2="580" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1="40" y1="130" x2="580" y2="130" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1="40" y1="170" x2="580" y2="170" stroke="rgba(255,255,255,0.1)" />

              {/* Dibujo de barras con gradiente y efecto brillo */}
              {chartData.map((d, index) => {
                const width = 45;
                const gap = 30;
                const x = 55 + index * (width + gap);
                // Escalar altura
                const height = maxSalesVal > 0 ? (d.total / maxSalesVal) * 140 : 0;
                const y = 170 - height;
                
                return (
                  <g key={index}>
                    {/* Barra */}
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={Math.max(height, 2)}
                      rx="4"
                      fill="url(#chartGrad)"
                      opacity="0.85"
                      style={{ transition: 'all 0.5s ease' }}
                    />
                    
                    {/* Resplandor superior en barras altas */}
                    {height > 10 && (
                      <circle cx={x + width/2} cy={y} r="4" fill="var(--color-secondary)" filter="drop-shadow(0 0 4px var(--color-secondary))" />
                    )}

                    {/* Texto del valor de la barra */}
                    <text
                      x={x + width / 2}
                      y={y - 8}
                      fill="var(--color-text-main)"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {d.total > 0 ? `$${Math.round(d.total)}` : ''}
                    </text>

                    {/* Nombre del día */}
                    <text
                      x={x + width / 2}
                      y="190"
                      fill="var(--color-text-muted)"
                      fontSize="10"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {d.dayName}
                    </text>
                  </g>
                );
              })}

              {/* Definición del gradiente */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-secondary)" />
                  <stop offset="50%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Top Productos más vendidos */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award style={{ color: 'var(--color-secondary)' }} size={20} />
            <span>Más Vendidos</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {topProducts.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                Aún no hay ventas registradas.
              </p>
            ) : (
              topProducts.map((p, idx) => {
                const maxQty = topProducts[0]?.totalQty || 1;
                const percentage = (p.totalQty / maxQty) * 100;
                
                return (
                  <div key={p._id || idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{p.totalQty} unds.</span>
                    </div>
                    {/* Barra de progreso */}
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                        borderRadius: '10px'
                      }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Alertas de Stock y Vencimiento */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Alertas de Stock */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} />
            <span>Alerta de Stock Crítico</span>
          </h3>

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock Actual</th>
                  <th>Stock Mín</th>
                </tr>
              </thead>
              <tbody>
                {lowStockAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      ¡Excelente! Todo el stock está en niveles óptimos.
                    </td>
                  </tr>
                ) : (
                  lowStockAlerts.map(prod => (
                    <tr key={prod._id}>
                      <td style={{ fontWeight: 600 }}>{prod.name}</td>
                      <td>{prod.category}</td>
                      <td>
                        <span className={`badge ${prod.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {prod.stock} unidades
                        </span>
                      </td>
                      <td>{prod.minStock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas de Vencimiento */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} />
            <span>Vencimientos Próximos</span>
          </h3>

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Fecha Vencimiento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {expiringAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No hay productos consumibles por vencer en los próximos 30 días.
                    </td>
                  </tr>
                ) : (
                  expiringAlerts.map(prod => {
                    const daysRemaining = Math.ceil((new Date(prod.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
                    const isExpired = daysRemaining < 0;

                    return (
                      <tr key={prod._id}>
                        <td style={{ fontWeight: 600 }}>{prod.name}</td>
                        <td>{new Date(prod.expirationDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${isExpired ? 'badge-danger' : 'badge-warning'}`}>
                            {isExpired ? 'Vencido' : `Vence en ${daysRemaining} días`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
