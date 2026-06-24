import React, { createContext, useState, useEffect, useContext } from 'react';
import { getOrGenerateDeviceMac } from '../utils/device';

const AuthContext = createContext(null);

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para el Control de Caja
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Estado para la Configuración Global (Nombre del Drugstore, etc.)
  const [systemSettings, setSystemSettings] = useState({
    ticketName: localStorage.getItem('ticketName') || 'AuraStock',
    ticketAddress: localStorage.getItem('ticketAddress') || 'Av. del Puerto 1234, CABA',
    ticketPhone: localStorage.getItem('ticketPhone') || 'Tel: 4567-8910'
  });

  // Sincronizar el token con axios u headers globales y cargar perfil si existe token
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setActiveSession(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Device-Mac': getOrGenerateDeviceMac()
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Al cargar el usuario, verificar inmediatamente su estado de caja y configuraciones
          await checkActiveSession(token);
          await fetchSystemSettings(token);
        } else {
          // Token inválido o expirado
          logout();
        }
      } catch (err) {
        console.error('Error cargando datos de usuario:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Verificar si hay una sesión de caja abierta activa
  const checkActiveSession = async (currToken = token) => {
    if (!currToken) return;
    setSessionLoading(true);
    try {
      const response = await fetch(`${API_URL}/cash/current`, {
          headers: {
            'Authorization': `Bearer ${currToken}`,
            'X-Device-Mac': getOrGenerateDeviceMac()
          }
        });
      if (response.ok) {
        const data = await response.json();
        setActiveSession(data); // data es el objeto de sesión o null
      }
    } catch (err) {
      console.error('Error verificando sesión de caja:', err);
    } finally {
      setSessionLoading(false);
    }
  };

  // Recuperar las configuraciones dinámicas de la base de datos
  const fetchSystemSettings = async (currToken = token) => {
    if (!currToken) return;
    try {
      const response = await fetch(`${API_URL}/settings`, {
          headers: {
            'Authorization': `Bearer ${currToken}`,
            'X-Device-Mac': getOrGenerateDeviceMac()
          }
        });
      if (response.ok) {
        const data = await response.json();
        setSystemSettings({
          ticketName: data.ticketName || 'AuraStock',
          ticketAddress: data.ticketAddress || 'Av. del Puerto 1234, CABA',
          ticketPhone: data.ticketPhone || 'Tel: 4567-8910'
        });
        if (data.ticketName) localStorage.setItem('ticketName', data.ticketName);
        if (data.ticketAddress) localStorage.setItem('ticketAddress', data.ticketAddress);
        if (data.ticketPhone) localStorage.setItem('ticketPhone', data.ticketPhone);
      }
    } catch (err) {
      console.error('Error cargando configuraciones de sistema:', err);
    }
  };

  // Abrir caja con monto inicial
  const openSession = async (initialCash) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/cash/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Device-Mac': getOrGenerateDeviceMac()
        },
        body: JSON.stringify({ initialCash: parseFloat(initialCash) })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al abrir caja');
      }

      setActiveSession(data.session);
      return data.session;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Cerrar caja
  const closeSession = async (actualCash, actualCard, actualTransfer, actualMercadoPago, notes) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/cash/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Device-Mac': getOrGenerateDeviceMac()
        },
        body: JSON.stringify({ 
          actualCash: parseFloat(actualCash), 
          actualCard: parseFloat(actualCard) || 0,
          actualTransfer: parseFloat(actualTransfer) || 0,
          actualMercadoPago: parseFloat(actualMercadoPago) || 0,
          notes 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cerrar caja');
      }

      setActiveSession(null);
      return data.session;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const registerUser = async (name, email, password, role) => {
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'X-Device-Mac': getOrGenerateDeviceMac()
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar usuario');
      }

      // Si no estábamos autenticados (bootstrap de primer admin), iniciamos sesión automáticamente
      if (!token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
      
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setActiveSession(null);
  };

  // Función de ayuda para peticiones API autenticadas
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Mac': getOrGenerateDeviceMac(),
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      logout();
      throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
    }

    if (response.status === 403) {
      try {
        const clonedRes = response.clone();
        const data = await clonedRes.json();
        const isCreator = user && (user.email === 'admin@cedecco.com' || user.role === 'admin');
        if (data.locked && !isCreator) {
          logout();
          window.location.href = '/activacion';
          throw new Error(data.message || 'Equipo bloqueado o dado de baja.');
        }
      } catch (err) {
        // Ignorar errores al decodificar JSON
      }
    }

    return response;
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    registerUser,
    logout,
    apiFetch,
    
    // Exportados de Control de Caja
    activeSession,
    sessionLoading,
    checkActiveSession,
    openSession,
    closeSession,

    // Configuración Global
    systemSettings,
    fetchSystemSettings
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
