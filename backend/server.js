import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { autoSeed } from './autoSeed.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import dashboardRoutes from './routes/dashboard.js';
import cashRoutes from './routes/cash.js';
import auditRoutes from './routes/audit.js';
import mercadopagoRoutes from './routes/mercadopago.js';
import settingsRoutes from './routes/settings.js';
import devicesRoutes from './routes/devices.js';
import supplierRoutes from './routes/suppliers.js';
import priceListRoutes from './routes/pricelists.js';
import customerRoutes from './routes/customers.js';
import purchaseOrderRoutes from './routes/purchaseorders.js';
import { licenseMiddleware } from './middleware/license.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Importar SystemSettings para inicializar variables de seguridad globales
import SystemSettings from './models/SystemSettings.js';

// Inicializar configuraciones globales en memoria
global.aiProtectionsEnabled = true; // Por defecto activo

const initGlobalSettings = async () => {
  try {
    const settings = await SystemSettings.findOne();
    if (settings) {
      global.aiProtectionsEnabled = settings.aiProtectionsEnabled !== false;
      console.log(`[SEGURIDAD] Protecciones de IA inicializadas como: ${global.aiProtectionsEnabled}`);
    }
  } catch (err) {
    console.error('Error al inicializar configuraciones globales:', err.message);
  }
};

// Habilitar trust proxy para obtener la IP del cliente real detrás de proxies como Render
app.set('trust proxy', true);

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware global para colgar la conexión (socket destroy) ante bots, herramientas CLI y agentes de IA
app.use((req, res, next) => {
  // Si la protección está desactivada globalmente, saltar
  if (global.aiProtectionsEnabled === false) {
    return next();
  }

  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  
  let clientIp = req.ip || req.socket.remoteAddress || '';
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

  // Permitir siempre si proviene de localhost
  const isLocal = clientIp === '::1' || clientIp === '127.0.0.1' || clientIp === 'localhost';

  if (!isLocal) {
    const isBot = userAgent.includes('gpt') ||
                  userAgent.includes('claude') ||
                  userAgent.includes('gemini') ||
                  userAgent.includes('google-extended') ||
                  userAgent.includes('perplexity') ||
                  userAgent.includes('bot') ||
                  userAgent.includes('crawler') ||
                  userAgent.includes('spider') ||
                  userAgent.includes('scraper') ||
                  userAgent.includes('curl') ||
                  userAgent.includes('wget') ||
                  userAgent.includes('python') ||
                  userAgent.includes('axios') ||
                  userAgent.includes('node-fetch') ||
                  userAgent.includes('postman') ||
                  userAgent.includes('headless');

    if (isBot) {
      console.log(`[SEGURIDAD IA/BOT] Conexión abortada para User-Agent sospechoso: "${userAgent}" desde IP: ${clientIp}`);
      req.socket.destroy();
      return;
    }
  }

  next();
});

// Log básico de peticiones
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Conectar a MongoDB
const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurastock';
    await mongoose.connect(connStr);
    console.log(`Conectado a MongoDB con éxito en: ${connStr}`);
    // Cargar configuraciones globales desde la base de datos
    await initGlobalSettings();
    // Auto-sembrar base de datos si está vacía
    await autoSeed();
  } catch (error) {
    console.error('Error de conexión a MongoDB:', error.message);
    console.log('Por favor, asegúrate de que el servicio de MongoDB esté iniciado.');
    // No terminamos el proceso de inmediato en desarrollo para permitir depuración
  }
};

connectDB();

// Registro de enrutadores de la API (Primero el middleware de licencia para proteger el POS)
app.use(licenseMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/mercadopago', mercadopagoRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/pricelists', priceListRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchaseorders', purchaseOrderRoutes);

// Ruta de estado base
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ message: 'Recurso API no encontrado' });
});

// Lanzamiento del servidor
app.listen(PORT, () => {
  console.log(`Servidor de AuraStock corriendo en puerto ${PORT}`);
});
