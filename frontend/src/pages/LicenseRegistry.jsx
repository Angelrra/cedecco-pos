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
  const [licenseInfo, setLicenseInfo] = useState({ locked: false, mac: '', serial: '', isMaster: false });
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activationRequests, setActivationRequests] = useState([]);

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
      
      // 1. Obtener estado de licencia del servidor
      const licRes = await apiFetch('/devices/license-status');
      if (licRes.ok) {
        const licData = await licRes.json();
        setLicenseInfo(licData);
      }

      // 2. Obtener dispositivos de red y routers
      const netRes = await apiFetch('/devices');
      if (netRes.ok) {
        const netData = await netRes.json();
        setDevices(netData.devices || []);
        setRouterInfo(netData.router || { ip: '', mac: '', isAuthorized: true, registeredRouters: [] });
      }

      // 3. Obtener solicitudes de activación pendientes
      const reqRes = await apiFetch('/devices/activation-requests/pending');
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setActivationRequests(reqData.requests || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al conectar con la API de red y licenciamiento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Refrescar periódicamente toda la información de red, dispositivos y solicitudes cada 5 segundos
    const interval = setInterval(async () => {
      try {
        // 1. Refrescar dispositivos y routers
        const netRes = await apiFetch('/devices');
        if (netRes.ok) {
          const netData = await netRes.json();
          setDevices(netData.devices || []);
          setRouterInfo(netData.router || { ip: '', mac: '', isAuthorized: true, registeredRouters: [] });
        }

        // 2. Refrescar solicitudes pendientes
        const reqRes = await apiFetch('/devices/activation-requests/pending');
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setActivationRequests(reqData.requests || []);
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
        setErrorMsg(data.message || 'Error al desautorizar el router.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al desautorizar el router.');
    }
  };

  // Aprobar o rechazar solicitud de activación (Sin prompts bloqueadores para compatibilidad con iOS PWA)
  const handleActionRequest = async (id, action, requestCode = '', defaultName = '') => {
    if (action === 'approve') {
      const name = defaultName ? defaultName.trim() : 'Terminal POS';
      const connectionType = 'wifi';
      
      try {
        const res = await apiFetch(`/devices/activation-requests/${id}/action`, {
          method: 'POST',
          body: JSON.stringify({
            action: 'approve',
            name,
            connectionType
          })
        });
        
        if (res.ok) {
          setSuccessMsg('Equipo activado y registrado con éxito.');
          loadData();
          setTimeout(() => setSuccessMsg(''), 3000);
        } else {
          const data = await res.json();
          setErrorMsg(data.message || 'Error al aprobar la activación.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Error de red al procesar la solicitud.');
      }
    } else {
      try {
        const res = await apiFetch(`/devices/activation-requests/${id}/action`, {
          method: 'POST',
          body: JSON.stringify({
            action: 'reject'
          })
        });
        
        if (res.ok) {
          setSuccessMsg('Solicitud rechazada.');
          loadData();
          setTimeout(() => setSuccessMsg(''), 3000);
        } else {
          const data = await res.json();
          setErrorMsg(data.message || 'Error al rechazar la solicitud.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Error de red al procesar la solicitud.');
      }
    }
  };

  // Cambiar rápidamente la autorización de un dispositivo
  const toggleDeviceAuth = async (device) => {
    try {
      const res = await apiFetch(`/devices/${device._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isAuthorized: !device.isAuthorized
        })
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
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
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Registro de Licencias y Dispositivos</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Administración de claves de equipos y seguridad física de red local.</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} />
          <span>Escanear Red / Refrescar</span>
        </button>
      </div>

      {errorMsg && (
        <div className="badge-danger" style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="badge-success" style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* PANEL DE SOLICITUDES DE ACTIVACIÓN PENDIENTES */}
      {activationRequests && activationRequests.length > 0 && (
        <div className="glass-panel" style={{
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          boxShadow: '0 8px 32px 0 rgba(168, 85, 247, 0.1)'
        }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0', color: 'var(--color-secondary)' }}>
            <ShieldAlert style={{ color: 'var(--color-secondary)' }} />
            <span>Solicitudes de Activación Pendientes ({activationRequests.length})</span>
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
            Los siguientes dispositivos remotos han solicitado permiso para operar. Al aprobar, se convertirá su código hexadecimal a la MAC Address física original y se registrará automáticamente.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activationRequests.map(req => (
              <div key={req._id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border-light)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>{req.deviceName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    IP: {req.ip || '---'} | Código Hex: <span style={{ fontFamily: 'monospace', color: 'var(--color-secondary)', fontWeight: 'bold' }}>{req.requestCode}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleActionRequest(req._id, 'approve', req.requestCode, req.deviceName)}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.4)', color: 'white', fontWeight: 600 }}
                  >
                    Aprobar y Activar
                  </button>
                  <button
                    onClick={() => handleActionRequest(req._id, 'reject')}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)', fontWeight: 600 }}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                        if (dev.isLive && dev.activeUser) {
                          return (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '4px 8px',
                              borderRadius: '12px'
                            }} title={dev.activeUser.email}>
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                boxShadow: '0 0 8px #10b981'
                              }}></span>
                              {dev.activeUser.name}
                            </span>
                          );
                        }
                        return (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', opacity: 0.6 }}>
                            Inactivo
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

        {/* PANEL DERECHO: Estado de Licencia de la Máquina y Router MAC */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. SECCIÓN: Licencia y Firma del Servidor */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0' }}>
              <Server size={18} style={{ color: 'var(--color-secondary)' }} />
              <span>Licencia Física del Servidor</span>
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
              <ShieldCheck size={28} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', color: 'var(--color-success)' }}>Estado: ACTIVO</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>La firma física del hardware coincide con el registro.</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>MAC Servidor:</span>
                <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{licenseInfo.mac}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Clave Activación:</span>
                <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--color-secondary)' }}>{licenseInfo.serial || '---'}</span>
              </div>

              {/* Botón para Revelar Serial Maestro en Archivo Oculto */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Serial Maestro (Creador):
                  <HelpCircle size={12} style={{ cursor: 'help', opacity: 0.7 }} title="Este serial permite activar y desbloquear cualquier copia del sistema en cualquier red o computadora de forma instantánea." />
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                    {showMasterKey ? 'AST-MASTER-KEY-CREATOR-9999' : '•••••••••••••••••••••••••'}
                  </span>
                  <button 
                    onClick={() => setShowMasterKey(!showMasterKey)} 
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    {showMasterKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
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
