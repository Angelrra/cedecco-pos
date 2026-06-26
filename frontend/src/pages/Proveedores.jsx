import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Truck, Plus, Edit2, Trash2, RefreshCw, Save, Check, 
  AlertCircle, ShieldAlert, FileText, CheckCircle, Settings, Play
} from 'lucide-react';

const Proveedores = () => {
  const { apiFetch, user } = useAuth();
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal de Agregar/Editar
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cuit, setCuit] = useState('');
  
  // Configuración de API
  const [apiEnabled, setApiEnabled] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [apiMethod, setApiMethod] = useState('GET');
  const [apiAuthHeader, setApiAuthHeader] = useState('');
  const [apiAuthToken, setApiAuthToken] = useState('');
  const [apiMappingCode, setApiMappingCode] = useState('code');
  const [apiMappingName, setApiMappingName] = useState('name');
  const [apiMappingPurchasePrice, setApiMappingPurchasePrice] = useState('price');
  const [apiMappingStock, setApiMappingStock] = useState('stock');

  // Logs de sincronización
  const [syncingId, setSyncingId] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedSupplierLog, setSelectedSupplierLog] = useState('');
  const [selectedSupplierName, setSelectedSupplierName] = useState('');

  const isAdmin = user && user.role === 'admin';

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await apiFetch('/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al obtener listado de proveedores');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo establecer conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingId(supplier._id);
      setName(supplier.name || '');
      setEmail(supplier.email || '');
      setPhone(supplier.phone || '');
      setAddress(supplier.address || '');
      setCuit(supplier.cuit || '');
      
      const api = supplier.apiConfig || {};
      setApiEnabled(!!api.enabled);
      setApiUrl(api.url || '');
      setApiMethod(api.method || 'GET');
      setApiAuthHeader(api.authHeader || '');
      setApiAuthToken(api.authToken || '');
      
      const map = api.mapping || {};
      setApiMappingCode(map.code || 'code');
      setApiMappingName(map.name || 'name');
      setApiMappingPurchasePrice(map.purchasePrice || 'price');
      setApiMappingStock(map.stock || 'stock');
    } else {
      setEditingId(null);
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setCuit('');
      setApiEnabled(false);
      setApiUrl('');
      setApiMethod('GET');
      setApiAuthHeader('');
      setApiAuthToken('');
      setApiMappingCode('code');
      setApiMappingName('name');
      setApiMappingPurchasePrice('price');
      setApiMappingStock('stock');
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      cuit: cuit.trim(),
      apiConfig: {
        enabled: apiEnabled,
        url: apiUrl.trim(),
        method: apiMethod,
        authHeader: apiAuthHeader.trim(),
        authToken: apiAuthToken.trim(),
        apiType: apiEnabled ? 'rest_json' : 'none',
        mapping: {
          code: apiMappingCode.trim(),
          name: apiMappingName.trim(),
          purchasePrice: apiMappingPurchasePrice.trim(),
          stock: apiMappingStock.trim()
        }
      }
    };

    try {
      let res;
      if (editingId) {
        res = await apiFetch(`/suppliers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setSuccessMsg(`Proveedor ${editingId ? 'actualizado' : 'creado'} con éxito.`);
        setShowModal(false);
        fetchSuppliers();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al guardar proveedor.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al intentar guardar.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este proveedor? Sus productos no serán eliminados pero se desvincularán del proveedor.')) return;
    
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiFetch(`/suppliers/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSuccessMsg('Proveedor eliminado correctamente.');
        fetchSuppliers();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al eliminar proveedor.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al intentar eliminar.');
    }
  };

  const handleSync = async (id) => {
    setSyncingId(id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiFetch(`/suppliers/${id}/sync`, {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`¡Sincronización completa! ${data.message}`);
        fetchSuppliers();
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setErrorMsg(data.message || 'Error durante la sincronización por API.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al sincronizar con el proveedor.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleOpenLog = (supplier) => {
    setSelectedSupplierName(supplier.name);
    setSelectedSupplierLog(supplier.apiConfig?.syncLog || 'No se registran logs de sincronización aún.');
    setShowLogModal(true);
  };

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={36} style={{ color: 'var(--color-primary-light)' }} />
            <span>Gestión de Proveedores</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Administra tus distribuidores y configura la sincronización automática de catálogos y precios por API.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => handleOpenModal()} 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} />
            <span>Agregar Proveedor</span>
          </button>
        )}
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
          Cargando proveedores desde la base de datos...
        </div>
      ) : suppliers.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
          No hay proveedores registrados. Haz click en "Agregar Proveedor" para comenzar.
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto / CUIT</th>
                  <th>Dirección</th>
                  <th>Integración API</th>
                  <th>Última Sincro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(sup => (
                  <tr key={sup._id} style={{ opacity: sup.active ? 1 : 0.6 }}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>{sup.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>ID: {sup._id}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>CUIT: {sup.cuit || '---'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sup.email || 'Sin correo'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sup.phone || 'Sin teléfono'}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {sup.address || '---'}
                    </td>
                    <td>
                      {sup.apiConfig?.enabled ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.68rem',
                            fontWeight: 'bold',
                            width: 'fit-content'
                          }}>
                            Activa
                          </span>
                          <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                            {sup.apiConfig.url}
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--color-text-muted)',
                          border: '1px solid var(--border-light)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.68rem',
                          width: 'fit-content'
                        }}>
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-main)' }}>
                          {sup.apiConfig?.lastSync 
                            ? new Date(sup.apiConfig.lastSync).toLocaleString('es-AR')
                            : 'Nunca'
                          }
                        </span>
                        {sup.apiConfig?.enabled && (
                          <button 
                            onClick={() => handleOpenLog(sup)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-primary-light)',
                              fontSize: '0.68rem',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              textAlign: 'left',
                              padding: 0
                            }}
                          >
                            Ver reporte de sincronización
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {sup.apiConfig?.enabled && isAdmin && (
                          <button
                            onClick={() => handleSync(sup._id)}
                            disabled={syncingId === sup._id}
                            className="btn btn-secondary"
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.72rem',
                              background: 'rgba(16, 185, 129, 0.15)',
                              borderColor: 'rgba(16, 185, 129, 0.3)',
                              color: 'var(--color-success)',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Sincronizar productos ahora"
                          >
                            <RefreshCw size={12} className={syncingId === sup._id ? 'spin' : ''} />
                            <span>{syncingId === sup._id ? 'Sincronizando...' : 'Sincro'}</span>
                          </button>
                        )}
                        
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenModal(sup)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 8px' }}
                              title="Editar"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(sup._id)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 8px', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              title="Eliminar"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: AGREGAR / EDITAR PROVEEDOR */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '640px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {editingId ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                
                {/* Datos de Contacto */}
                <div className="input-group">
                  <label className="input-label">Nombre del Proveedor *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Distribuidora Tecnológica S.A."
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">CUIT (Identificación Tributaria)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    placeholder="Ej. 30-12345678-9"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej. ventas@proveedor.com"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Teléfono de Contacto</label>
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. +54 11 4321-8765"
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '5px' }}>
                <label className="input-label">Dirección Comercial</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Florida 123, Piso 4, CABA"
                />
              </div>

              {/* Sección de Sincronización API */}
              <div style={{ 
                marginTop: '25px', 
                borderTop: '1px solid var(--border-light)', 
                paddingTop: '20px',
                background: 'rgba(255,255,255,0.01)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <div>
                    <h4 style={{ fontWeight: 'bold', fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Settings size={16} style={{ color: 'var(--color-primary-light)' }} />
                      Configuración de Sincronización por API
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Configura los accesos para que AuraStock importe sus productos de forma automática.</span>
                  </div>
                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                    <input
                      type="checkbox"
                      checked={apiEnabled}
                      onChange={(e) => setApiEnabled(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: apiEnabled ? 'var(--color-success)' : '#4b5563',
                      transition: '.3s',
                      borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px', width: '18px',
                        left: apiEnabled ? '26px' : '4px',
                        bottom: '4px',
                        backgroundColor: 'white',
                        transition: '.3s',
                        borderRadius: '50%'
                      }}></span>
                    </span>
                  </label>
                </div>

                {apiEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '15px' }}>
                      <div className="input-group">
                        <label className="input-label">URL del Endpoint API *</label>
                        <input
                          type="url"
                          className="form-input"
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                          placeholder="https://proveedor.com/api/products"
                          required={apiEnabled}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Método HTTP</label>
                        <select
                          className="form-input"
                          value={apiMethod}
                          onChange={(e) => setApiMethod(e.target.value)}
                          style={{ background: 'var(--bg-main)' }}
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '15px' }}>
                      <div className="input-group">
                        <label className="input-label">Cabecera Autorización (Opcional)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={apiAuthHeader}
                          onChange={(e) => setApiAuthHeader(e.target.value)}
                          placeholder="Ej: Authorization o x-api-key"
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Token de Acceso (Opcional)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={apiAuthToken}
                          onChange={(e) => setApiAuthToken(e.target.value)}
                          placeholder="Ej: Bearer abc123xyz..."
                        />
                      </div>
                    </div>

                    {/* Mapeo de Atributos del JSON */}
                    <div>
                      <h5 style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-secondary-light)', marginBottom: '10px' }}>
                        Mapeo de Atributos JSON
                      </h5>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                        Especifica el nombre de la clave del JSON del proveedor para enlazarla con los campos de AuraStock. Para campos anidados usa puntos (ej: "precios.costo").
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.65rem' }}>Código / SKU *</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '0.75rem', padding: '6px' }}
                            value={apiMappingCode}
                            onChange={(e) => setApiMappingCode(e.target.value)}
                            required={apiEnabled}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.65rem' }}>Nombre / Título *</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '0.75rem', padding: '6px' }}
                            value={apiMappingName}
                            onChange={(e) => setApiMappingName(e.target.value)}
                            required={apiEnabled}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.65rem' }}>Precio de Costo *</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '0.75rem', padding: '6px' }}
                            value={apiMappingPurchasePrice}
                            onChange={(e) => setApiMappingPurchasePrice(e.target.value)}
                            required={apiEnabled}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.65rem' }}>Stock Disponible *</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: '0.75rem', padding: '6px' }}
                            value={apiMappingStock}
                            onChange={(e) => setApiMappingStock(e.target.value)}
                            required={apiEnabled}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '25px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} />
                  <span>Guardar Proveedor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VER REPORTE DE SINCRONIZACIÓN */}
      {showLogModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '520px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--color-primary-light)' }} />
                <span>Reporte de Sincronización</span>
              </h3>
              <button onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1rem' }}>
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Proveedor:</span>
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{selectedSupplierName}</span>
            </div>

            <div style={{ 
              background: 'rgba(0, 0, 0, 0.25)', 
              border: '1px solid var(--border-light)', 
              padding: '15px', 
              borderRadius: '8px', 
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              maxHeight: '200px',
              overflowY: 'auto',
              color: 'var(--color-text-main)'
            }}>
              {selectedSupplierLog}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowLogModal(false)} className="btn btn-secondary" style={{ padding: '8px 18px' }}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;
