import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Tag, Save, RefreshCw, ChevronDown, ChevronUp, Edit2, Check,
  X, BarChart2, Percent, DollarSign, AlertCircle, Search,
  TrendingUp, Layers, Settings, Package, RotateCcw, Info
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const formatMoney = (n) =>
  Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ListasDePrecios = () => {
  const { apiFetch } = useAuth();

  const [lists, setLists] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingList, setEditingList] = useState(null); // { index, field }
  const [editValues, setEditValues] = useState({});
  const [editingPrice, setEditingPrice] = useState(null); // { productId, listIndex }
  const [priceInputVal, setPriceInputVal] = useState('');
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'precios'
  const [applyingMarkup, setApplyingMarkup] = useState(null); // listIndex being reset

  // ─── Cargar datos ───────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/pricelists/products');
      setLists(data.lists);
      setProducts(data.products);
    } catch (e) {
      setError('Error al cargar listas de precios: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Auto-limpiar mensajes ───────────────────────────────────────────────────
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); }
  }, [error]);

  // ─── Guardar configuración de una lista ─────────────────────────────────────
  const saveListConfig = async (listIndex) => {
    setSaving(true);
    setError('');
    try {
      const vals = editValues[listIndex] || {};
      const listData = lists.find(l => l.index === listIndex);
      const payload = {
        name: vals.name !== undefined ? vals.name : listData.name,
        description: vals.description !== undefined ? vals.description : listData.description,
        markup: vals.markup !== undefined ? parseFloat(vals.markup) : listData.markup,
        color: vals.color !== undefined ? vals.color : listData.color,
        active: listData.active
      };

      await apiFetch(`/pricelists/${listIndex}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setSuccess(`Lista ${listIndex} actualizada correctamente`);
      setEditingList(null);
      setEditValues(prev => { const n = { ...prev }; delete n[listIndex]; return n; });
      await loadData();
    } catch (e) {
      setError('Error al guardar: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  // ─── Guardar precio personalizado de producto ───────────────────────────────
  const saveCustomPrice = async (productId, listIndex, price, useCustom) => {
    try {
      await apiFetch(`/pricelists/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ listIndex, price: parseFloat(price) || 0, useCustom })
      });
      setEditingPrice(null);
      await loadData();
      setSuccess('Precio actualizado');
    } catch (e) {
      setError('Error: ' + (e.message || ''));
    }
  };

  // ─── Resetear lista a markup global ─────────────────────────────────────────
  const applyGlobalMarkup = async (listIndex) => {
    if (!window.confirm(`¿Eliminar todos los precios personalizados de la Lista ${listIndex} y volver al markup global?`)) return;
    setApplyingMarkup(listIndex);
    try {
      await apiFetch(`/pricelists/${listIndex}/apply-markup`, { method: 'POST' });
      setSuccess(`Lista ${listIndex}: precios restablecidos al markup global`);
      await loadData();
    } catch (e) {
      setError('Error: ' + (e.message || ''));
    } finally {
      setApplyingMarkup(null);
    }
  };

  // ─── Calcular rentabilidad de un precio vs costo ─────────────────────────────
  const calcRentabilidad = (price, cost) => {
    if (!cost || cost === 0) return null;
    return ((price - cost) / cost * 100).toFixed(1);
  };

  // ─── Filtrar productos ───────────────────────────────────────────────────────
  const filtered = products.filter(p =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: '3px solid var(--border-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--color-text-muted)' }}>Cargando listas de precios...</span>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
              <Layers size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Listas de Precios
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                6 listas con rentabilidad configurable por producto
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Alerts ─────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Check size={16} /> {success}
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-light)', width: 'fit-content' }}>
        {[
          { id: 'config', label: 'Configurar Listas', icon: <Settings size={15} /> },
          { id: 'precios', label: 'Tabla de Precios', icon: <Package size={15} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--color-text-muted)',
              boxShadow: activeTab === tab.id ? '0 2px 12px rgba(99,102,241,0.35)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: CONFIGURAR LISTAS
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
          {lists.map(list => {
            const isEditing = editingList === list.index;
            const vals = editValues[list.index] || {};
            const currentName = vals.name !== undefined ? vals.name : list.name;
            const currentDesc = vals.description !== undefined ? vals.description : list.description;
            const currentMarkup = vals.markup !== undefined ? vals.markup : list.markup;
            const currentColor = vals.color !== undefined ? vals.color : list.color;

            // Calcular precio promedio de la lista para mostrarlo
            const avgPrice = products.length > 0
              ? products.reduce((acc, p) => acc + (p.prices[list.index]?.price || 0), 0) / products.length
              : 0;

            const priceRange = products.length > 0 ? {
              min: Math.min(...products.map(p => p.prices[list.index]?.price || 0)),
              max: Math.max(...products.map(p => p.prices[list.index]?.price || 0))
            } : null;

            return (
              <div
                key={list.index}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '16px',
                  border: `1px solid ${currentColor}44`,
                  padding: '0',
                  overflow: 'hidden',
                  boxShadow: isEditing ? `0 0 0 2px ${currentColor}66, 0 8px 24px rgba(0,0,0,0.2)` : '0 2px 8px rgba(0,0,0,0.15)',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Header de la tarjeta */}
                <div style={{ background: `linear-gradient(135deg, ${currentColor}22, ${currentColor}11)`, borderBottom: `1px solid ${currentColor}33`, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: currentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: '#fff', boxShadow: `0 4px 12px ${currentColor}55` }}>
                      {list.index}
                    </div>
                    <div>
                      {isEditing ? (
                        <input
                          value={currentName}
                          onChange={e => setEditValues(prev => ({ ...prev, [list.index]: { ...(prev[list.index] || {}), name: e.target.value } }))}
                          style={{ background: 'var(--bg-input)', border: `1px solid ${currentColor}`, borderRadius: '8px', padding: '4px 10px', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 700, width: '170px' }}
                        />
                      ) : (
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>{list.name}</div>
                      )}
                      {list.description && !isEditing && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{list.description}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => saveListConfig(list.index)} disabled={saving} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Check size={13} /> Guardar
                        </button>
                        <button onClick={() => { setEditingList(null); setEditValues(prev => { const n = { ...prev }; delete n[list.index]; return n; }); }} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setEditingList(list.index)} style={{ background: 'var(--bg-hover)', color: 'var(--color-text-muted)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Cuerpo */}
                <div style={{ padding: '18px' }}>
                  {/* Markup principal */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                      Rentabilidad / Markup
                    </label>
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          value={currentMarkup}
                          onChange={e => setEditValues(prev => ({ ...prev, [list.index]: { ...(prev[list.index] || {}), markup: e.target.value } }))}
                          style={{ background: 'var(--bg-input)', border: `2px solid ${currentColor}`, borderRadius: '10px', padding: '8px 12px', color: 'var(--color-text)', fontSize: '1.3rem', fontWeight: 800, width: '100px', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: currentColor }}>%</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 900, color: currentColor, lineHeight: 1 }}>
                          {Number(list.markup) >= 0 ? '+' : ''}{list.markup}
                        </span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: currentColor }}>%</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>sobre costo</span>
                      </div>
                    )}
                  </div>

                  {/* Descripción editable */}
                  {isEditing && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                        Descripción
                      </label>
                      <input
                        value={currentDesc}
                        onChange={e => setEditValues(prev => ({ ...prev, [list.index]: { ...(prev[list.index] || {}), description: e.target.value } }))}
                        placeholder="Ej: clientes mayoristas con volumen..."
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '7px 12px', color: 'var(--color-text)', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}

                  {/* Color selector */}
                  {isEditing && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                        Color de la lista
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'].map(c => (
                          <button
                            key={c}
                            onClick={() => setEditValues(prev => ({ ...prev, [list.index]: { ...(prev[list.index] || {}), color: c } }))}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: currentColor === c ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer', boxShadow: currentColor === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.2s' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estadísticas rápidas */}
                  {!isEditing && products.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      <div style={{ background: `${currentColor}11`, borderRadius: '8px', padding: '8px 12px', border: `1px solid ${currentColor}22` }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Precio promedio</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: currentColor }}>${formatMoney(avgPrice)}</div>
                      </div>
                      <div style={{ background: `${currentColor}11`, borderRadius: '8px', padding: '8px 12px', border: `1px solid ${currentColor}22` }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Productos</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: currentColor }}>{products.length}</div>
                      </div>
                    </div>
                  )}

                  {/* Botón resetear a markup global */}
                  {!isEditing && (
                    <button
                      onClick={() => applyGlobalMarkup(list.index)}
                      disabled={applyingMarkup === list.index}
                      style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, justifyContent: 'center', transition: 'all 0.2s' }}
                    >
                      <RotateCcw size={13} style={{ animation: applyingMarkup === list.index ? 'spin 0.8s linear infinite' : 'none' }} />
                      Aplicar markup global a todos
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: TABLA DE PRECIOS
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'precios' && (
        <div>
          {/* Buscador */}
          <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar producto por nombre o código..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--color-text)', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Leyenda */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#6366f1' }} />
              Precio calculado (markup global)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} />
              Precio personalizado
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              <Info size={12} />
              Click en precio para editar
            </div>
          </div>

          {/* Tabla */}
          <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--border-light)', background: 'var(--bg-card)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-table-header)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-light)', position: 'sticky', left: 0, background: 'var(--bg-table-header)', zIndex: 2 }}>Producto</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>Costo</th>
                  {lists.map(list => (
                    <th key={list.index} style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-light)', borderLeft: '1px solid var(--border-light)', whiteSpace: 'nowrap', minWidth: '120px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: list.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.85rem', boxShadow: `0 2px 8px ${list.color}44` }}>
                          {list.index}
                        </div>
                        <span style={{ color: list.color, fontSize: '0.68rem' }}>{list.markup >= 0 ? '+' : ''}{list.markup}%</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No se encontraron productos
                    </td>
                  </tr>
                )}
                {filtered.map((product, idx) => (
                  <tr key={product._id} style={{ borderBottom: '1px solid var(--border-light)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-table-alt)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-table-alt)'}
                  >
                    {/* Producto */}
                    <td style={{ padding: '10px 16px', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1, borderRight: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)', whiteSpace: 'nowrap', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{product.code} · {product.category}</div>
                    </td>
                    {/* Costo */}
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '0.88rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      ${formatMoney(product.purchasePrice)}
                    </td>
                    {/* Precio por lista */}
                    {lists.map(list => {
                      const priceData = product.prices[list.index];
                      const price = priceData?.price || 0;
                      const isCustom = priceData?.isCustom;
                      const rentab = calcRentabilidad(price, product.purchasePrice);
                      const isEditingThis = editingPrice?.productId === product._id && editingPrice?.listIndex === list.index;

                      return (
                        <td key={list.index} style={{ padding: '6px 10px', textAlign: 'center', borderLeft: '1px solid var(--border-light)' }}>
                          {isEditingThis ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              <input
                                type="number"
                                autoFocus
                                value={priceInputVal}
                                onChange={e => setPriceInputVal(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveCustomPrice(product._id, list.index, priceInputVal, true);
                                  if (e.key === 'Escape') setEditingPrice(null);
                                }}
                                style={{ width: '90px', padding: '5px 8px', borderRadius: '7px', border: `2px solid ${list.color}`, background: 'var(--bg-input)', color: 'var(--color-text)', fontSize: '0.88rem', textAlign: 'center', fontWeight: 700 }}
                              />
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => saveCustomPrice(product._id, list.index, priceInputVal, true)} style={{ padding: '3px 7px', borderRadius: '5px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>✓</button>
                                <button onClick={() => saveCustomPrice(product._id, list.index, 0, false)} style={{ padding: '3px 7px', borderRadius: '5px', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.72rem' }} title="Volver a markup global">↩</button>
                                <button onClick={() => setEditingPrice(null)} style={{ padding: '3px 7px', borderRadius: '5px', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem' }}>✕</button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingPrice({ productId: product._id, listIndex: list.index });
                                setPriceInputVal(String(price));
                              }}
                              style={{ cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', transition: 'all 0.2s', border: `1px solid ${isCustom ? '#10b98133' : 'transparent'}`, background: isCustom ? '#10b98111' : 'transparent' }}
                              title="Click para editar precio"
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isCustom ? '#10b981' : list.color }}>
                                ${formatMoney(price)}
                              </div>
                              {rentab !== null && (
                                <div style={{ fontSize: '0.68rem', color: Number(rentab) >= 0 ? 'var(--color-success)' : '#ef4444', fontWeight: 600 }}>
                                  {Number(rentab) >= 0 ? '▲' : '▼'} {Math.abs(rentab)}%
                                </div>
                              )}
                              {isCustom && (
                                <div style={{ fontSize: '0.62rem', color: '#10b981', opacity: 0.8 }}>personalizado</div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Package size={13} />
            {filtered.length} de {products.length} productos · Click en cualquier precio para personalizar
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ListasDePrecios;
