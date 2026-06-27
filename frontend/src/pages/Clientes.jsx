import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search, Plus, Edit2, Trash2, X, AlertCircle, RefreshCw, User, Mail, Phone, MapPin, FileText, History, DollarSign, Calendar
} from 'lucide-react';

const Clientes = () => {
  const { apiFetch, user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [priceLists, setPriceLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Estados del Formulario (Crear/Editar)
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cuit, setCuit] = useState('');
  const [address, setAddress] = useState('');
  const [defaultPriceListIndex, setDefaultPriceListIndex] = useState(1);
  const [notes, setNotes] = useState('');

  // Estados del Historial de Ventas
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isAdmin = user && user.role === 'admin';

  // Obtener todos los clientes
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await apiFetch(`/customers?search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al obtener clientes');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Obtener listas de precios para el selector
  const fetchPriceLists = async () => {
    try {
      const res = await apiFetch('/pricelists');
      if (res.ok) {
        const data = await res.json();
        setPriceLists(data);
      }
    } catch (err) {
      console.error('Error al obtener listas de precios:', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery]);

  useEffect(() => {
    fetchPriceLists();
  }, []);

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingId(customer._id);
      setName(customer.name || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setCuit(customer.cuit || '');
      setAddress(customer.address || '');
      setDefaultPriceListIndex(customer.defaultPriceListIndex || 1);
      setNotes(customer.notes || '');
    } else {
      setEditingId(null);
      setName('');
      setEmail('');
      setPhone('');
      setCuit('');
      setAddress('');
      setDefaultPriceListIndex(1);
      setNotes('');
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre es obligatorio.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        name: name.trim(),
        email,
        phone,
        cuit,
        address,
        defaultPriceListIndex,
        notes
      };

      const url = editingId ? `/customers/${editingId}` : '/customers';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        fetchCustomers();
      } else {
        setErrorMsg(data.message || 'Error al guardar el cliente');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocurrió un error al intentar conectarse al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este cliente?')) return;

    try {
      setLoading(true);
      const res = await apiFetch(`/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCustomers();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al eliminar cliente');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al intentar eliminar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setPurchaseHistory([]);

    try {
      const res = await apiFetch(`/customers/${customer._id}/sales`);
      if (res.ok) {
        const data = await res.json();
        setPurchaseHistory(data);
      } else {
        console.error('Error al obtener historial de compras');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-main)', color: 'var(--color-text-main)' }}>
      {/* Encabezado */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            Administración de Clientes
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            Gestiona la base de datos de tus compradores, asóciales listas de precios y consulta su historial de compras en tiempo real.
          </p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontWeight: 'bold',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-neon)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} />
            Nuevo Cliente
          </button>
        )}
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--color-danger)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.88rem' }}>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Buscador */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Buscar cliente por nombre, CUIT, email o teléfono..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'inherit',
            width: '100%',
            fontSize: '0.9rem'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabla de Clientes */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>CUIT / Contacto</th>
                <th>Dirección</th>
                <th>Lista Predeterminada</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
                    <div>Cargando base de datos de clientes...</div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    No se encontraron clientes activos.
                  </td>
                </tr>
              ) : (
                customers.map(cust => {
                  const listConfig = priceLists.find(l => l.index === cust.defaultPriceListIndex);
                  return (
                    <tr key={cust._id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>{cust.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>ID: {cust._id}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>CUIT: {cust.cuit || '---'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cust.email || 'Sin correo'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cust.phone || 'Sin teléfono'}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {cust.address || '---'}
                      </td>
                      <td>
                        {listConfig ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            border: `1.5px solid ${listConfig.color}`,
                            background: `${listConfig.color}22`,
                            color: listConfig.color,
                            padding: '3px 10px',
                            borderRadius: '16px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            L{listConfig.index} · {listConfig.name} (+{listConfig.markup}%)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Lista 1</span>
                        )}
                      </td>
                      <td style={{
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.78rem',
                        color: 'var(--color-text-muted)'
                      }} title={cust.notes}>
                        {cust.notes || '---'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleViewHistory(cust)}
                            className="btn btn-secondary"
                            title="Historial de compras"
                            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                          >
                            <History size={13} />
                            <span>Compras</span>
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenModal(cust)}
                                className="btn btn-secondary"
                                title="Editar cliente"
                                style={{ padding: '6px' }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(cust._id)}
                                className="btn btn-secondary"
                                title="Eliminar cliente"
                                style={{ padding: '6px', color: 'var(--color-danger)' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación / Edición */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            {/* Header del Modal */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Nombre del Cliente *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '34px', width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Teléfono
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: 1122334455"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ paddingLeft: '34px', width: '100%' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    CUIT / CUIL / DNI
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: 20-33444555-9"
                      value={cuit}
                      onChange={(e) => setCuit(e.target.value)}
                      style={{ paddingLeft: '34px', width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Correo Electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Ej: juan.perez@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '34px', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Dirección Comercial o Particular
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Av. Rivadavia 4567, CABA"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ paddingLeft: '34px', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Lista de Precios Predeterminada
                </label>
                <select
                  value={defaultPriceListIndex}
                  onChange={(e) => setDefaultPriceListIndex(Number(e.target.value))}
                  className="form-input"
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  {priceLists.map(list => (
                    <option key={list.index} value={list.index}>
                      Lista {list.index} - {list.name} (+{list.markup}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Notas y Observaciones
                </label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Ingrese observaciones sobre el cliente (ej: requiere factura A, límite de cuenta corriente, etc.)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{
                marginTop: '10px',
                borderTop: '1px solid var(--border-light)',
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '8px 20px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                    border: 'none',
                    boxShadow: 'var(--shadow-neon)'
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal del Historial de Compras */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Historial de Compras
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Cliente: <strong style={{ color: 'white' }}>{selectedCustomer?.name}</strong>
                </span>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
                  <div>Obteniendo transacciones...</div>
                </div>
              ) : purchaseHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  El cliente no ha registrado compras en el sistema aún.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {purchaseHistory.map(sale => (
                    <div
                      key={sale._id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      {/* Fila principal */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontFamily: 'monospace',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-light)'
                          }}>
                            # {sale._id.toString().substring(18).toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {new Date(sale.createdAt).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-success)' }}>
                          ${sale.total.toFixed(2)}
                        </div>
                      </div>

                      {/* Detalles secundarios */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '8px',
                        fontSize: '0.78rem',
                        color: 'var(--color-text-muted)',
                        borderTop: '1px dashed var(--border-light)',
                        paddingTop: '8px',
                        marginTop: '4px'
                      }}>
                        <div>
                          Cajero: <span style={{ color: 'var(--color-text-main)' }}>{sale.user?.name || 'Sistema'}</span>
                        </div>
                        <div>
                          Pago: <span style={{ color: 'var(--color-text-main)', textTransform: 'capitalize' }}>{sale.paymentMethod}</span>
                        </div>
                        <div>
                          Productos: <span style={{ color: 'var(--color-text-main)' }}>{sale.items.reduce((sum, i) => sum + i.quantity, 0)} u.</span>
                        </div>
                      </div>

                      {/* Lista de productos comprados */}
                      <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        {sale.items.map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-main)' }}>
                              {it.quantity}x {it.name}
                            </span>
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              ${it.salePrice.toFixed(2)} c/u
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Nota de la venta */}
                      {sale.note && (
                        <div style={{
                          fontSize: '0.75rem',
                          background: 'rgba(245, 158, 11, 0.05)',
                          border: '1px solid rgba(245, 158, 11, 0.15)',
                          borderRadius: '4px',
                          color: '#f59e0b',
                          padding: '6px 10px',
                          fontStyle: 'italic'
                        }}>
                          Nota: {sale.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
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

export default Clientes;
