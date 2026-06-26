import express from 'express';
import SystemSettings from '../models/SystemSettings.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Helper to ensure a settings document exists
const getOrCreateSettings = async () => {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = new SystemSettings({
      ticketName: 'CEDECCO INSUMOS INFORMÁTICOS',
      ticketAddress: 'Av. del Puerto 1234, CABA',
      ticketPhone: 'Tel: 4567-8910',
      mercadopagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
    });
    await settings.save();
  }
  return settings;
};

// @route   GET /api/settings
// @desc    Obtener configuración del sistema (Ticket y MP)
// @access  Privado (Cualquier usuario autenticado)
router.get('/', auth, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    
    // Objeto seguro para devolver
    const responseSettings = {
      ticketName: settings.ticketName,
      ticketAddress: settings.ticketAddress,
      ticketPhone: settings.ticketPhone,
      aiProtectionsEnabled: settings.aiProtectionsEnabled !== false
    };

    // Solo el admin puede ver el token de Mercado Pago completo por seguridad
    if (req.user.role === 'admin') {
      responseSettings.mercadopagoAccessToken = settings.mercadopagoAccessToken;
    } else {
      // Para otros roles, podemos decir si está configurado o no de forma segura
      responseSettings.mercadopagoConfigured = !!settings.mercadopagoAccessToken;
    }

    res.json(responseSettings);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener configuraciones', error: error.message });
  }
});

// @route   POST /api/settings
// @desc    Guardar configuración del sistema (Ticket y MP)
// @access  Privado (Solo Administradores)
router.post('/', auth, adminOnly, async (req, res) => {
  const { ticketName, ticketAddress, ticketPhone, mercadopagoAccessToken, aiProtectionsEnabled } = req.body;

  try {
    const settings = await getOrCreateSettings();

    if (ticketName !== undefined) settings.ticketName = ticketName;
    if (ticketAddress !== undefined) settings.ticketAddress = ticketAddress;
    if (ticketPhone !== undefined) settings.ticketPhone = ticketPhone;
    if (mercadopagoAccessToken !== undefined) settings.mercadopagoAccessToken = mercadopagoAccessToken;
    if (aiProtectionsEnabled !== undefined) {
      settings.aiProtectionsEnabled = aiProtectionsEnabled;
      global.aiProtectionsEnabled = aiProtectionsEnabled;
    }

    await settings.save();

    res.json({
      message: 'Configuraciones guardadas con éxito',
      settings: {
        ticketName: settings.ticketName,
        ticketAddress: settings.ticketAddress,
        ticketPhone: settings.ticketPhone,
        mercadopagoAccessToken: settings.mercadopagoAccessToken,
        aiProtectionsEnabled: settings.aiProtectionsEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar configuraciones', error: error.message });
  }
});

export default router;
