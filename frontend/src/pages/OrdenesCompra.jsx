import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Edit2, Trash2, X, AlertCircle, RefreshCw, Truck, Clipboard, Calendar, User, DollarSign, Eye, CheckCircle, Ban, ArrowRight, Package, Search
} from 'lucide-react';

const OrdenesCompra = () => {
  const { apiFetch, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('todos');

  // Estados de Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Campos para Nueva/Editar Orden
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [notes, setNotes] = useState('');
  const [poItems, setPoItems] = useState([]); // Array de { product: id, name, code, quantityOrdered, unitCost }

  // Campos para agregar un producto al listado temporal de la orden
  const [searchProdQuery, setSearchProdQuery] = useState('');
  const [prodSuggestions, setProdSuggestions] = useState([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState(null);
  const [addQty, setAddQty] = useState(1);
  const [addCost, setAddCost] = useState(0);

  // Campos para detalle y recepción
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receivedQuantities, setReceivedQuantities] = useState({}); // { itemId: quantityReceived }
  const [receivedCosts, setReceivedCosts] = useState({}); // { itemId: unitCost }

  const isAdmin = user && user.role === 'admin';

  // Cargar órdenes de compra
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const statusParam = activeTab !== 'todos' ? `?status=${activeTab}` : '';
      const res = await apiFetch(`/purchaseorders${statusParam}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al cargar órdenes de compra');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar proveedores
  const fetchSuppliers = async () => {
    try {
      const res = await apiFetch('/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.filter(s => s.active !== false));
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }
  };

  // Buscar productos al escribir en el selector de agregar item
  const searchProducts = async (q) => {
    if (!q.trim()) {
      setProdSuggestions([]);
      return;
    }
    try {
      const res = await apiFetch(`/products?search=${encodeURIComponent(q)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setProdSuggestions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreateModal = (order = null) => {
    if (order) {
      setEditingId(order._id);
      setSelectedSupplier(order.supplier?._id || '');
      setExpectedDate(order.expectedDate ? new Date(order.expectedDate).toISOString().substring(0, 10) : '');
      setExchangeRate(order.exchangeRate || '');
      setNotes(order.notes || '');
      setPoItems(order.items.map(item => ({
        product: item.product?._id || item.product,
        name: item.name,
        code: item.code,
        quantityOrdered: item.quantityOrdered,
        unitCost: item.unitCost,
        iva: item.iva !== undefined ? item.iva : 21,
        impuestoInterno: item.impuestoInterno || 0,
        impuestoInternoTipo: item.impuestoInternoTipo || 'porcentaje'
      })));
    } else {
      setEditingId(null);
      setSelectedSupplier('');
      setExpectedDate('');
      setExchangeRate('');
      setNotes('');
      setPoItems([]);
    }
    setSearchProdQuery('');
    setProdSuggestions([]);
    setSelectedProductToAdd(null);
    setAddQty(1);
    setAddCost(0);
    setShowCreateModal(true);
  };

  const handleProductSelectToAdd = (prod) => {
    setSelectedProductToAdd(prod);
    setSearchProdQuery(`${prod.name} (${prod.code})`);
    setAddCost(prod.purchasePrice || 0);
    setProdSuggestions([]);
  };

  const handleAddItemToPO = () => {
    if (!selectedProductToAdd) return;
    
    // Verificar si ya existe en la lista
    const existingIndex = poItems.findIndex(i => i.product === selectedProductToAdd._id);
    if (existingIndex >= 0) {
      const newItems = [...poItems];
      newItems[existingIndex].quantityOrdered += parseInt(addQty) || 1;
      newItems[existingIndex].unitCost = parseFloat(addCost) || 0;
      setPoItems(newItems);
    } else {
      setPoItems([
        ...poItems,
        {
          product: selectedProductToAdd._id,
          name: selectedProductToAdd.name,
          code: selectedProductToAdd.code,
          quantityOrdered: parseInt(addQty) || 1,
          unitCost: parseFloat(addCost) || 0,
          iva: selectedProductToAdd.iva !== undefined ? selectedProductToAdd.iva : 21,
          impuestoInterno: selectedProductToAdd.impuestoInterno || 0,
          impuestoInternoTipo: selectedProductToAdd.impuestoInternoTipo || 'porcentaje'
        }
      ]);
    }

    setSelectedProductToAdd(null);
    setSearchProdQuery('');
    setAddQty(1);
    setAddCost(0);
  };

  const handleRemoveItemFromPO = (idx) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handleSavePO = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) {
      setErrorMsg('Debe seleccionar un proveedor.');
      return;
    }
    if (poItems.length === 0) {
      setErrorMsg('Debe agregar al menos un producto a la orden.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        supplier: selectedSupplier,
        expectedDate: expectedDate || null,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null,
        notes,
        items: poItems
      };

      const url = editingId ? `/purchaseorders/${editingId}` : '/purchaseorders';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setShowCreateModal(false);
        fetchOrders();
      } else {
        setErrorMsg(data.message || 'Error al guardar la orden de compra');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al guardar la orden.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetailModal = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`¿Seguro que desea marcar esta orden como ${status.toUpperCase()}?`)) return;

    try {
      setLoading(true);
      const res = await apiFetch(`/purchaseorders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setShowDetailModal(false);
        fetchOrders();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al cambiar estado');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceiveModal = (order) => {
    setSelectedOrder(order);
    const initialQtys = {};
    const initialCosts = {};
    order.items.forEach(item => {
      initialQtys[item.product?._id || item.product] = item.quantityOrdered - (item.quantityReceived || 0);
      initialCosts[item.product?._id || item.product] = item.unitCost || 0;
    });
    setReceivedQuantities(initialQtys);
    setReceivedCosts(initialCosts);
    setShowReceiveModal(true);
  };

  const handleConfirmReceive = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const itemsReceived = Object.keys(receivedQuantities).map(prodId => ({
        product: prodId,
        quantityReceived: parseInt(receivedQuantities[prodId]) || 0,
        unitCost: parseFloat(receivedCosts[prodId]) || 0
      }));

      const res = await apiFetch(`/purchaseorders/${selectedOrder._id}/receive`, {
        method: 'PUT',
        body: JSON.stringify({ itemsReceived })
      });

      if (res.ok) {
        setShowReceiveModal(false);
        setShowDetailModal(false);
        fetchOrders();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Error al recibir mercadería');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión al recibir mercadería.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      borrador: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', text: 'Borrador' },
      enviada: { bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', text: 'Enviada' },
      recibida: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', text: 'Recibida' },
      cancelada: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', text: 'Cancelada' }
    };
    const current = styles[status] || { bg: 'gray', color: 'white', text: status };
    return (
      <span style={{
        background: current.bg,
        color: current.color,
        border: `1px solid ${current.color}44`,
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '0.72rem',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        {current.text}
      </span>
    );
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
            Órdenes de Compra
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            Crea órdenes para tus proveedores, realiza el seguimiento del estado del pedido e incrementa el stock de inventario de forma automática al recibir la mercadería.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => handleOpenCreateModal()}
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
            Nueva Orden
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

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-light)',
        marginBottom: '24px',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {['todos', 'borrador', 'enviada', 'recibida', 'cancelada'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2.5px solid var(--color-primary-light)' : '2.5px solid transparent',
              color: activeTab === tab ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              textTransform: 'capitalize',
              fontSize: '0.88rem',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              outline: 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Lista de Órdenes */}
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
                <th>Código PO</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Fecha Esperada</th>
                <th>Total Solicitado</th>
                <th>Creado Por</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
                    <div>Cargando listado de órdenes...</div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    No se encontraron órdenes de compra en esta categoría.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order._id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: 'white' }}>
                        #{order._id.toString().substring(18).toUpperCase()}
                      </span>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                        Creación: {new Date(order.createdAt).toLocaleDateString('es-AR')}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{order.supplier?.name || 'S/D'}</div>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {order.expectedDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} style={{ color: 'var(--color-text-muted)' }} />
                          {new Date(order.expectedDate).toLocaleDateString('es-AR')}
                        </div>
                      ) : '---'}
                    </td>
                    <td>
                      <strong style={{ color: 'white', fontSize: '0.9rem' }}>
                        ${(order.subtotal || 0).toFixed(2)}
                      </strong>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {order.createdBy?.name || 'Sistema'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenDetailModal(order)}
                          className="btn btn-secondary"
                          title="Ver detalles"
                          style={{ padding: '6px' }}
                        >
                          <Eye size={13} />
                        </button>
                        {order.status === 'borrador' && isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenCreateModal(order)}
                              className="btn btn-secondary"
                              title="Editar orden"
                              style={{ padding: '6px' }}
                            >
                              <Edit2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación / Edición */}
      {showCreateModal && (
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
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                {editingId ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePO} style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Proveedor *
                  </label>
                  <select
                    required
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="form-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Seleccionar Proveedor --</option>
                    {suppliers.map(sup => (
                      <option key={sup._id} value={sup._id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Fecha Esperada de Entrega
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Cotización Dólar (Opcional)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        className="form-input"
                        placeholder="Ej: 1050"
                        style={{ width: '100%', paddingLeft: '30px' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const cached = localStorage.getItem('dolar-bna-cotizacion');
                          if (cached) {
                            const parsed = JSON.parse(cached);
                            if (parsed.compra) setExchangeRate(parsed.compra);
                          }
                        } catch (e) {
                          console.error('Error al leer cotización', e);
                        }
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0 12px', fontSize: '0.8rem', fontWeight: 'bold' }}
                      title="Usar valor de compra actual del BNA"
                    >
                      Dolar
                    </button>
                  </div>
                </div>
              </div>

              {/* Sección de agregar producto */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <h4 style={{ margin: 0, fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                  Agregar Productos a la Orden
                </h4>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Buscador de producto con sugerencias */}
                  <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Buscar producto por nombre o código..."
                        className="form-input"
                        value={searchProdQuery}
                        onChange={(e) => {
                          setSearchProdQuery(e.target.value);
                          searchProducts(e.target.value);
                        }}
                        style={{ paddingLeft: '34px', width: '100%' }}
                      />
                    </div>

                    {prodSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%', left: 0, right: 0,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        zIndex: 1200,
                        maxHeight: '180px',
                        overflowY: 'auto',
                        marginTop: '4px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                      }}>
                        {prodSuggestions.map(p => (
                          <div
                            key={p._id}
                            onClick={() => handleProductSelectToAdd(p)}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-light)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.85rem'
                            }}
                          >
                            <span>{p.name}</span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>Code: {p.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cantidad pedida */}
                  <div style={{ width: '90px' }}>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder="Cant."
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: '100%', textAlign: 'center' }}
                      title="Cantidad Pedida"
                    />
                  </div>

                  {/* Costo unitario */}
                  <div style={{ width: '120px', position: 'relative' }}>
                    <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="Costo USD"
                      value={addCost}
                      onChange={(e) => setAddCost(Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{ width: '100%', paddingLeft: '24px' }}
                      title="Costo Unitario"
                    />
                  </div>

                  {/* Costo en ARS (Vivo) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    color: 'black',
                    fontStyle: 'italic',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap'
                  }} title="Costo Unitario en Pesos Argentinos (Costo USD * Cotización)">
                    ARS ${(addCost * (parseFloat(exchangeRate) || 0)).toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItemToPO}
                    disabled={!selectedProductToAdd}
                    className="btn btn-primary"
                    style={{ padding: '0 16px', fontWeight: 'bold' }}
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Listado de items cargados */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Detalle del Pedido
                </label>
                <div style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Producto</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: '70px' }}>Cant.</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '90px' }}>Neto (USD)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '90px', color: 'black', fontStyle: 'italic' }}>Neto (ARS)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '90px' }}>Impuestos</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '90px' }}>Total (USD)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '90px', color: 'black', fontStyle: 'italic' }}>Total (ARS)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {poItems.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                            No hay productos agregados a la orden.
                          </td>
                        </tr>
                      ) : (
                        poItems.map((item, idx) => {
                          const itemSubtotal = item.quantityOrdered * item.unitCost;
                          const ivaAmt = itemSubtotal * ((item.iva || 0) / 100);
                          let impIntAmt = 0;
                          if (item.impuestoInternoTipo === 'fijo') {
                            impIntAmt = (item.impuestoInterno || 0) * item.quantityOrdered;
                          } else {
                            impIntAmt = itemSubtotal * ((item.impuestoInterno || 0) / 100);
                          }
                          const totalTaxes = ivaAmt + impIntAmt;
                          const totalLinea = itemSubtotal + totalTaxes;

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{item.code}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)' }}>
                                  IVA {item.iva || 0}% | Imp.Int {item.impuestoInternoTipo === 'fijo' ? '$' : ''}{item.impuestoInterno || 0}{item.impuestoInternoTipo === 'porcentaje' ? '%' : ''}
                                </div>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantityOrdered}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    const updated = [...poItems];
                                    updated[idx].quantityOrdered = val;
                                    setPoItems(updated);
                                  }}
                                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'inherit', width: '60px', textAlign: 'center', padding: '4px' }}
                                />
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unitCost}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                    const updated = [...poItems];
                                    updated[idx].unitCost = val;
                                    setPoItems(updated);
                                  }}
                                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'inherit', width: '75px', textAlign: 'right', padding: '4px' }}
                                />
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: 'black', fontStyle: 'italic', fontWeight: 600 }}>
                                ${((parseFloat(exchangeRate) || 0) * item.unitCost).toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                                ${totalTaxes.toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                                ${totalLinea.toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: 'black', fontStyle: 'italic', fontWeight: 600 }}>
                                ${(totalLinea * (parseFloat(exchangeRate) || 0)).toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <button type="button" onClick={() => handleRemoveItemFromPO(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                                  <X size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                  {poItems.length > 0 && (() => {
                    const totalNeto = poItems.reduce((sum, i) => sum + (i.quantityOrdered * i.unitCost), 0);
                    const totalImpuestos = poItems.reduce((sum, i) => {
                      const itemSubtotal = i.quantityOrdered * i.unitCost;
                      const ivaAmt = itemSubtotal * ((i.iva || 0) / 100);
                      let impIntAmt = 0;
                      if (i.impuestoInternoTipo === 'fijo') {
                        impIntAmt = (i.impuestoInterno || 0) * i.quantityOrdered;
                      } else {
                        impIntAmt = itemSubtotal * ((i.impuestoInterno || 0) / 100);
                      }
                      return sum + ivaAmt + impIntAmt;
                    }, 0);
                    const totalFinal = totalNeto + totalImpuestos;
                    const exchange = parseFloat(exchangeRate) || 0;

                    return (
                      <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Neto (USD):</span>
                            <span style={{ fontSize: '0.95rem', color: 'white' }}>${totalNeto.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Impuestos (USD):</span>
                            <span style={{ fontSize: '0.95rem', color: 'white' }}>${totalImpuestos.toFixed(2)}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', alignItems: 'center', marginTop: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 'bold' }}>TOTAL (USD):</span>
                            <strong style={{ fontSize: '1.2rem', color: 'white' }}>${totalFinal.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>TOTAL (ARS):</span>
                            <strong style={{ fontSize: '1.2rem', color: 'black', fontStyle: 'italic' }}>${(totalFinal * exchange).toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Notas Adicionales
                </label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Ingrese observaciones sobre la orden de compra..."
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
                  onClick={() => setShowCreateModal(false)}
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
                  Guardar Borrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {showDetailModal && selectedOrder && (
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
            maxHeight: '90vh',
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
                  Detalles de la Orden de Compra
                </h3>
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                  ID: {selectedOrder._id}
                </span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Información Proveedor y Fechas */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '16px'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Proveedor</h4>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={14} style={{ color: 'var(--color-primary-light)' }} />
                    {selectedOrder.supplier?.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {selectedOrder.supplier?.email || 'Sin email'} | {selectedOrder.supplier?.phone || 'Sin tel'}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Fechas del Pedido</h4>
                  <div style={{ fontSize: '0.8rem' }}>
                    Creación: <strong>{new Date(selectedOrder.createdAt).toLocaleDateString('es-AR')}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Esperada: <strong>{selectedOrder.expectedDate ? new Date(selectedOrder.expectedDate).toLocaleDateString('es-AR') : 'S/D'}</strong>
                  </div>
                  {selectedOrder.receivedDate && (
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--color-success)' }}>
                      Recepción: <strong>{new Date(selectedOrder.receivedDate).toLocaleDateString('es-AR')}</strong>
                    </div>
                  )}
                  {selectedOrder.exchangeRate && (
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      Cotización Dólar: <strong>${selectedOrder.exchangeRate.toFixed(2)}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Estado y Creador</h4>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    Generada por: {selectedOrder.createdBy?.name || 'Sistema'}
                  </div>
                </div>
              </div>

              {/* Tabla de Productos de la Orden */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Productos del Pedido</h4>
                <div style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Producto</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: '100px' }}>Pedido</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: '100px' }}>Recibido</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '120px' }}>Costo</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '120px' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{item.code}</div>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 'bold' }}>
                            {item.quantityOrdered} u.
                          </td>
                          <td style={{
                            padding: '8px 12px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: item.quantityReceived >= item.quantityOrdered ? 'var(--color-success)' : item.quantityReceived > 0 ? '#f59e0b' : 'var(--color-text-muted)'
                          }}>
                            {item.quantityReceived || 0} u.
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            ${(item.unitCost || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                            ${(item.quantityOrdered * item.unitCost).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{
                    background: 'rgba(255,255,255,0.01)',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '12px',
                    borderTop: '1px solid var(--border-light)'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Subtotal Pedido:</span>
                    <strong style={{ fontSize: '1.05rem', color: 'white' }}>
                      ${(selectedOrder.subtotal || 0).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {selectedOrder.notes && (
                <div style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  fontSize: '0.82rem'
                }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Notas</h4>
                  <div style={{ fontStyle: 'italic' }}>{selectedOrder.notes}</div>
                </div>
              )}
            </div>

            {/* Footer / Acciones del Estado */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Cerrar
              </button>

              {isAdmin && selectedOrder.status === 'borrador' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'enviada')}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', background: 'var(--color-primary-light)', border: 'none' }}
                  >
                    Marcar como Enviada
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'cancelada')}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', color: 'var(--color-danger)' }}
                  >
                    Cancelar Orden
                  </button>
                </>
              )}

              {isAdmin && selectedOrder.status === 'enviada' && (
                <>
                  <button
                    onClick={() => handleOpenReceiveModal(selectedOrder)}
                    className="btn btn-primary"
                    style={{
                      padding: '8px 18px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      boxShadow: '0 0 12px rgba(16,185,129,0.3)',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Package size={14} />
                    Recibir Mercadería
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'cancelada')}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', color: 'var(--color-danger)' }}
                  >
                    Cancelar Orden
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recepción de Mercadería */}
      {showReceiveModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1200,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '700px',
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
                  Recepción de Mercadería
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Orden: <strong style={{ color: 'white' }}>#{selectedOrder._id.toString().substring(18).toUpperCase()}</strong>
                </span>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem'
              }}>
                <CheckCircle size={16} />
                <span>Indica las cantidades reales de productos que estás recibiendo físicamente e ingresando al stock.</span>
              </div>

              {/* Listado de items para ajustar cantidad recibida */}
              <div style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Producto</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', width: '100px' }}>Pedido</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', width: '120px' }}>Recibido Real</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', width: '120px' }}>Costo Real</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => {
                      const prodId = item.product?._id || item.product;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{item.code}</div>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 'bold' }}>
                            {item.quantityOrdered} u.
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              max={item.quantityOrdered * 5}
                              value={receivedQuantities[prodId] !== undefined ? receivedQuantities[prodId] : item.quantityOrdered}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setReceivedQuantities({
                                  ...receivedQuantities,
                                  [prodId]: val
                                });
                              }}
                              style={{
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '4px',
                                color: 'inherit',
                                width: '80px',
                                textAlign: 'center',
                                padding: '6px',
                                fontWeight: 'bold'
                              }}
                            />
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <div style={{ position: 'relative', display: 'inline-block', width: '100px' }}>
                              <DollarSign size={11} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={receivedCosts[prodId] !== undefined ? receivedCosts[prodId] : item.unitCost}
                                onChange={(e) => {
                                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                                  setReceivedCosts({
                                    ...receivedCosts,
                                    [prodId]: val
                                  });
                                }}
                                style={{
                                  background: 'var(--bg-main)',
                                  border: '1px solid var(--border-light)',
                                  borderRadius: '4px',
                                  color: 'inherit',
                                  width: '100%',
                                  textAlign: 'right',
                                  padding: '6px 8px 6px 18px'
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReceive}
                className="btn btn-primary"
                style={{
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  fontWeight: 'bold',
                  boxShadow: '0 0 12px rgba(16,185,129,0.4)'
                }}
              >
                Confirmar Recepción y Sumar Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesCompra;
