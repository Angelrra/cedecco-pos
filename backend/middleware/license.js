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

// Helper para buscar un dispositivo por IP o por MAC
export const getClientDevice = async (clientIp, clientMacHeader = '') => {
  let clientMac = (clientMacHeader || '').trim().toLowerCase().replace(/-/g, ':');

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
      // Registrar nuevo dispositivo con la MAC provista
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

  // Solo si no hay MAC y no es localhost, buscar por IP
  if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1' && clientIp !== 'localhost') {
    const deviceByIp = await Device.findOne({ ip: clientIp });
    if (deviceByIp) {
      if (deviceByIp.mac && BYPASS_MACS.includes(deviceByIp.mac) && !deviceByIp.isAuthorized) {
        deviceByIp.isAuthorized = true;
        await deviceByIp.save();
      }
      return deviceByIp;
    }

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

// Busca la MAC física de una IP en la tabla ARP del sistema
export const getMacFromArp = async (ip) => {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return '';
  }
  try {
    const { stdout } = await execPromise(`arp -a ${ip}`);
    const lines = stdout.split('\n');
    const regex = /([0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2})/i;
    for (const line of lines) {
      const match = regex.exec(line);
      if (match) {
        return match[1].toUpperCase().replace(/-/g, ':').toLowerCase();
      }
    }
  } catch (err) {
    console.warn(`No se pudo resolver la MAC física por ARP para la IP ${ip}:`, err.message);
  }
  return '';
};

// Obtiene la MAC física real (para localhost o LAN) o virtual (de cabeceras) del cliente de manera unificada
export const resolveClientMac = async (req) => {
  let clientIp = req.ip || req.socket.remoteAddress || '';
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

  // 1. Intentar resolver la MAC física real del dispositivo desde la tabla ARP (para clientes locales en la misma LAN)
  if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1' && clientIp !== 'localhost') {
    const arpMac = await getMacFromArp(clientIp);
    if (arpMac) {
      console.log(`[ARP LOG] Resuelta MAC física "${arpMac}" para la IP local "${clientIp}"`);
      return arpMac;
    }
  }

  // 2. Usar la cabecera X-Device-Mac si existe (incluso en localhost) para permitir desarrollo local multiequipo
  const clientMacHeader = req.headers['x-device-mac'] || '';
  if (clientMacHeader) {
    return clientMacHeader.trim().toLowerCase().replace(/-/g, ':');
  }

  // 3. Si es localhost y no hay cabecera, devolvemos la MAC física del servidor
  if (clientIp === '::1' || clientIp === '127.0.0.1' || clientIp === 'localhost') {
    return getServerMac().toLowerCase().replace(/-/g, ':');
  }

  return '';
};

// Middleware para bloquear la API si el sistema no está activado o el dispositivo fue dado de baja / no está registrado
export const licenseMiddleware = async (req, res, next) => {
  // Permitir omitir la validación de licencias y dispositivos en entornos de nube (Render/Vercel)
  if (process.env.BYPASS_LICENSE === 'true') {
    return next();
  }

  // Permitir peticiones OPTIONS (CORS Preflight) sin validar dispositivo
  if (req.method === 'OPTIONS') {
    return next();
  }

  const path = req.path;
  
  // Excluir endpoints de verificación, activación e inicio de sesión
  if (path === '/api/devices/license-status' || path === '/api/devices/activate' || path === '/api/auth/login' || path === '/api/devices/activation-requests') {
    return next();
  }

  // Si el usuario está logueado como creador o administrador, permitir acceso completo (bypass de licencias y dispositivos)
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforaurastockdevelopment2026');
      const user = await User.findById(decoded.id);
      if (user && (user.email === 'admin@cedecco.com' || user.role === 'admin')) {
        return next();
      }
    }
  } catch (err) {
    // Si el token es inválido o expiró, simplemente sigue el flujo normal
  }

  // 1. Si la licencia global no está activa, colgar la conexión
  if (!isSystemActivated()) {
    return res.status(403).json({ locked: true, message: 'La licencia global del sistema no está activa.' });
  }

  // 2. Verificar si el dispositivo cliente específico ha sido dado de baja o no está registrado
  try {
    const cleanMac = await resolveClientMac(req);

    if (!cleanMac) {
      return res.status(403).json({ locked: true, message: 'No se detectó el identificador del equipo (MAC).' });
    }

    let clientIp = req.ip || req.socket.remoteAddress || '';
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }

    const clientDevice = await getClientDevice(clientIp, cleanMac);
    if (!clientDevice || !clientDevice.isAuthorized) {
      return res.status(403).json({ locked: true, message: 'Este dispositivo no está autorizado para operar en el Punto de Venta.' });
    }

    // Decodificar el token para rastrear qué usuario activo está haciendo la petición
    let loggedInUser = null;
    try {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforaurastockdevelopment2026');
        const user = await User.findById(decoded.id);
        if (user) {
          loggedInUser = user;
        }
      }
    } catch (err) {
      // Ignorar errores del token
    }

    // Actualizar IP, lastSeen, activeUser y lastActive
    let needsSave = false;
    if (clientDevice.ip !== clientIp) {
      clientDevice.ip = clientIp;
      needsSave = true;
    }

    const newActiveUser = loggedInUser ? loggedInUser._id : null;
    const now = new Date();
    
    // Comparar IDs de usuario de manera segura
    const currentActiveUserId = clientDevice.activeUser ? clientDevice.activeUser.toString() : '';
    const targetActiveUserId = newActiveUser ? newActiveUser.toString() : '';

    if (
      currentActiveUserId !== targetActiveUserId ||
      !clientDevice.lastActive ||
      (now - clientDevice.lastActive) > 5000
    ) {
      clientDevice.activeUser = newActiveUser;
      clientDevice.lastActive = loggedInUser ? now : null;
      needsSave = true;
    }

    clientDevice.lastSeen = now;
    needsSave = true;

    if (needsSave) {
      await clientDevice.save();
    }
  } catch (err) {
    console.error('Error al validar autorización de dispositivo:', err);
    return res.status(500).json({ message: 'Error al validar autorización de dispositivo' });
  }

  next();
};
