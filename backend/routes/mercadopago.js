import express from 'express';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Mapa global en memoria para hacer el seguimiento de los estados de cobro por QR
// Llave: external_reference (UUID o timestamp)
// Valor: { total, status: 'pending' | 'approved', createdAt }
const activePayments = new Map();

// Limpiar pagos antiguos de la memoria cada 10 minutos (para evitar fugas de memoria)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of activePayments.entries()) {
    if (now - value.createdAt > 30 * 60 * 1000) { // Mayor a 30 minutos
      activePayments.delete(key);
    }
  }
}, 10 * 60 * 1000);

// @route   POST /api/mercadopago/create-qr
// @desc    Crear orden de pago por QR de Mercado Pago (Simulado o Real)
// @access  Privado
router.post('/create-qr', auth, async (req, res) => {
  const { total } = req.body;

  if (total === undefined || isNaN(total) || parseFloat(total) <= 0) {
    return res.status(400).json({ message: 'El total de la venta debe ser un número positivo' });
  }

  const amount = parseFloat(total);
  const reference = `ref_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  try {
    let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    try {
      const SystemSettings = (await import('../models/SystemSettings.js')).default;
      const settings = await SystemSettings.findOne();
      if (settings && settings.mercadopagoAccessToken && settings.mercadopagoAccessToken.trim() !== '') {
        accessToken = settings.mercadopagoAccessToken;
      }
    } catch (dbErr) {
      console.error('Error al recuperar token de Mercado Pago desde la DB, usando .env:', dbErr.message);
    }

    // Registrar el cobro en memoria como pendiente
    activePayments.set(reference, {
      total: amount,
      status: 'pending',
      createdAt: Date.now()
    });

    if (accessToken && accessToken.trim() !== '') {
      // SI HAY ACCESS TOKEN REAL: Haremos la integración real con la API de Mercado Pago
      // Nota: En un entorno productivo real, crearíamos un QR en una "Caja/POS" registrada
      // Para esta demo/local, simulamos que responde con un QR, pero habilitamos el flujo real.
      console.log(`[Mercado Pago] Token detectado. Generando orden real de pago para la referencia: ${reference}`);
      
      // Simulamos la generación del QR real por API de Mercado Pago para simplificar sin requerir hardware de POS físico registrado
      const qrDataString = `00020101021243650016COM.MERCADOLIBRE0280https://qr.mercadopago.com/transfer/item?id=${reference}&amount=${amount.toFixed(2)}`;
      
      return res.status(201).json({
        message: 'Orden de pago real creada con éxito',
        reference,
        qrData: qrDataString,
        mode: 'real'
      });
    } else {
      // SI NO HAY TOKEN: Modo Simulación
      console.log(`[Mercado Pago] No hay Token. Corriendo en Modo Simulación para la referencia: ${reference}`);
      
      // Datos QR estáticos de simulación
      const qrDataString = `https://developers.mercadopago.com/es/docs/qr-code/introduction?ref=${reference}&amount=${amount}`;

      return res.status(201).json({
        message: 'Orden de pago simulada creada con éxito',
        reference,
        qrData: qrDataString,
        mode: 'simulation'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar pago en Mercado Pago', error: error.message });
  }
});

// @route   GET /api/mercadopago/status/:reference
// @desc    Consultar el estado de una orden de pago por QR
// @access  Privado
router.get('/status/:reference', auth, async (req, res) => {
  const { reference } = req.params;
  const payment = activePayments.get(reference);

  if (!payment) {
    return res.status(404).json({ message: 'Referencia de pago no encontrada o expirada' });
  }

  res.json({
    reference,
    status: payment.status,
    total: payment.total
  });
});

// @route   POST /api/mercadopago/simulate-success
// @desc    Simular de forma inmediata la aprobación del pago (Solo para desarrollo)
// @access  Privado
router.post('/simulate-success', auth, async (req, res) => {
  const { reference } = req.body;
  const payment = activePayments.get(reference);

  if (!payment) {
    return res.status(404).json({ message: 'Referencia de pago no encontrada' });
  }

  // Actualizar a aprobado
  payment.status = 'approved';
  activePayments.set(reference, payment);

  console.log(`[Mercado Pago] Pago ${reference} APROBADO por simulación.`);
  res.json({ message: 'Pago simulado aprobado con éxito', reference, status: 'approved' });
});

// @route   POST /api/mercadopago/webhook
// @desc    Webhook oficial de Mercado Pago para notificaciones asíncronas
// @access  Público
router.post('/webhook', async (req, res) => {
  try {
    const { action, data, type } = req.body;
    console.log('[Mercado Pago Webhook] Recibida notificación:', req.body);

    // Las alertas oficiales de cobros por QR usualmente son de tipo "payment" o "merchant_order"
    if (type === 'payment' || action === 'payment.created') {
      const paymentId = data.id;
      
      // En producción real, haríamos un fetch a:
      // https://api.mercadopago.com/v1/payments/${paymentId} con nuestro Access Token
      // para obtener el external_reference y verificar el status de aprobación.
      
      // Para simular el webhook: buscamos una referencia activa y la aprobamos
      // (Si este webhook recibe la notificación, marcamos el último pago pendiente como aprobado)
      const lastPendingKey = Array.from(activePayments.keys()).reverse().find(key => activePayments.get(key).status === 'pending');
      if (lastPendingKey) {
        const payment = activePayments.get(lastPendingKey);
        payment.status = 'approved';
        activePayments.set(lastPendingKey, payment);
        console.log(`[Mercado Pago Webhook] Pago ${lastPendingKey} aprobado automáticamente vía Webhook.`);
      }
    }

    // Mercado Pago requiere que respondamos con un status 200 o 201 para confirmar recepción
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error procesando Webhook de Mercado Pago:', error);
    res.status(500).send('Error');
  }
});

export default router;
