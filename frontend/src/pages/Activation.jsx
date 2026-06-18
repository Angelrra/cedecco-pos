import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { getOrGenerateDeviceMac } from '../utils/device';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const encodeMacToHex = (mac) => {
  if (!mac) return '';
  const clean = mac.replace(/[:-]/g, '').toUpperCase();
  return Array.from(clean)
    .map(c => c.charCodeAt(0).toString(16))
    .join('')
    .toUpperCase();
};

const Activation = () => {
  const [mac, setMac] = useState(() => getOrGenerateDeviceMac());
  const [serial, setSerial] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleCopyCode = () => {
    const code = encodeMacToHex(mac);
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchStatus = async () => {
    try {
      const deviceMac = getOrGenerateDeviceMac();
      const res = await fetch(`${API_URL}/devices/license-status`, {
        headers: {
          'X-Device-Mac': deviceMac
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMac(data.mac);
        if (!data.locked) {
          // Si ya está activado, redirigir al tablero principal
          window.location.href = '/';
        }
        if (data.hasPendingRequest) {
          setRequestSent(true);
        }
      }
    } catch (err) {
      console.error('Error al consultar estado de licencia:', err);
      setErrorMsg('No se pudo conectar con el servidor de licencias. Verifique si el backend está corriendo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!serial.trim()) return;
    
    setSubmitting(true);
    setErrorMsg('');
    try {
      const deviceMac = getOrGenerateDeviceMac();
      const res = await fetch(`${API_URL}/devices/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Mac': deviceMac
        },
        body: JSON.stringify({ serial: serial.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Número de serie de activación incorrecto para este equipo.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al intentar activar el sistema.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendRequest = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const code = encodeMacToHex(mac);
      if (!code) return;
      const userAgent = navigator.userAgent;
      let detectedName = 'Dispositivo Remoto';
      if (userAgent.includes('iPhone')) detectedName = 'iPhone XR';
      else if (userAgent.includes('Android')) detectedName = 'Dispositivo Android';
      else if (userAgent.includes('Windows')) detectedName = 'PC Windows';
      else if (userAgent.includes('Macintosh')) detectedName = 'Mac';
      else if (userAgent.includes('Linux')) detectedName = 'Dispositivo Linux';

      const deviceMac = getOrGenerateDeviceMac();
      const res = await fetch(`${API_URL}/devices/activation-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Mac': deviceMac
        },
        body: JSON.stringify({
          requestCode: code,
          deviceName: detectedName
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRequestSent(true);
        alert('Código de solicitud enviado al servidor de licencias. Avise al administrador para activarlo.');
      } else {
        setErrorMsg(data.message || 'Error al enviar el código de activación.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al enviar el código de activación.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-main)',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-main)'
      }}>
        <div>Verificando estado de activación de AuraStock...</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #1e1b4b 0%, var(--bg-main) 100%)',
      fontFamily: 'var(--font-main)',
      color: 'var(--color-text-main)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Círculo de fondo brillante */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--color-danger) 0%, transparent 70%)',
        filter: 'blur(100px)',
        opacity: 0.12,
        zIndex: 0
      }}></div>

      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '36px',
        textAlign: 'center',
        border: '1px solid var(--border-light)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), var(--shadow-neon)',
        position: 'relative',
        zIndex: 1
      }}>
        {success ? (
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle size={48} className="icon-pulse" />
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px' }}>Sistema Activado</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>El código de serie es válido. Redirigiendo al sistema...</p>
          </div>
        ) : (
          <form onSubmit={handleActivate}>
            <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <Shield size={40} />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>Activación Requerida</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '25px' }}>
              Los archivos de AuraStock se han copiado o instalado en un equipo nuevo. Ingrese el número de serie único del creador para habilitar la facturación.
            </p>

            {errorMsg && (
              <div className="badge-danger" style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left',
                lineHeight: '1.4'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Identificador Físico */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px dashed var(--border-light)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
              marginBottom: '15px'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Código de Solicitud del Equipo (Hex):
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-secondary)', display: 'block', marginTop: '4px', wordBreak: 'break-all', letterSpacing: '0.05em' }}>
                {encodeMacToHex(mac)}
              </span>
            </div>

            {/* Solicitar Activación */}
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.9rem',
                marginBottom: '15px',
                background: requestSent 
                  ? 'rgba(16, 185, 129, 0.15)' 
                  : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                borderColor: requestSent ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-light)',
                color: requestSent ? 'var(--color-success)' : 'white',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onClick={handleSendRequest}
              disabled={submitting || requestSent}
            >
              {requestSent ? (
                <>
                  <CheckCircle size={16} />
                  <span>Código Enviado al Administrador</span>
                </>
              ) : (
                <>
                  <Shield size={16} />
                  <span>Enviar Código al Administrador</span>
                </>
              )}
            </button>

            {/* Acciones del Código */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={handleCopyCode}
              >
                {copied ? <CheckCircle size={14} style={{ color: 'var(--color-success)' }} /> : <Key size={14} />}
                <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>
              
              <a
                href={`https://wa.me/?text=Hola%20Administrador,%20solicito%20la%20activación%20de%20mi%20equipo%20en%20AuraStock.%20Mi%20código%20de%20solicitud%20es:%20${encodeMacToHex(mac)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.3)' }}
              >
                <span>Enviar por WhatsApp</span>
              </a>
            </div>

            {/* Input Serial */}
            <div className="input-group" style={{ textAlign: 'left', marginBottom: '25px' }}>
              <label className="input-label" style={{ fontSize: '0.8rem' }}>Número de Serie de Activación</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <Key size={16} />
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="AST-XXXX-XXXX-XXXX-XXXX"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value.toUpperCase())}
                  required
                  style={{ paddingLeft: '38px', width: '100%', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                  disabled={submitting}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              disabled={submitting || !serial.trim()}
            >
              {submitting ? 'Verificando Clave...' : 'Activar Licencia del Equipo'}
            </button>

            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <Link
                to="/login"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>Ingresar como Administrador</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Activation;
