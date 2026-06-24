import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import SalesHistory from './pages/SalesHistory';
import Users from './pages/Users';
import CashControl from './pages/CashControl';
import AuditLogs from './pages/AuditLogs';
import Configuracion from './pages/Configuracion';
import Activation from './pages/Activation';
import LicenseRegistry from './pages/LicenseRegistry';
import { getOrGenerateDeviceMac } from './utils/device';

import {
  TrendingUp, ShoppingCart, Package, History,
  Users as UsersIcon, LogOut, Shield, Award,
  Key, FileText, Lock, Unlock, Settings, Sun, Moon,
  ChevronLeft, ChevronRight, Menu, Cpu
} from 'lucide-react';
import { applyTheme } from './utils/theme';

// Componente para proteger rutas privadas
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>Cargando sesión de AuraStock...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Componente para proteger las rutas privadas del Creador (o de un dispositivo maestro)
const CreatorRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const isMasterDev = localStorage.getItem('aura-device-is-master') === 'true';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
      </div>
    );
  }

  const isCreator = user && (user.email === 'admin@cedecco.com' || user.role === 'admin');
  if (!user || (!isCreator && !isMasterDev)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout Principal con Sidebar
const SidebarLayout = ({ children }) => {
  const { user, logout, activeSession, systemSettings } = useAuth();
  const location = useLocation();
  const [brightness, setBrightness] = useState(() => {
    return Number(localStorage.getItem('aura-theme-brightness') || '0');
  });
  const [isCollapsed, setIsCollapsed] = useState(true); // Inicialmente cerrado (oculto)

  useEffect(() => {
    applyTheme(brightness);
  }, [brightness]);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-container" style={{ display: 'block', minHeight: '100vh', position: 'relative' }}>
      
      {/* Botón de Menú (Siempre fijo arriba a la izquierda) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'fixed',
          top: '15px',
          left: '15px',
          zIndex: 1001,
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-light)',
          color: 'var(--color-text-main)',
          cursor: 'pointer',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), var(--shadow-neon)',
          transition: 'var(--transition-smooth)',
          outline: 'none'
        }}
        title={isCollapsed ? "Mostrar Menú" : "Ocultar Menú"}
      >
        <Menu size={20} />
      </button>

      {/* Menú Desplegable Premium (Se despliega hacia abajo con efecto persiana) */}
      <aside 
        className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          top: '65px',
          left: '15px',
          width: '210px',
          height: 'auto',
          maxHeight: 'calc(100vh - 85px)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.65), var(--shadow-neon)',
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(25px)',
          border: '1px solid var(--border-light)',
          padding: '18px 12px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease, visibility 0.25s',
          transformOrigin: 'top left',
          transform: isCollapsed ? 'scaleY(0) scaleX(0.9) translateY(-20px)' : 'scaleY(1) scaleX(1) translateY(0)',
          opacity: isCollapsed ? 0 : 1,
          visibility: isCollapsed ? 'hidden' : 'visible',
          pointerEvents: isCollapsed ? 'none' : 'all'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: '8px' }}>
          
          <div>
            {/* Cabecera del Menú + Estado de la Caja Registradora */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              padding: '0 8px',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <Award size={20} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-secondary) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {systemSettings?.ticketName || 'AuraStock'}
                </span>
              </div>
              <Link to="/caja" onClick={() => setIsCollapsed(true)} style={{ textDecoration: 'none', flexShrink: 0 }} title={activeSession ? 'Caja Abierta - Click para Control de Caja' : 'Caja Cerrada - Click para Control de Caja'}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: activeSession ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: activeSession ? '1px solid var(--border-success)' : '1px solid var(--border-danger)',
                  color: activeSession ? 'var(--color-success)' : 'var(--color-danger)',
                  boxShadow: activeSession ? 'var(--shadow-neon-success)' : 'var(--shadow-neon-danger)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}>
                  {activeSession ? <Unlock size={12} /> : <Lock size={12} />}
                </div>
              </Link>
            </div>

            {/* Navegación del Sistema */}
            <nav className="sidebar-nav" style={{ gap: '3px' }}>
              <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`} onClick={() => setIsCollapsed(true)}>
                <TrendingUp size={18} />
                <span>Tablero</span>
              </Link>

              <Link to="/pos" className={`sidebar-link ${isActive('/pos') ? 'active' : ''}`} onClick={() => setIsCollapsed(true)}>
                <ShoppingCart size={18} />
                <span>Punto de Venta</span>
              </Link>

              <Link to="/caja" className={`sidebar-link ${isActive('/caja') ? 'active' : ''}`} onClick={() => setIsCollapsed(true)}>
                <Key size={18} />
                <span>Control de Caja</span>
              </Link>

              <Link to="/inventario" className={`sidebar-link ${isActive('/inventario') ? 'active' : ''}`} onClick={() => setIsCollapsed(true)}>
                <Package size={18} />
                <span>Inventario</span>
              </Link>

              <Link to="/historial" className={`sidebar-link ${isActive('/historial') ? 'active' : ''}`} onClick={() => setIsCollapsed(true)}>
                <History size={18} />
                <span>Ventas</span>
              </Link>

              {user?.role === 'admin' && (
                <>
                  <Link to="/testigo" className={`sidebar-link ${isActive('/testigo') ? 'active' : ''}`} onClick={() => setIsCollapsed(true)}>
                    <FileText size={18} />
                    <span>Bitácora Testigo</span>
                  </Link>

                  <Link to="/usuarios" className={`sidebar-link ${isActive('/usuarios') ? 'active' : ''}`} onClick={() => setIsCollapsed(true)}>
                    <UsersIcon size={18} />
                    <span>Personal</span>
                  </Link>

                  {(user?.email === 'angel.admin@store.com' || localStorage.getItem('aura-device-is-master') === 'true') && (
                    <Link to="/dispositivos" className={`sidebar-link ${isActive('/dispositivos') ? 'active' : ''}`} onClick={() => setIsCollapsed(true)}>
                      <Cpu size={18} />
                      <span>Registro</span>
                    </Link>
                  )}

                  <Link to="/configuracion" className={`sidebar-link ${isActive('/configuracion') ? 'active' : ''}`} onClick={() => setIsCollapsed(true)}>
                    <Settings size={18} />
                    <span>Configuración</span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Selector de Apariencia */}
          <div className="sidebar-appearance-row" style={{
            padding: '2px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span className="sidebar-appearance-text" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Apariencia
            </span>
            <div
              className={`theme-switch-container ${brightness === 100 ? 'light-mode' : ''}`}
              onClick={() => {
                const nextVal = brightness === 0 ? 100 : 0;
                setBrightness(nextVal);
                applyTheme(nextVal);
                localStorage.setItem('aura-theme-brightness', nextVal.toString());
              }}
              style={{ width: '56px', height: '24px' }}
            >
              <div className="theme-switch-highlight" style={{ top: '1px', bottom: '1px', left: '1px', width: 'calc(50% - 1px)' }}></div>

              <button
                className={`theme-switch-btn ${brightness === 0 ? 'active' : ''}`}
                type="button"
                style={{ position: 'relative', zIndex: 2, padding: 0 }}
                title="Modo Oscuro"
              >
                <Moon size={12} />
              </button>

              <button
                className={`theme-switch-btn ${brightness === 100 ? 'active' : ''}`}
                type="button"
                style={{ position: 'relative', zIndex: 2, padding: 0 }}
                title="Modo Claro"
              >
                <Sun size={12} />
              </button>
            </div>
          </div>

          {/* Información del Usuario Firmado y Botón Salir */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                border: '1px solid rgba(255,255,255,0.1)',
                flexShrink: 0
              }}>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden' }} className="sidebar-user-text">
                <div style={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#ffffff' }}>
                  {user?.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6rem', color: '#ffffff' }}>
                  <Shield size={8} style={{ color: '#eab308', flexShrink: 0 }} />
                  <span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#ffffff' }}>
                    {user?.role === 'admin' ? 'Administrador' : 'Vendedor'}
                  </span>
                </div>
              </div>
            </div>

            <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.8rem', marginBottom: '2px' }}>
              <LogOut size={14} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              <span className="sidebar-user-text">Cerrar Sesión</span>
            </button>
            <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--color-text-muted)', opacity: 0.5, lineHeight: '1.2' }}>
              © {new Date().getFullYear()} AuraStock • Red Virtual
            </div>
          </div>

        </div>
      </aside>

      {/* Contenido Principal (Alineado completamente a la izquierda, padding superior para evitar solapar el botón flotante) */}
      <main className="main-content" style={{ marginLeft: 0, width: '100%', padding: '75px 24px 24px 24px', transition: 'var(--transition-smooth)' }}>
        {children}
      </main>

    </div>
  );
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AppContent = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isLocked, setIsLocked] = useState(false);
  const [licenseChecked, setLicenseChecked] = useState(false);

  // Consulta de estado de licencia
  const checkLicense = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'X-Device-Mac': getOrGenerateDeviceMac()
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/devices/license-status`, { headers });
      if (res.ok) {
        const data = await res.json();
        setIsLocked(data.locked);
        if (data.isMaster !== undefined) {
          localStorage.setItem('aura-device-is-master', data.isMaster ? 'true' : 'false');
        }
      }
    } catch (err) {
      console.error('Error al verificar licencia del servidor:', err);
    } finally {
      setLicenseChecked(true);
    }
  };

  useEffect(() => {
    checkLicense();
    // Refrescar estado de licencia cada 15 segundos de forma silenciosa
    const interval = setInterval(checkLicense, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = Number(localStorage.getItem('aura-theme-brightness') || '0');
    applyTheme(saved);
  }, []);

  // Redirección y cierre de sesión si el sistema está bloqueado (excepto para la pantalla de activación, login y si es el creador o dispositivo maestro)
  useEffect(() => {
    const isCreator = user && (user.email === 'admin@cedecco.com' || user.role === 'admin');
    const isMasterDev = localStorage.getItem('aura-device-is-master') === 'true';
    if (licenseChecked && isLocked && !isCreator && !isMasterDev && location.pathname !== '/activacion' && location.pathname !== '/login') {
      logout(); // Cierra sesión automáticamente al bloquear
    }
  }, [licenseChecked, isLocked, user, location.pathname]);

  const isCreator = user && (user.email === 'admin@cedecco.com' || user.role === 'admin');
  const isMasterDev = localStorage.getItem('aura-device-is-master') === 'true';
  if (licenseChecked && isLocked && !isCreator && !isMasterDev && location.pathname !== '/activacion' && location.pathname !== '/login') {
    return <Navigate to="/activacion" replace />;
  }

  if (licenseChecked && !isLocked && location.pathname === '/activacion') {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      {/* Pantalla de Activación Pública */}
      <Route
        path="/activacion"
        element={<Activation />}
      />

      {/* Ruta Pública de Login */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Rutas Privadas Protegidas */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <Dashboard />
            </SidebarLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/pos"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <POS />
            </SidebarLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/caja"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <CashControl />
            </SidebarLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/inventario"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <Inventory />
            </SidebarLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/historial"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <SalesHistory />
            </SidebarLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/testigo"
        element={
          <PrivateRoute adminOnly={true}>
            <SidebarLayout>
              <AuditLogs />
            </SidebarLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <PrivateRoute adminOnly={true}>
            <SidebarLayout>
              <Users />
            </SidebarLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/dispositivos"
        element={
          <CreatorRoute>
            <SidebarLayout>
              <LicenseRegistry />
            </SidebarLayout>
          </CreatorRoute>
        }
      />

      <Route
        path="/configuracion"
        element={
          <PrivateRoute adminOnly={true}>
            <SidebarLayout>
              <Configuracion />
            </SidebarLayout>
          </PrivateRoute>
        }
      />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  // Mecanismos de protección del frontend y bloqueo de inspección de código
  useEffect(() => {
    // 1. Bloquear menú contextual (clic derecho)
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // 2. Bloquear atajos de teclado de desarrollo (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    const handleKeyDown = (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
      }
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // 3. Bucle anti-debugging (pausa la interfaz si abren las herramientas de desarrollo)
    const antiDebugInterval = setInterval(() => {
      (function() {
        debugger;
      }());
    }, 500);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(antiDebugInterval);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
