import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ShieldAlert, Award } from 'lucide-react';

const Login = () => {
  const { login, registerUser, error, systemSettings } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name || !email || !password) {
          throw new Error('Todos los campos son obligatorios');
        }
        await registerUser(name, email, password, 'admin');
        setSuccessMsg('¡Administrador inicial registrado con éxito! Iniciando sesión...');
      } else {
        if (!email || !password) {
          throw new Error('Por favor completa todos los campos');
        }
        await login(email, password);
      }
    } catch (err) {
      setFormError(err.message || 'Ocurrió un error inesperado');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Círculos decorativos flotantes de fondo */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
        filter: 'blur(80px)',
        top: '15%',
        left: '20%',
        opacity: 0.25,
        zIndex: -1
      }}></div>
      <div style={{
        position: 'absolute',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--color-secondary) 0%, transparent 70%)',
        filter: 'blur(60px)',
        bottom: '15%',
        right: '20%',
        opacity: 0.2,
        zIndex: -1
      }}></div>

      <div className="glass-panel modal-content" style={{ padding: '40px', maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            {/* Logotipo de Círculos concéntricos con brillo de Matriz Red Virtual */}
            <svg width="85" height="85" viewBox="0 0 80 80" style={{ filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.55))' }}>
              <defs>
                <linearGradient id="outerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-secondary)" />
                  <stop offset="100%" stopColor="var(--color-accent)" />
                </linearGradient>
                <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                </linearGradient>
                <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>
              
              {/* Resplandor de fondo */}
              <circle cx="40" cy="40" r="38" fill="url(#glowGrad)" opacity="0.5" />
              
              {/* Círculo Exterior con Brillo */}
              <circle 
                cx="40" 
                cy="40" 
                r="32" 
                fill="none" 
                stroke="url(#outerGrad)" 
                strokeWidth="3.5" 
                strokeDasharray="140 40" 
                style={{ transformOrigin: 'center', animation: 'spin 8s linear infinite' }} 
              />
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              
              {/* Círculo Interior */}
              <circle cx="40" cy="40" r="18" fill="url(#innerGrad)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
              <circle cx="40" cy="40" r="10" fill="var(--color-secondary)" opacity="0.85" style={{ filter: 'drop-shadow(0 0 8px var(--color-secondary))' }} />
              
              {/* Brillo reflectivo esférico (Glow spot) */}
              <circle cx="34" cy="34" r="3.5" fill="#ffffff" opacity="0.85" />
              <circle cx="33" cy="33" r="1.2" fill="#ffffff" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px', background: 'linear-gradient(135deg, #ffffff 30%, var(--color-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Matriz Red Virtual
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isRegister ? 'Registro de Administrador Inicial' : 'Punto de Venta y Control de Consumibles'}
          </p>
        </div>

        {error || formError ? (
          <div className="badge-danger" style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            lineHeight: '1.4'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{formError || error}</span>
          </div>
        ) : null}

        {successMsg ? (
          <div className="badge-success" style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '0.85rem',
            lineHeight: '1.4',
            display: 'block'
          }}>
            {successMsg}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <label className="input-label">Nombre Completo</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <User size={18} />
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tu Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '45px' }}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                <Mail size={18} />
              </span>
              <input
                type="email"
                className="form-input"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '45px' }}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '25px' }}>
            <label className="input-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                <Lock size={18} />
              </span>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '45px' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '20px' }}
            disabled={loading}
          >
            {loading ? 'Cargando...' : isRegister ? 'Registrar y Empezar' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
            {isRegister ? (
              <>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setFormError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Inicia Sesión
                </button>
              </>
            ) : (
              <>
                ¿Es la primera vez que ingresas?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setFormError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Registrar Admin Inicial
                </button>
              </>
            )}
          </p>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
            ¿Deseas activar la licencia en esta terminal?{' '}
            <button
              type="button"
              onClick={() => { window.location.href = '/activacion'; }}
              style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, cursor: 'pointer' }}
            >
              Activar Licencia
            </button>
          </p>

          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', opacity: 0.6, lineHeight: '1.4' }}>
            © {new Date().getFullYear()} AuraStock.<br />
            Realizado por Matriz Red Virtual. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
