import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

const Configuracion = () => {
  const { apiFetch, user, fetchSystemSettings } = useAuth();
  
  // Estados para configuraciones
  const [ticketName, setTicketName] = useState('');
  const [ticketAddress, setTicketAddress] = useState('');
  const [ticketPhone, setTicketPhone] = useState('');
  const [mpToken, setMpToken] = useState('');
  const [aiProtectionsEnabled, setAiProtectionsEnabled] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
        <ShieldAlert size={48} style={{ color: 'var(--color-danger)', marginBottom: '15px' }} />
        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Acceso Restringido</h3>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Esta página de configuración está reservada exclusivamente para Administradores.
        </p>
      </div>
    );
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await apiFetch('/settings');
      if (res.ok) {
        const data = await res.json();
        setTicketName(data.ticketName || '');
        setTicketAddress(data.ticketAddress || '');
        setTicketPhone(data.ticketPhone || '');
        setMpToken(data.mercadopagoAccessToken || '');
        setAiProtectionsEnabled(data.aiProtectionsEnabled !== false);
        
        // Sincronizar también con localStorage para que el POS local se actualice de inmediato
        if (data.ticketName) localStorage.setItem('ticketName', data.ticketName);
        if (data.ticketAddress) localStorage.setItem('ticketAddress', data.ticketAddress);
        if (data.ticketPhone) localStorage.setItem('ticketPhone', data.ticketPhone);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al recuperar configuraciones');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo establecer conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiFetch('/settings', {
        method: 'POST',
        body: JSON.stringify({
          ticketName,
          ticketAddress,
          ticketPhone,
          mercadopagoAccessToken: mpToken,
          aiProtectionsEnabled
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('¡Configuraciones guardadas con éxito y sincronizadas en la base de datos!');
        
        // Guardar localmente
        localStorage.setItem('ticketName', ticketName);
        localStorage.setItem('ticketAddress', ticketAddress);
        localStorage.setItem('ticketPhone', ticketPhone);
        
        // Sincronizar de forma global e instantánea en toda la página
        if (fetchSystemSettings) {
          await fetchSystemSettings();
        }
        
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Error al guardar configuraciones');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al intentar guardar cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={36} className="spin-hover" style={{ color: 'var(--color-primary-light)' }} />
          <span>Configuración del Sistema</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Configura los datos del ticket comercial y las protecciones de seguridad perimetral.</p>
      </div>

      {errorMsg && (
        <div className="badge-danger" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="badge-success" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
          Cargando configuración desde el servidor...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          
          {/* Formulario Principal */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              Parámetros de Configuración
            </h3>

            <form onSubmit={handleSave}>
              {/* Bloque Datos del Local */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '15px' }}>Datos de Cabecera del Ticket</h4>
              
              <div className="input-group">
                <label className="input-label">Nombre del Negocio (Ticket Name)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. CEDECCO POS"
                  value={ticketName}
                  onChange={(e) => setTicketName(e.target.value)}
                  disabled={!isAdmin}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Dirección Fiscal / Local</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Av. Siempre Viva 742"
                  value={ticketAddress}
                  onChange={(e) => setTicketAddress(e.target.value)}
                  disabled={!isAdmin}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '25px' }}>
                <label className="input-label">Teléfono de Contacto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Tel: 4123-4567"
                  value={ticketPhone}
                  onChange={(e) => setTicketPhone(e.target.value)}
                  disabled={!isAdmin}
                  required
                />
              </div>

              {/* Bloque Seguridad Perimetral / IA Protections */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--color-secondary)' }} />
                Seguridad Perimetral y Filtro IA
              </h4>

              <div className="input-group" style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ textAlign: 'left', marginRight: '15px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 'bold', display: 'block' }}>Bloquear Agentes de IA y Bots</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Cuelga automáticamente conexiones originadas por scrapers, cURL, Python y agentes como GPT o Claude.
                  </span>
                </div>
                <div>
                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                    <input
                      type="checkbox"
                      checked={aiProtectionsEnabled}
                      onChange={(e) => setAiProtectionsEnabled(e.target.checked)}
                      disabled={!isAdmin}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: aiProtectionsEnabled ? 'var(--color-success)' : '#4b5563',
                      transition: '.3s',
                      borderRadius: '34px',
                      boxShadow: aiProtectionsEnabled ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: aiProtectionsEnabled ? '26px' : '4px',
                        bottom: '4px',
                        backgroundColor: 'white',
                        transition: '.3s',
                        borderRadius: '50%'
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Bloque Mercado Pago */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="https://img.icons8.com/color/48/000000/mercado-pago.png" alt="MP" style={{ width: '22px', height: '22px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                Integración de Mercado Pago (QR)
              </h4>

              <div className="input-group" style={{ marginBottom: '30px' }}>
                <label className="input-label">Production Access Token (MP Credenciales)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={isAdmin ? "Ingresa tu APP_USR-..." : "Configurado en servidor (Oculto para cajeros)"}
                  value={mpToken}
                  onChange={(e) => setMpToken(e.target.value)}
                  disabled={!isAdmin}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                  {isAdmin ? (
                    <span>
                      Obtén tus credenciales de producción en la sección de Desarrolladores de Mercado Pago. Si este campo se deja en blanco, el sistema operará automáticamente en <strong>Modo Simulación (Test QR)</strong> en la pantalla del POS para evitar errores de conexión.
                    </span>
                  ) : (
                    <span>Solo los administradores autorizados pueden modificar las credenciales del API de Mercado Pago.</span>
                  )}
                </p>
              </div>

              {isAdmin ? (
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
                  <Save size={18} />
                  <span>{saving ? 'Guardando Configuraciones...' : 'Guardar Cambios en Sistema'}</span>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                  <span>Solo lectura: no tienes permisos de administrador para modificar estas configuraciones.</span>
                </div>
              )}
            </form>
          </div>

          {/* Vista Previa del Ticket Térmico */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ background: '#ffffff', color: '#1f2937', padding: '24px', borderRadius: '12px', border: '1px solid #d1d5db', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
              <h3 style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '15px', textAlign: 'center' }}>
                Vista Previa del Ticket Comercial
              </h3>

              <div style={{ border: '1px dashed #9ca3af', padding: '16px', borderRadius: '8px', background: '#f9fafb', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <strong style={{ fontSize: '1rem', color: '#111827' }}>{ticketName || 'CEDECCO INSUMOS INFORMÁTICOS'}</strong>
                  <div style={{ color: '#4b5563', marginTop: '4px' }}>{ticketAddress || 'Av. del Puerto 1234, CABA'}</div>
                  <div style={{ color: '#4b5563' }}>{ticketPhone || 'Tel: 4567-8910'}</div>
                </div>

                <div style={{ borderBottom: '1px dashed #d1d5db', margin: '10px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#111827', marginBottom: '5px' }}>
                  <span>Artículos</span>
                  <span>Total</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', margin: '4px 0' }}>
                  <span>2 x Paracetamol 500mg</span>
                  <span>$800.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', margin: '4px 0' }}>
                  <span>1 x Ibuprofeno 400mg</span>
                  <span>$450.00</span>
                </div>

                <div style={{ borderBottom: '1px dashed #d1d5db', margin: '10px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem', color: '#111827' }}>
                  <span>TOTAL A PAGAR:</span>
                  <span>$1,250.00</span>
                </div>

                <div style={{ borderBottom: '1px dashed #d1d5db', margin: '10px 0' }}></div>

                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.7rem', marginTop: '10px' }}>
                  <div>¡Gracias por elegir Cedecco!</div>
                  <div>Conserve este comprobante de compra.</div>
                </div>
              </div>
            </div>

            {/* Panel decorativo adicional */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Información de Sincronización</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                Los datos de este ticket se almacenan en una base de datos centralizada de MongoDB, garantizando que todas las terminales POS en red impriman comprobantes idénticos de manera consistente.
              </p>
            </div>

            {/* Panel de Protecciones de Seguridad del Sistema */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--color-primary)' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} style={{ color: 'var(--color-primary-light)' }} />
                Protecciones de Seguridad POS
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
                Para blindar el sistema comercial y evitar accesos no autorizados a la base de datos de facturación, se recomienda aplicar las siguientes directivas:
              </p>
              <ul style={{ fontSize: '0.78rem', color: 'var(--color-text-main)', paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>
                  <strong>Filtro de User-Agent (Bot Guard):</strong> Activa el switch para denegar peticiones automáticas de librerías HTTP (Python, cURL) y scrapers de IA.
                </li>
                <li>
                  <strong>Cifrado SSL/TLS (HTTPS):</strong> Configura un certificado SSL en el servidor para evitar que las credenciales y ventas viajen en texto plano por la red local.
                </li>
                <li>
                  <strong>Autenticación de Dos Factores (2FA):</strong> Para cuentas de administrador, protegiendo contra el robo de contraseñas de personal.
                </li>
                <li>
                  <strong>Rate Limiting:</strong> Limita el número máximo de peticiones por minuto desde una misma IP local para mitigar ataques de denegación de servicio (DoS).
                </li>
                <li>
                  <strong>Bitácora Testigo Auditora:</strong> Mantén activa la auditoría para registrar cada alteración de stock o precios realizada por vendedores.
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Configuracion;
