import os from 'os';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';
import Device from '../models/Device.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
import ActivationRequest from '../models/ActivationRequest.js';

dotenv.config();

const execPromise = util.promisify(exec);

const LICENSE_FILE = path.join(process.cwd(), '.licencia');
const SECRET_SALT = process.env.LICENSE_SECRET_SALT || 'AuraStockLicensingSalt2026';

// Serial Maestro (Master Key) para el Creador, sirve para activar cualquier máquina
export const MASTER_SERIAL = process.env.LICENSE_MASTER_SERIAL || 'AST-MASTER-KEY-CREATOR-9999';

// Direcciones MAC exceptuadas para auto-autorización de dispositivo (iPhone XR del dueño)
export const BYPASS_MACS = ['f8:2d:7c:b0:ca:ff', 'f8:2d:7c:b1:be:c1'];

// Obtiene la dirección MAC física principal del servidor
export const getServerMac = () => {
  const interfaces = os.networkInterfaces();
  
  // Buscar primero en Wi-Fi o Ethernet físico
  const preferredKeywords = ['wi-fi', 'wifi', 'ethernet', 'local', 'conexión', 'enlace'];
  const sortedNames = Object.keys(interfaces).sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aPref = preferredKeywords.some(kw => aLower.includes(kw));
    const bPref = preferredKeywords.some(kw => bLower.includes(kw));
    if (aPref && !bPref) return -1;
    if (!aPref && bPref) return 1;
    return 0;
  });

  for (const name of sortedNames) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
        return iface.mac.toUpperCase();
      }
    }
  }

  // Buscar cualquier interfaz física
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.mac && iface.mac !== '00:00:00:00:00:00' && !iface.internal) {
        return iface.mac.toUpperCase();
      }
    }
  }

  return '80:D0:4A:0F:72:48'; // Fallback por defecto
};

// Limpia guiones y dos puntos de la MAC
export const cleanMacAddress = (mac) => {
  return (mac || '').replace(/[:-]/g, '').toUpperCase();
};

// Convierte una MAC en un código hexadecimal de solicitud
export const encodeMacToHex = (mac) => {
  if (!mac) return '';
  const clean = mac.replace(/[:-]/g, '').toUpperCase();
  return Array.from(clean)
    .map(c => c.charCodeAt(0).toString(16))
    .join('')
    .toUpperCase();
};

// Convierte un código hexadecimal de solicitud de vuelta a la dirección MAC original (con dos puntos)
export const decodeHexToMac = (hex) => {
  if (!hex) return '';
  try {
    const cleanHex = hex.trim().toLowerCase();
    let clean = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
      clean += String.fromCharCode(parseInt(cleanHex.substr(i, 2), 16));
    }
    clean = clean.toUpperCase();
    // Insertar dos puntos cada 2 caracteres
    const parts = [];
    for (let i = 0; i < clean.length; i += 2) {
      parts.push(clean.substr(i, 2));
    }
    return parts.join(':');
  } catch (err) {
    console.error('Error al decodificar MAC desde hex:', err);
    return '';
  }
};

// Genera un número de serie único atado a la MAC del servidor
export const generateSerialForMac = (mac) => {
  const clean = cleanMacAddress(mac);
  const hash = crypto.createHash('sha256').update(clean + SECRET_SALT).digest('hex').toUpperCase();
  // Formato: AST-XXXX-XXXX-XXXX-XXXX
  return `AST-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`;
};

// Verifica si la licencia actual es válida
export const isSystemActivated = () => {
  try {
    if (!fs.existsSync(LICENSE_FILE)) {
      return false;
    }
    const savedKey = fs.readFileSync(LICENSE_FILE, 'utf8').trim();
    if (!savedKey) return false;

    // Si coincide con el Serial Maestro
    if (savedKey === MASTER_SERIAL) {
      return true;
    }

    // Si coincide con el serial específico para la MAC actual
    const currentMac = getServerMac();
    const validSerial = generateSerialForMac(currentMac);
    return savedKey === validSerial;
  } catch (err) {
    console.error('Error al verificar la licencia:', err);
    return false;
  }
};

// Activa el sistema con una clave
export const activateSystem = (serial) => {
  const currentMac = getServerMac();
  const validSerial = generateSerialForMac(currentMac);
  const cleanSerial = (serial || '').trim();

  if (cleanSerial === MASTER_SERIAL || cleanSerial === validSerial) {
    fs.writeFileSync(LICENSE_FILE, cleanSerial, 'utf8');
    return true;
  }
  return false;
};

// Helper para buscar un dispositivo por IP o por MAC desde la tabla ARP
export const getClientDevice = async (clientIp, clientMacHeader = '') => {
  let clientMac = (clientMacHeader || '').trim().toLowerCase().replace(/-/g, ':');
  
  if (!clientMac) {
    try {
      const { stdout } = await execPromise('arp -a');
      const lines = stdout.split('\n');
      const regex = /(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2})/i;
      for (const line of lines) {
        const match = regex.exec(line);
        if (match && match[1] === clientIp) {
          clientMac = match[2].toUpperCase().replace(/-/g, ':').toLowerCase();
          break;
        }
      }
    } catch (err) {
      console.warn('Error al leer la tabla ARP para resolver el dispositivo:', err.message);
    }
  }

  if (clientMac) {
    const deviceByMac = await Device.findOne({ mac: clientMac });
    if (deviceByMac) {
      if (BYPASS_MACS.includes(clientMac) && !deviceByMac.isAuthorized) {
        deviceByMac.isAuthorized = true;
      }
      if (deviceByMac.ip !== clientIp) {
        deviceByMac.ip = clientIp;
      }
      deviceByMac.lastSeen = new Date();
      await deviceByMac.save();
      return deviceByMac;
    } else if (BYPASS_MACS.includes(clientMac)) {
      const newDev = await Device.create({
        serialNumber: `DEV-IPHONE-XR-${clientMac.replace(/:/g, '').toUpperCase().substring(0, 4)}`,
        mac: clientMac,
        ip: clientIp,
        name: 'iPhone XR del Dueño',
        connectionType: 'wifi',
        isAuthorized: true,
        lastSeen: new Date()
      });
      return newDev;
    } else {
      // Registrar nuevo dispositivo con la MAC provista en lugar de caer al buscar por IP
      const bytes = crypto.randomBytes(6).toString('hex').toUpperCase();
      const serialNumber = `DEV-${bytes.substring(0, 4)}-${bytes.substring(4, 8)}-${bytes.substring(8, 12)}`;
      const newDev = await Device.create({
        serialNumber,
        mac: clientMac,
        ip: clientIp,
        name: `Terminal Detectada (${clientIp})`,
        connectionType: 'wifi',
        isAuthorized: false,
        lastSeen: new Date()
      });
      console.log(`Auto-registrado nuevo dispositivo no autorizado por MAC: ${serialNumber} - MAC: ${newDev.mac}`);
      
      // Auto-registrar solicitud de activación en estado pendiente
      try {
        const reqCode = encodeMacToHex(clientMac);
        const existingReq = await ActivationRequest.findOne({ requestCode: reqCode });
        if (!existingReq) {
          await ActivationRequest.create({
            requestCode: reqCode,
            deviceName: `Terminal Detectada (${clientIp})`,
            ip: clientIp,
            status: 'pending'
          });
          console.log(`Auto-creada solicitud de activación para MAC: ${clientMac}`);
        } else if (existingReq.status === 'rejected') {
          existingReq.status = 'pending';
          existingReq.ip = clientIp;
          await existingReq.save();
          console.log(`Restaurada solicitud de activación rechazada para MAC: ${clientMac}`);
        }
      } catch (reqErr) {
        console.error('Error al auto-crear solicitud de activación en getClientDevice:', reqErr);
      }

      return newDev;
    }
  }

  // Solo si no hay MAC, buscar por IP
  const deviceByIp = await Device.findOne({ ip: clientIp });
  if (deviceByIp) {
    if (deviceByIp.mac && BYPASS_MACS.includes(deviceByIp.mac) && !deviceByIp.isAuthorized) {
      deviceByIp.isAuthorized = true;
      await deviceByIp.save();
    }
    return deviceByIp;
  }

  // Si es un dispositivo nuevo y es una red remota
  if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1' && clientIp !== 'localhost') {
    const bytes = crypto.randomBytes(6).toString('hex').toUpperCase();
    const serialNumber = `DEV-${bytes.substring(0, 4)}-${bytes.substring(4, 8)}-${bytes.substring(8, 12)}`;
    
    // Generar MAC virtual única
    const finalMac = `00:e0:${crypto.randomBytes(4).toString('hex').match(/.{1,2}/g).join(':')}`.toLowerCase();
    
    const newDev = await Device.create({
      serialNumber,
      mac: finalMac,
      ip: clientIp,
      name: `Terminal Detectada (${clientIp})`,
      connectionType: 'wifi',
      isAuthorized: false,
      lastSeen: new Date()
    });
    
    console.log(`Auto-registrado nuevo dispositivo no autorizado por IP: ${serialNumber} - MAC: ${newDev.mac}`);
    
    // Auto-registrar solicitud de activación para MAC virtual
    try {
      const reqCode = encodeMacToHex(finalMac);
      const existingReq = await ActivationRequest.findOne({ requestCode: reqCode });
      if (!existingReq) {
        await ActivationRequest.create({
          requestCode: reqCode,
          deviceName: `Terminal Detectada (${clientIp})`,
          ip: clientIp,
          status: 'pending'
        });
        console.log(`Auto-creada solicitud de activación para MAC virtual: ${finalMac}`);
      } else if (existingReq.status === 'rejected') {
        existingReq.status = 'pending';
        existingReq.ip = clientIp;
        await existingReq.save();
        console.log(`Restaurada solicitud de activación rechazada para MAC virtual: ${finalMac}`);
      }
    } catch (reqErr) {
      console.error('Error al auto-crear solicitud de activación en getClientDevice por IP:', reqErr);
    }

    return newDev;
  }

  return null;
};

// Middleware para bloquear la API si el sistema no está activado o el dispositivo fue dado de baja / no está registrado
export const licenseMiddleware = async (req, res, next) => {
  const path = req.path;
  
  // Excluir endpoints de verificación, activación e inicio de sesión
  if (path === '/api/devices/license-status' || path === '/api/devices/activate' || path === '/api/auth/login' || path === '/api/devices/activation-requests') {
    return next();
  }

  // 1. Si la licencia global no está activa, colgar la conexión
  if (!isSystemActivated()) {
    req.socket.destroy();
    return;
  }

  // Si la licencia está activa, permitir acceso sin restricción de dispositivo al creador (angel.admin@store.com)
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforaurastockdevelopment2026');
      const user = await User.findById(decoded.id);
      if (user && user.email === 'angel.admin@store.com') {
        return next();
      }
    }
  } catch (err) {
    // Si el token es inválido o expiró, simplemente sigue el flujo normal
  }

  // 2. Verificar si el dispositivo cliente específico ha sido dado de baja o no está registrado
  try {
    const clientMacHeader = req.headers['x-device-mac'] || '';
    let clientIp = req.ip || req.socket.remoteAddress || '';
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }
    
    if (clientIp === '::1' || clientIp === '127.0.0.1' || clientIp === 'localhost') {
      const serverMac = getServerMac().toLowerCase().replace(/-/g, ':');
      const serverDevice = await Device.findOne({ mac: serverMac });
      if (serverDevice && !serverDevice.isAuthorized) {
        req.socket.destroy();
        return;
      }
    } else {
      const clientDevice = await getClientDevice(clientIp, clientMacHeader);
      if (!clientDevice || !clientDevice.isAuthorized) {
        req.socket.destroy();
        return;
      }
    }
  } catch (err) {
    console.error('Error al validar autorización de dispositivo:', err);
  }

  next();
};
