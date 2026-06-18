import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users as UsersIcon, Plus, Shield, ShieldAlert, UserPlus, X, Edit, Power } from 'lucide-react';

const Users = () => {
  const { apiFetch, user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Registrar nuevo usuario
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendedor');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Editar usuario existente
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('vendedor');
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const isAdmin = currentUser && currentUser.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!name || !email || !password) {
      setAddError('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al registrar el nuevo usuario');
      }

      setAddSuccess(`¡Usuario ${name} registrado con éxito!`);
      // Limpiar formulario
      setName('');
      setEmail('');
      setPassword('');
      setRole('vendedor');
      fetchUsers();
      
      // Cerrar modal tras 1.5 segundos
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess('');
      }, 1500);

    } catch (err) {
      setAddError(err.message);
    }
  };

  const toggleUserStatus = async (userToToggle) => {
    if (userToToggle._id === currentUser.id) {
      alert('No puedes desactivar tu propia cuenta activa de administrador');
      return;
    }

    const newStatus = !userToToggle.active;
    const confirmMsg = `¿Está seguro de que desea ${newStatus ? 'ACTIVAR' : 'DESACTIVAR'} a ${userToToggle.name}? Un usuario desactivado no podrá iniciar sesión.`;

    if (window.confirm(confirmMsg)) {
      try {
        const res = await apiFetch(`/auth/users/${userToToggle._id}`, {
          method: 'PUT',
          body: JSON.stringify({ active: newStatus })
        });

        if (res.ok) {
          fetchUsers();
        } else {
          const data = await res.json();
          alert(data.message || 'Error al cambiar estado del usuario');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const promoteUserRole = async (userToChange) => {
    if (userToChange._id === currentUser.id) {
      alert('No puedes cambiar tu propio rol de administrador');
      return;
    }

    const newRole = userToChange.role === 'admin' ? 'vendedor' : 'admin';
    const confirmMsg = `¿Está seguro de cambiar el rol de ${userToChange.name} a ${newRole.toUpperCase()}?`;

    if (window.confirm(confirmMsg)) {
      try {
        const res = await apiFetch(`/auth/users/${userToChange._id}`, {
          method: 'PUT',
          body: JSON.stringify({ role: newRole })
        });

        if (res.ok) {
          fetchUsers();
        } else {
          const data = await res.json();
          alert(data.message || 'Error al cambiar rol del usuario');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOpenEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setEditName(userToEdit.name);
    setEditEmail(userToEdit.email);
    setEditPassword('');
    setEditRole(userToEdit.role);
    setEditActive(userToEdit.active);
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    if (!editName || !editEmail) {
      setEditError('Por favor completa los campos obligatorios (Nombre y Correo)');
      return;
    }

    if (editPassword && editPassword.length < 6) {
      setEditError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const isSelf = editingUser._id === currentUser.id;
    if (isSelf && (!editActive || editRole !== 'admin')) {
      setEditError('No puedes desactivarte o quitarte el rol de administrador a ti mismo');
      return;
    }

    try {
      const updateData = {
        name: editName,
        email: editEmail,
        role: editRole,
        active: editActive
      };

      if (editPassword) {
        updateData.password = editPassword;
      }

      const res = await apiFetch(`/auth/users/${editingUser._id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al actualizar el usuario');
      }

      setEditSuccess('¡Usuario actualizado con éxito!');
      fetchUsers();

      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccess('');
        setEditingUser(null);
      }, 1500);

    } catch (err) {
      setEditError(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
        <ShieldAlert size={48} style={{ color: 'var(--color-danger)', marginBottom: '15px' }} />
        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Acceso Restringido</h3>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Esta página está disponible únicamente para Administradores.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Gestión de Usuarios</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Crear, desactivar y administrar permisos de personal.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <UserPlus size={18} />
          <span>Registrar Personal</span>
        </button>
      </div>

      {errorMsg && (
        <div className="badge-danger" style={{ padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'block' }}>
          {errorMsg}
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            Cargando lista de usuarios...
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Correo Electrónico</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha de Registro</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => {
                  const isSelf = u._id === currentUser.id;
                  
                  return (
                    <tr key={u._id} style={{ opacity: u.active ? 1 : 0.6 }}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{u.name}</span>
                          {isSelf && <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Tú</span>}
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-success' : 'badge-primary'}`} style={{
                          background: u.role === 'admin' ? 'var(--color-success-bg)' : 'rgba(6,182,212,0.15)',
                          color: u.role === 'admin' ? 'var(--color-success)' : 'var(--color-secondary)',
                          border: u.role === 'admin' ? '1px solid var(--border-success)' : '1px solid rgba(6,182,212,0.3)'
                        }}>
                          <Shield size={12} style={{ marginRight: '4px' }} />
                          {u.role === 'admin' ? 'Administrador' : 'Cajero / Vendedor'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                          {u.active ? 'Activo' : 'Desactivado'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            title="Editar Datos / Contraseña"
                          >
                            <Edit size={14} />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => promoteUserRole(u)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            disabled={isSelf}
                            title="Cambiar Rol de Permisos"
                          >
                            <Shield size={14} />
                            <span>Cambiar Rol</span>
                          </button>
                          
                          <button
                            onClick={() => toggleUserStatus(u)}
                            className={`btn ${u.active ? 'btn-danger' : 'btn-success'}`}
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            disabled={isSelf}
                            title={u.active ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                          >
                            <Power size={14} />
                            <span>{u.active ? 'Desactivar' : 'Activar'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR NUEVO USUARIO */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} style={{ color: 'var(--color-secondary)' }} />
                <span>Registrar Personal</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {addError && (
              <div className="badge-danger" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '15px', fontSize: '0.85rem', display: 'block' }}>
                {addError}
              </div>
            )}

            {addSuccess && (
              <div className="badge-success" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '15px', fontSize: '0.85rem', display: 'block' }}>
                {addSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              
              <div className="input-group">
                <label className="input-label">Nombre Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Correo Electrónico *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="personal@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Contraseña de Acceso *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min. 6 caracteres..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '25px' }}>
                <label className="input-label">Rol y Permisos</label>
                <select
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ background: 'var(--bg-main)' }}
                >
                  <option value="vendedor">Cajero / Vendedor (Acceso POS e inventario)</option>
                  <option value="admin">Administrador (Acceso Total y analíticas)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>Registrar Empleado</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO */}
      {showEditModal && editingUser && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={20} style={{ color: 'var(--color-secondary)' }} />
                <span>Editar Usuario</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="badge-danger" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '15px', fontSize: '0.85rem', display: 'block' }}>
                {editError}
              </div>
            )}

            {editSuccess && (
              <div className="badge-success" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '15px', fontSize: '0.85rem', display: 'block' }}>
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleEditUser}>
              
              <div className="input-group">
                <label className="input-label">Nombre Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Juan Pérez"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Correo Electrónico *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="personal@correo.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Nueva Contraseña (Opcional)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Dejar en blanco para no cambiar..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '15px' }}>
                <label className="input-label">Rol y Permisos</label>
                <select
                  className="form-input"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  style={{ background: 'var(--bg-main)' }}
                  disabled={editingUser._id === currentUser.id}
                >
                  <option value="vendedor">Cajero / Vendedor (Acceso POS e inventario)</option>
                  <option value="admin">Administrador (Acceso Total y analíticas)</option>
                </select>
                {editingUser._id === currentUser.id && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                    No puedes cambiar tu propio rol de administrador.
                  </span>
                )}
              </div>

              <div className="input-group" style={{ marginBottom: '25px' }}>
                <label className="input-label">Estado de la Cuenta</label>
                <select
                  className="form-input"
                  value={editActive ? 'true' : 'false'}
                  onChange={(e) => setEditActive(e.target.value === 'true')}
                  style={{ background: 'var(--bg-main)' }}
                  disabled={editingUser._id === currentUser.id}
                >
                  <option value="true">Activo</option>
                  <option value="false">Desactivado</option>
                </select>
                {editingUser._id === currentUser.id && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                    No puedes desactivar tu propia cuenta activa de administrador.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>Guardar Cambios</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
