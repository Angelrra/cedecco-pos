import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Server, Cpu, Wifi, Link2, Key, Shield, ShieldCheck, 
  ShieldAlert, Settings, Plus, Trash2, Edit2, AlertCircle, 
  HelpCircle, Eye, EyeOff, Save, Check, RefreshCw
} from 'lucide-react';

const LicenseRegistry = () => {
  const { apiFetch } = useAuth();
  
  // Estados de carga y datos
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [routerInfo, setRouterInfo] = useState({ ip: '', mac: '', isAuthorized: true, registeredRouters: [] });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados para Modal de Edición de Dispositivo
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editName, setEditName] = useState('');
  const [editConnType, setEditConnType] = useState('cable');
  const [editAuthorized, setEditAuthorized] = useState(true);

  // Estados para Modal de Agregar Router
  const [showRouterModal, setShowRouterModal] = useState(false);
  const [newRouterMac, setNewRouterMac] = useState('');
  const [newRouterIp, setNewRouterIp] = useState('');
  const [newRouterName, setNewRouterName] = useState('');

  // Estados para Modal de Agregar Dispositivo Manual
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDeviceSerial, setNewDeviceSerial] = useState('');
  const [newDeviceMac, setNewDeviceMac] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceConnType, setNewDeviceConnType] = useState('cable');
  const [newDeviceIp, setNewDeviceIp] = useState('');

  // Estados para Modal de Registrar por Código de Solicitud (Hex)
  const [showAddCodeModal, setShowAddCodeModal] = useState(false);
  const [newDeviceRequestCode, setNewDeviceRequestCode] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      // 1. Obtener dispositivos de red y routers
      const netRes = await apiFetch('/devices');
      if (netRes.ok) {
        const netData = await netRes.json();
        setDevices(netData.devices || []);
        setRouterInfo(netData.router || { ip: '', mac: '', isAuthorized: true, registeredRouters: [] });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al conectar con la API de red.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Refrescar periódicamente toda la información de red, dispositivos cada 5 segundos
    const interval = setInterval(async () => {
      try {
        // 1. Refrescar dispositivos y routers
        const netRes = await apiFetch('/devices');
        if (netRes.ok) {
          const netData = await netRes.json();
          setDevices(netData.devices || []);
          setRouterInfo(netData.router || { ip: '', mac: '', isAuthorized: true, registeredRouters: [] });
        }
      } catch (err) {
        console.error('Error al refrescar datos en segundo plano:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Guardar cambios del dispositivo editado
  const handleSaveDevice = async (e) => {
    e.preventDefault();
    if (!editingDevice) return;

    try {
      const res = await apiFetch(`/devices/${editingDevice._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          connectionType: editConnType,
          isAuthorized: editAuthorized
        })
      });

      if (res.ok) {
        setSuccessMsg('Dispositivo actualizado con éxito.');
        setShowEditModal(false);
        setEditingDevice(null);
        loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al guardar el dispositivo.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al actualizar el dispositivo.');
    }
  };

  // Agregar un router a la lista autorizada
  const handleAddRouter = async (e) => {
    e.preventDefault();
    if (!newRouterMac.trim()) return;

    try {
      const res = await apiFetch('/devices/routers', {
        method: 'POST',
        body: JSON.stringify({
          mac: newRouterMac.trim(),
          ip: newRouterIp.trim(),
          name: newRouterName.trim() || 'Router Red Local'
        })
      });

      if (res.ok) {
        setSuccessMsg('Router autorizado agregado correctamente.');
        setShowRouterModal(false);
        setNewRouterMac('');
        setNewRouterIp('');
        setNewRouterName('');
        loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al agregar el router.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al agregar el router.');
    }
  };

  // Agregar un dispositivo manualmente
  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!newDeviceSerial.trim() || !newDeviceMac.trim() || !newDeviceName.trim()) return;

    try {
      const res = await apiFetch('/devices', {
        method: 'POST',
        body: JSON.stringify({
          serialNumber: newDeviceSerial.trim(),
          mac: newDeviceMac.trim(),
          name: newDeviceName.trim(),
          connectionType: newDeviceConnType,
          ip: newDeviceIp.trim()
        })
      });

      if (res.ok) {
        setSuccessMsg('Dispositivo registrado manualmente con éxito.');
        setShowAddDeviceModal(false);
        setNewDeviceSerial('');
        setNewDeviceMac('');
        setNewDeviceName('');
        setNewDeviceConnType('cable');
        setNewDeviceIp('');
        loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al registrar el dispositivo.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al registrar el dispositivo.');
    }
  };

  // Registrar un dispositivo por código de solicitud
  const handleAddDeviceByCode = async (e) => {
    e.preventDefault();
    if (!newDeviceRequestCode.trim() || !newDeviceName.trim()) return;

    try {
      const res = await apiFetch('/devices', {
        method: 'POST',
        body: JSON.stringify({
          requestCode: newDeviceRequestCode.trim(),
          name: newDeviceName.trim(),
          connectionType: newDeviceConnType,
          ip: newDeviceIp.trim()
        })
      });

      if (res.ok) {
        setSuccessMsg('Dispositivo registrado por código con éxito.');
        setShowAddCodeModal(false);
        setNewDeviceRequestCode('');
        setNewDeviceName('');
        setNewDeviceConnType('cable');
        setNewDeviceIp('');
        loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al registrar el dispositivo.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al registrar el dispositivo.');
    }
  };

  // Quitar/Desautorizar un router
  const handleRemoveRouter = async (mac) => {
    if (!window.confirm('¿Está seguro de que desea desautorizar este router? Los dispositivos conectados a él podrían registrar problemas.')) return;

    try {
      const res = await apiFetch(`/devices/routers/${encodeURIComponent(mac)}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccessMsg('Router desautorizado.');
        loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al desautorizar router.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al desautorizar router.');
    }
  };

  // Habilitar / Inhabilitar dispositivo POS
  const toggleDeviceAuth = async (device) => {
    try {
      const res = await apiFetch(`/devices/${device._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isAuthorized: !device.isAuthorized
        })
      });

      if (res.ok) {
        setSuccessMsg(`Equipo ${!device.isAuthorized ? 'autorizado' : 'desautorizado'} con éxito.`);
        loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al cambiar autorización.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al modificar autorización.');
    }
  };

  if (loading && devices.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
        Cargando auditoría de equipos y licencias de red...
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={36} className="icon-pulse" style={{ color: 'var(--color-primary-light)' }} />
            <span>Auditoría de Red y Terminales POS</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Lista de terminales activas de facturación detectadas y administración de routers autorizados.</p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="btn btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refrescar Red</span>
        </button>
      </div>

      {errorMsg && (
        <div className="badge-danger" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="badge-success" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}



      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', alignItems: 'start', marginBottom: '25px' }}>
        
        {/* PANEL IZQUIERDO: Dispositivos de Red (POS y Mocks) */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '15px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Cpu style={{ color: 'var(--color-primary-light)' }} />
              <span>Equipos del Punto de Venta Autorizados</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-success" style={{ marginRight: '4px' }}>{devices.length} Registrados</span>
              <button 
                onClick={() => setShowAddCodeModal(true)} 
                className="btn btn-primary" 
                style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Key size={12} />
                <span>Poner Código</span>
              </button>
              <button 
                onClick={() => setShowAddDeviceModal(true)} 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }}
              >
                <Plus size={12} />
                <span>Agregar Equipo</span>
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '15px', lineHeight: '1.4' }}>
            A continuación se listan las terminales conectadas. Cada dispositivo tiene asignado un número de serie único del sistema. Solo los equipos autorizados pueden sincronizarse y operar la caja registradora.
          </p>

          <div className="table-container" style={{ border: 'none', maxHeight: '500px', overflowY: 'auto' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nº Serie Único</th>
                  <th>MAC Address</th>
                  <th>IP Local</th>
                  <th>Nombre del Equipo</th>
                  <th>Red</th>
                  <th>Usuario en Vivo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(dev => (
                  <tr key={dev._id} style={{ opacity: dev.isAuthorized ? 1 : 0.6 }}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                      {dev.serialNumber}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {dev.mac.toUpperCase()}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {dev.ip || '---'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{dev.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {dev.os || 'Desconocido'} • {dev.browser || 'Desconocido'}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {dev.connectionType === 'wifi' ? (
                          <><Wifi size={13} style={{ color: '#06b6d4' }} /> Inalámbrica</>
                        ) : (
                          <><Link2 size={13} style={{ color: '#10b981' }} /> Local</>
                        )}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        if (dev.activeUser) {
                          const isLiveNow = dev.isLive;
                          return (
                            <div style={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              gap: '2px',
                              background: isLiveNow ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                              border: isLiveNow ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-light)',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              textAlign: 'left'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 'bold', color: isLiveNow ? '#10b981' : 'var(--color-text-main)' }}>
                                <span style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: isLiveNow ? '#10b981' : '#9ca3af',
                                  boxShadow: isLiveNow ? '0 0 8px #10b981' : 'none'
                                }}></span>
                                {dev.activeUser.name}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', paddingLeft: '12px' }}>
                                {dev.activeUser.email}
                              </div>
                              <div style={{ fontSize: '0.62rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-secondary-light)', paddingLeft: '12px', marginTop: '1px' }}>
                                {dev.activeUser.role === 'admin' ? 'Administrador' : 'Vendedor'}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', opacity: 0.5 }}>
                            Sin usuario activo
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setEditingDevice(dev);
                            setEditName(dev.name);
                            setEditConnType(dev.connectionType);
                            setEditAuthorized(dev.isAuthorized);
                            setShowEditModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Editar Equipo"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => toggleDeviceAuth(dev)}
                          className={`btn ${dev.isAuthorized ? 'btn-secondary' : 'btn-primary'}`}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            background: dev.isAuthorized ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            borderColor: dev.isAuthorized ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                            color: dev.isAuthorized ? 'var(--color-danger)' : 'var(--color-success)',
                            fontWeight: 'bold'
                          }}
                          title={dev.isAuthorized ? 'Desautorizar' : 'Autorizar'}
                        >
                          {dev.isAuthorized ? 'Bajar' : 'Autorizar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL DERECHO: Protecciones e Información de Red */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. SECCIÓN: Protecciones y Auditoría en Vivo */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0' }}>
              <Shield size={18} style={{ color: 'var(--color-secondary)' }} />
              <span>Protecciones y Seguridad Activa</span>
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
              <ShieldCheck size={28} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', color: 'var(--color-success)' }}>Seguimiento: ACTIVO</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Monitoreo de terminales conectadas en tiempo real.</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              <p style={{ margin: 0 }}>
                El sistema detecta automáticamente la MAC física o virtual de cada navegador y rastrea:
              </p>
              <ul style={{ margin: 0, paddingLeft: '15px', color: 'var(--color-text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Dirección IP y MAC:</strong> Delimitando el acceso a la LAN del local comercial.</li>
                <li><strong>Identificador de OS/Browser:</strong> Extraído a través del User-Agent de la terminal.</li>
                <li><strong>Usuario en Vivo:</strong> Cuenta activa e interacciones detectadas en los últimos 15 segundos.</li>
              </ul>
            </div>
          </div>

          {/* 2. SECCIÓN: Puerta de Enlace / Routers */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Link2 size={18} style={{ color: 'var(--color-primary-light)' }} />
                <span>Control de Routers de Red Local</span>
              </h3>
              <button 
                onClick={() => setShowRouterModal(true)} 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }}
              >
                <Plus size={12} />
                <span>Autorizar</span>
              </button>
            </div>

            {/* Router Detectado Actualmente */}
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              border: `1px solid ${routerInfo.isAuthorized ? 'var(--border-light)' : 'var(--border-danger)'}`,
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {routerInfo.isAuthorized ? (
                <ShieldCheck size={24} style={{ color: 'var(--color-success)' }} />
              ) : (
                <ShieldAlert size={24} style={{ color: 'var(--color-danger)' }} />
              )}
              
              <div style={{ textAlign: 'left', flexGrow: 1 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Router Detectado en Red:
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                  Gateway: {routerInfo.ip || '192.168.0.1'} | MAC: {routerInfo.mac ? routerInfo.mac.toUpperCase() : '---'}
                </span>
                <span style={{ fontSize: '0.7rem', display: 'block', color: routerInfo.isAuthorized ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600, marginTop: '2px' }}>
                  {routerInfo.isAuthorized ? '✓ Router Autorizado y Seguro' : '⚠ Router No Registrado / Conexión Externa'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
              Para evitar que se replique o ejecute la base de datos de facturación en redes de otros locales comerciales, puede agregar o quitar routers autorizados de esta lista:
            </p>

            {/* Listado de Routers */}
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {routerInfo.registeredRouters && routerInfo.registeredRouters.length > 0 ? (
                routerInfo.registeredRouters.map(rt => (
                  <div key={rt._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    opacity: rt.isAuthorized ? 1 : 0.5
                  }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block' }}>{rt.name}</span>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                        IP: {rt.ip} | MAC: {rt.mac.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${rt.isAuthorized ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem', padding: '2px 4px' }}>
                        {rt.isAuthorized ? 'Ok' : 'Bloqueado'}
                      </span>
                      {rt.isAuthorized && (
                        <button
                          onClick={() => handleRemoveRouter(rt.mac)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '2px' }}
                          title="Desautorizar Router"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '10px' }}>
                  No hay routers registrados explícitamente en la lista.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* MODAL 1: EDITAR DISPOSITIVO */}
      {showEditModal && editingDevice && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Configurar Dispositivo POS</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDevice}>
              <div className="input-group">
                <label className="input-label">Número de Serie (Solo Lectura)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingDevice.serialNumber}
                  disabled
                  style={{ fontFamily: 'monospace', opacity: 0.6 }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Nombre del Equipo / Terminal *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ej: Computadora Caja Central"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Tipo de Red / Conexión</label>
                <select
                  className="form-input"
                  value={editConnType}
                  onChange={(e) => setEditConnType(e.target.value)}
                  style={{ background: 'var(--bg-main)' }}
                >
                  <option value="cable">Local (Cableado de Red)</option>
                  <option value="wifi">Inalámbrica (Wi-Fi local)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '25px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px' }}>
                <input
                  type="checkbox"
                  id="chkAuth"
                  checked={editAuthorized}
                  onChange={(e) => setEditAuthorized(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="chkAuth" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                  Autorizar este equipo a facturar en el Punto de Venta
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR / AUTORIZAR ROUTER NUEVO */}
      {showRouterModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Autorizar Router de Red</h3>
              <button onClick={() => setShowRouterModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRouter}>
              <div className="input-group">
                <label className="input-label">Dirección MAC del Router *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 80:D0:4A:0F:72:48 o 80-D0-4A-0F-72-48"
                  value={newRouterMac}
                  onChange={(e) => setNewRouterMac(e.target.value)}
                  required
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Dirección IP del Router (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 192.168.0.1"
                  value={newRouterIp}
                  onChange={(e) => setNewRouterIp(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '25px' }}>
                <label className="input-label">Nombre del Router (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Router Linksys Góndolas"
                  value={newRouterName}
                  onChange={(e) => setNewRouterName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowRouterModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} />
                  <span>Autorizar Router</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 3: REGISTRAR EQUIPO NUEVO */}
      {showAddDeviceModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Agregar Nuevo Equipo Manual</h3>
              <button onClick={() => setShowAddDeviceModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDevice}>
              <div className="input-group">
                <label className="input-label">Número de Serie del Equipo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: DEV-XXXX-XXXX-XXXX"
                  value={newDeviceSerial}
                  onChange={(e) => setNewDeviceSerial(e.target.value.toUpperCase())}
                  required
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Dirección MAC del Equipo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: F8:2D:7C:B0:CA:FF o F8-2D-7C-B0-CA-FF"
                  value={newDeviceMac}
                  onChange={(e) => setNewDeviceMac(e.target.value)}
                  required
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Nombre del Equipo / Terminal *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Celular iPhone XR Dueño"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Dirección IP del Equipo (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 192.168.0.50"
                  value={newDeviceIp}
                  onChange={(e) => setNewDeviceIp(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '25px' }}>
                <label className="input-label">Tipo de Red / Conexión</label>
                <select
                  className="form-input"
                  value={newDeviceConnType}
                  onChange={(e) => setNewDeviceConnType(e.target.value)}
                  style={{ background: 'var(--bg-main)' }}
                >
                  <option value="cable">Local (Cableado de Red)</option>
                  <option value="wifi">Inalámbrica (Wi-Fi local)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddDeviceModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} />
                  <span>Agregar Equipo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 4: REGISTRAR POR CÓDIGO DE SOLICITUD */}
      {showAddCodeModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Registrar Equipo por Código</h3>
              <button onClick={() => setShowAddCodeModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDeviceByCode}>
              <div className="input-group">
                <label className="input-label">Código de Solicitud del Equipo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Pegue el código hexadecimal aquí"
                  value={newDeviceRequestCode}
                  onChange={(e) => setNewDeviceRequestCode(e.target.value.toUpperCase())}
                  required
                  style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Nombre del Equipo / Terminal *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Celular iPhone XR Dueño"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Dirección IP (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 192.168.0.50"
                  value={newDeviceIp}
                  onChange={(e) => setNewDeviceIp(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '25px' }}>
                <label className="input-label">Tipo de Red / Conexión</label>
                <select
                  className="form-input"
                  value={newDeviceConnType}
                  onChange={(e) => setNewDeviceConnType(e.target.value)}
                  style={{ background: 'var(--bg-main)' }}
                >
                  <option value="wifi">Inalámbrica (Wi-Fi local)</option>
                  <option value="cable">Local (Cableado de Red)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddCodeModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} />
                  <span>Registrar por Código</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LicenseRegistry;
