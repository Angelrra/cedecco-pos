import express from 'express';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Device from '../models/Device.js';
import User from '../models/User.js';
import Router from '../models/Router.js';
import ActivationRequest from '../models/ActivationRequest.js';
import { auth, adminOnly } from '../middleware/auth.js';
import {
  getServerMac,
  generateSerialForMac,
  activateSystem,
  isSystemActivated,
  MASTER_SERIAL,
  BYPASS_MACS,
  decodeHexToMac,
  encodeMacToHex,
  resolveClientMac
} from '../middleware/license.js';

const router = express.Router();
const execPromise = util.promisify(exec);
const LICENSE_FILE = path.join(process.cwd(), '.licencia');

// Middleware para permitir el acceso únicamente al Creador del Sistema (admin@cedecco.com) o Dispositivos Maestros
const creatorOnly = async (req, res, next) => {
  if (req.user && (req.user.email === 'admin@cedecco.com' || req.user.role === 'admin')) {
    return next();
  }

  // Permitir si el dispositivo desde el que se origina la petición es maestro (iPhone XR)
  try {
    const cleanMacHeader = await resolveClientMac(req);

    if (cleanMacHeader && BYPASS_MACS.map(m => m.toLowerCase()).includes(cleanMacHeader)) {
      return next();
    }
  } catch (err) {
    console.error('Error al validar dispositivo maestro en creatorOnly:', err);
  }

  res.status(403).json({ message: 'Acceso denegado: Se requieren privilegios exclusivos de Creador (admin@cedecco.com) o Dispositivo Maestro' });
};

// Función auxiliar para parsear la salida de arp -a
const parseArpOutput = (stdout) => {
  const list = [];
  const lines = stdout.split('\n');
  const regex = /(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2}[:-][0-9a-fA-F]{2})/i;
  
  for (const line of lines) {
    const match = regex.exec(line);
    if (match) {
      list.push({
        ip: match[1],
        mac: match[2].toUpperCase().replace(/-/g, ':') // Normalizar a formato con dos puntos
      });
    }
  }
  return list;
};

// Genera un número de serie único para dispositivos clientes
const generateDeviceSerial = () => {
  const bytes = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `DEV-${bytes.substring(0, 4)}-${bytes.substring(4, 8)}-${bytes.substring(8, 12)}`;
};

// Sembrar dispositivos por defecto si no hay ninguno registrado
const seedDefaultDevices = async () => {
  const count = await Device.countDocuments();
  if (count === 0) {
    const serverMac = getServerMac().replace(/-/g, ':');
    const defaults = [
      {
        serialNumber: 'DEV-SRV-MAIN-9999',
        mac: serverMac,
        ip: '127.0.0.1',
        name: 'Servidor Principal (AuraStock POS)',
        connectionType: 'cable',
        isAuthorized: true,
        lastSeen: new Date()
      }
    ];

    await Device.insertMany(defaults);
    console.log('Sembrado Servidor Principal con éxito.');
  }
};

// Endpoint 1: Obtener estado de licencia del servidor y del dispositivo cliente (Público/No bloqueado)
router.get('/license-status', async (req, res) => {
  try {
    const active = isSystemActivated();
    const mac = getServerMac();
    let key = '';
    
    if (fs.existsSync(LICENSE_FILE)) {
      key = fs.readFileSync(LICENSE_FILE, 'utf8').trim();
    }

    let isDeviceLocked = !active;
    const cleanMacHeader = await resolveClientMac(req);

    let clientIp = req.ip || req.socket.remoteAddress || '';
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }

    let clientDevice = null;
    if (cleanMacHeader) {
      clientDevice = await Device.findOne({ mac: cleanMacHeader });
    }

    // Permitir acceso si el usuario está logueado como el creador (admin@cedecco.com / admin role) y el sistema está activado
    let isCreatorUser = false;
    try {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforaurastockdevelopment2026');
        const user = await User.findById(decoded.id);
        if (user && (user.email === 'admin@cedecco.com' || user.role === 'admin')) {
          isCreatorUser = true;
        }
      }
    } catch (err) {
      // Ignorar errores del token
    }

    if (active) {
      if (isCreatorUser) {
        isDeviceLocked = false;
      } else {
        if (!clientDevice || !clientDevice.isAuthorized) {
          isDeviceLocked = true;
        }
      }
    }

    const responseMac = active ? (clientDevice ? clientDevice.mac : cleanMacHeader || mac) : mac;

    const isMasterDevice = key === MASTER_SERIAL || 
                           (clientDevice && BYPASS_MACS.map(m => m.toLowerCase()).includes(clientDevice.mac.toLowerCase())) || 
                           BYPASS_MACS.map(m => m.toLowerCase()).includes(cleanMacHeader.toLowerCase());

    let hasPendingRequest = false;
    const checkMac = cleanMacHeader || (clientDevice ? clientDevice.mac : '');
    if (checkMac) {
      const reqCode = encodeMacToHex(checkMac);
      const reqDoc = await ActivationRequest.findOne({ requestCode: reqCode });
      if (reqDoc && reqDoc.status === 'pending') {
        hasPendingRequest = true;
      }
    }

    res.json({
      locked: isDeviceLocked,
      mac: responseMac,
      serial: key,
      isMaster: isMasterDevice,
      hasPendingRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar estado de la licencia', error: error.message });
  }
});

// Endpoint 2: Activar el sistema con un serial (Público/No bloqueado)
router.post('/activate', async (req, res) => {
  try {
    const { serial } = req.body;
    if (!serial) {
      return res.status(400).json({ success: false, message: 'Se requiere el serial de activación' });
    }

    // 1. Verificar si la clave de activación es válida para el servidor
    const success = activateSystem(serial);
    let deviceActivated = false;

    let clientIp = req.ip || req.socket.remoteAddress || '';
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }

    const cleanMacHeader = await resolveClientMac(req);
    console.log(`[DEBUG ACTIVACIÓN] Petición desde IP: "${clientIp}", MAC resuelta: "${cleanMacHeader}" con serial ingresado: "${serial}"`);

    if (!success) {
      const cleanSerial = (serial || '').trim().toUpperCase();
      console.log(`[DEBUG ACTIVACIÓN] Buscando en BD dispositivo con serial: "${cleanSerial}"`);
      const device = await Device.findOne({ serialNumber: cleanSerial });
      if (device) {
        console.log(`[DEBUG ACTIVACIÓN] Encontrado dispositivo en BD: "${device.name}" (MAC: "${device.mac}", Autorizado: ${device.isAuthorized})`);
        
        if (cleanMacHeader) {
          console.log(`[DEBUG ACTIVACIÓN] MAC resuelta para el cliente: "${cleanMacHeader}"`);
          const existingDeviceWithMac = await Device.findOne({ mac: cleanMacHeader });
          if (existingDeviceWithMac && existingDeviceWithMac.serialNumber !== device.serialNumber) {
            console.log(`[DEBUG ACTIVACIÓN] Eliminando dispositivo temporal con MAC "${cleanMacHeader}" y Serial: "${existingDeviceWithMac.serialNumber}"`);
            await Device.deleteOne({ _id: existingDeviceWithMac._id });
          }
          device.mac = cleanMacHeader;
        }

        device.isAuthorized = true;
        device.ip = clientIp;
        device.lastSeen = new Date();
        console.log(`[DEBUG ACTIVACIÓN] Guardando dispositivo autorizado: Serial: "${device.serialNumber}", MAC: "${device.mac}", IP: "${device.ip}"`);
        await device.save();
        deviceActivated = true;
      } else {
        console.log(`[DEBUG ACTIVACIÓN] No se encontró ningún dispositivo en la BD con el serial: "${cleanSerial}"`);
      }
    }

    if (!success && !deviceActivated) {
      return res.status(400).json({ success: false, message: 'Número de serie inválido para este equipo' });
    }

    if (deviceActivated) {
      return res.json({ success: true, message: '¡Dispositivo activado correctamente!' });
    }

    // 2. Si es válida la clave de servidor, registrar o autorizar el dispositivo que está solicitando la activación
    if (clientIp === '::1' || clientIp === '127.0.0.1' || clientIp === 'localhost') {
      const serverMac = getServerMac().toLowerCase().replace(/-/g, ':');
      let serverDevice = await Device.findOne({ mac: serverMac });
      if (serverDevice) {
        serverDevice.isAuthorized = true;
        serverDevice.lastSeen = new Date();
        await serverDevice.save();
      } else {
        await Device.create({
          serialNumber: 'DEV-SRV-MAIN-9999',
          mac: serverMac,
          ip: clientIp,
          name: 'Servidor Principal (AuraStock POS)',
          connectionType: 'cable',
          isAuthorized: true,
          lastSeen: new Date()
        });
      }
    } else {
      // Buscar si ya existe el dispositivo usando la MAC del header
      let device = null;
      if (cleanMacHeader) {
        device = await Device.findOne({ mac: cleanMacHeader });
      }

      if (device) {
        device.isAuthorized = true;
        device.ip = clientIp;
        device.lastSeen = new Date();
        await device.save();
      } else if (cleanMacHeader) {
        // Crear y autorizar nuevo dispositivo cliente
        device = await Device.create({
          serialNumber: generateDeviceSerial(),
          mac: cleanMacHeader,
          ip: clientIp,
          name: `Terminal Cliente (${clientIp})`,
          connectionType: 'wifi',
          isAuthorized: true,
          lastSeen: new Date()
        });
      }
    }

    res.json({ success: true, message: '¡Sistema y dispositivo activados correctamente!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error en la activación', error: error.message });
  }
});

// Endpoint 3: Obtener lista de dispositivos conectados y estado de router (Protegido Creador)
router.get('/', auth, creatorOnly, async (req, res) => {
  try {
    // Asegurar que existan al menos 4 dispositivos en la base de datos
    await seedDefaultDevices();

    let arpEntries = [];
    try {
      const { stdout } = await execPromise('arp -a');
      arpEntries = parseArpOutput(stdout);
    } catch (arpErr) {
      console.warn('Advertencia: No se pudo leer la tabla ARP:', arpErr.message);
    }

    // Buscar router IP (por lo general termina en .1, ej: 192.168.0.1 o 26.0.0.1)
    let detectedRouter = null;
    const routerIpCandidate = arpEntries.find(entry => entry.ip.endsWith('.1'));
    if (routerIpCandidate) {
      detectedRouter = {
        ip: routerIpCandidate.ip,
        mac: routerIpCandidate.mac
      };
      
      // Auto-registrar router si no existe en la BD
      const routerExists = await Router.findOne({ mac: detectedRouter.mac.toLowerCase() });
      if (!routerExists) {
        await Router.create({
          mac: detectedRouter.mac.toLowerCase(),
          ip: detectedRouter.ip,
          name: 'Router Red Local Principal',
          isAuthorized: true
        });
      }
    } else {
      // Fallback router para desarrollo
      detectedRouter = {
        ip: '192.168.0.1',
        mac: '80:D0:4A:0F:72:48'
      };
    }

    // Actualizar dispositivos en la base de datos si aparecen en la tabla ARP
    for (const entry of arpEntries) {
      const dbDevice = await Device.findOne({ mac: entry.mac.toLowerCase() });
      if (dbDevice) {
        dbDevice.ip = entry.ip;
        dbDevice.lastSeen = new Date();
        await dbDevice.save();
      }
    }

    // Cargar todos los dispositivos y routers registrados
    const devices = await Device.find().sort({ lastSeen: -1 });
    const registeredRouters = await Router.find().sort({ createdAt: -1 });

    // Determinar si el router detectado está autorizado
    const currentRouterDb = await Router.findOne({ mac: detectedRouter.mac.toLowerCase() });
    const routerAuthorized = currentRouterDb ? currentRouterDb.isAuthorized : true;

    res.json({
      devices,
      router: {
        ip: detectedRouter.ip,
        mac: detectedRouter.mac,
        isAuthorized: routerAuthorized,
        registeredRouters
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener dispositivos de red', error: error.message });
  }
});

// Endpoint 7: Registrar manualmente un nuevo dispositivo (Creador)
router.post('/', auth, creatorOnly, async (req, res) => {
  try {
    const { serialNumber, mac, name, connectionType, ip, requestCode } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Se requiere el nombre del equipo.' });
    }

    let finalMac = mac;
    if (requestCode) {
      finalMac = decodeHexToMac(requestCode);
      if (!finalMac) {
        return res.status(400).json({ message: 'El código de solicitud no es válido.' });
      }
    }

    if (!finalMac) {
      return res.status(400).json({ message: 'Se requiere la dirección MAC del equipo o un código de solicitud.' });
    }

    const cleanMac = finalMac.toLowerCase().replace(/-/g, ':');
    
    // Verificar duplicados
    const macExists = await Device.findOne({ mac: cleanMac });
    if (macExists) {
      return res.status(400).json({ message: 'Ya existe un dispositivo registrado con esa dirección MAC o código.' });
    }

    let finalSerial = serialNumber;
    if (!finalSerial) {
      finalSerial = generateDeviceSerial();
    }

    const serialExists = await Device.findOne({ serialNumber: finalSerial.trim() });
    if (serialExists) {
      return res.status(400).json({ message: 'Ya existe un dispositivo registrado con ese número de serie.' });
    }

    const newDevice = await Device.create({
      serialNumber: finalSerial.trim(),
      mac: cleanMac,
      ip: ip ? ip.trim() : '',
      name: name.trim(),
      connectionType: connectionType || 'wifi',
      isAuthorized: true,
      lastSeen: new Date()
    });

    res.status(201).json({ success: true, device: newDevice });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar dispositivo manualmente', error: error.message });
  }
});

router.put('/:id', auth, creatorOnly, async (req, res) => {
  try {
    const { name, connectionType, isAuthorized } = req.body;
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Dispositivo no encontrado' });
    }

    if (name !== undefined) device.name = name;
    if (connectionType !== undefined) device.connectionType = connectionType;
    
    if (isAuthorized === false) {
      await Device.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Dispositivo dado de baja y eliminado con éxito.' });
    } else if (isAuthorized !== undefined) {
      device.isAuthorized = isAuthorized;
    }

    await device.save();
    res.json({ success: true, device });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar dispositivo', error: error.message });
  }
});

// Endpoint 5: Agregar un Router autorizado (Creador)
router.post('/routers', auth, creatorOnly, async (req, res) => {
  try {
    const { mac, ip, name } = req.body;
    if (!mac) {
      return res.status(400).json({ message: 'Se requiere la MAC del router' });
    }

    const cleanMac = mac.toLowerCase().replace(/-/g, ':');
    let routerDb = await Router.findOne({ mac: cleanMac });

    if (routerDb) {
      routerDb.isAuthorized = true;
      if (ip) routerDb.ip = ip;
      if (name) routerDb.name = name;
      await routerDb.save();
    } else {
      routerDb = await Router.create({
        mac: cleanMac,
        ip: ip || '',
        name: name || 'Router Adicional',
        isAuthorized: true
      });
    }

    res.json({ success: true, router: routerDb });
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar router', error: error.message });
  }
});

// Endpoint 6: Remover / desautorizar un Router (Creador)
router.delete('/routers/:mac', auth, creatorOnly, async (req, res) => {
  try {
    const mac = req.params.mac.toLowerCase().replace(/-/g, ':');
    const routerDb = await Router.findOne({ mac });
    
    if (routerDb) {
      routerDb.isAuthorized = false;
      await routerDb.save();
      res.json({ success: true, message: 'Router desautorizado con éxito.' });
    } else {
      res.status(404).json({ message: 'Router no encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al remover router', error: error.message });
  }
});

// Endpoint 8: Crear o actualizar una solicitud de activación (Público/No bloqueado)
router.post('/activation-requests', async (req, res) => {
  try {
    const { requestCode, deviceName } = req.body;
    if (!requestCode) {
      return res.status(400).json({ success: false, message: 'Se requiere el código de solicitud.' });
    }

    let clientIp = req.ip || req.socket.remoteAddress || '';
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }

    // Buscar si ya existe una solicitud con ese requestCode
    let request = await ActivationRequest.findOne({ requestCode: requestCode.toUpperCase() });
    if (request) {
      request.status = 'pending';
      request.ip = clientIp;
      if (deviceName) request.deviceName = deviceName;
      await request.save();
    } else {
      request = await ActivationRequest.create({
        requestCode: requestCode.toUpperCase(),
        deviceName: deviceName || 'Dispositivo Remoto',
        ip: clientIp,
        status: 'pending'
      });
    }

    res.json({ success: true, message: 'Solicitud de activación registrada correctamente.', request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al registrar solicitud de activación', error: error.message });
  }
});

// Endpoint 9: Obtener solicitudes de activación pendientes (Creador)
router.get('/activation-requests/pending', auth, creatorOnly, async (req, res) => {
  try {
    const requests = await ActivationRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener solicitudes pendientes', error: error.message });
  }
});

// Endpoint 10: Procesar acción sobre solicitud de activación (Creador)
router.post('/activation-requests/:id/action', auth, creatorOnly, async (req, res) => {
  try {
    const { action, name, connectionType } = req.body;
    const request = await ActivationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada.' });
    }

    if (action === 'approve') {
      const decodedMac = decodeHexToMac(request.requestCode);
      if (!decodedMac) {
        return res.status(400).json({ success: false, message: 'El código de solicitud no se pudo decodificar a una MAC válida.' });
      }

      const cleanMac = decodedMac.toLowerCase().replace(/-/g, ':');

      // Buscar si ya existe el dispositivo
      let device = await Device.findOne({ mac: cleanMac });
      if (device) {
        device.isAuthorized = true;
        if (name) device.name = name;
        if (connectionType) device.connectionType = connectionType;
        device.ip = request.ip;
        device.lastSeen = new Date();
        await device.save();
      } else {
        // Crear nuevo dispositivo
        device = await Device.create({
          serialNumber: generateDeviceSerial(),
          mac: cleanMac,
          ip: request.ip || '',
          name: name || request.deviceName || 'Dispositivo Remoto Activado',
          connectionType: connectionType || 'wifi',
          isAuthorized: true,
          lastSeen: new Date()
        });
      }

      request.status = 'approved';
      await request.save();

      return res.json({ success: true, message: 'Dispositivo activado y registrado con éxito.', device });
    } else if (action === 'reject') {
      request.status = 'rejected';
      await request.save();
      return res.json({ success: true, message: 'Solicitud rechazada.' });
    } else {
      return res.status(400).json({ success: false, message: 'Acción no válida. Use "approve" o "reject".' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al procesar acción sobre la solicitud', error: error.message });
  }
});

export default router;
