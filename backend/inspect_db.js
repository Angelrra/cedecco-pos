import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CashSession from './models/CashSession.js';
import Sale from './models/Sale.js';
import User from './models/User.js';

dotenv.config();

const inspect = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aurastock';
    await mongoose.connect(connStr);
    console.log('Conectado a MongoDB...');

    const latestSession = await CashSession.findOne().sort({ openedAt: -1 }).populate('user', 'name email');
    if (!latestSession) {
      console.log('No se encontraron sesiones de caja.');
      await mongoose.connection.close();
      return;
    }

    console.log('\n--- ÚLTIMA SESIÓN DE CAJA ---');
    console.log(`ID: ${latestSession._id}`);
    console.log(`Usuario: ${latestSession.user?.name} (${latestSession.user?.email})`);
    console.log(`Status: ${latestSession.status}`);
    console.log(`Apertura: ${latestSession.openedAt}`);
    console.log(`Cierre: ${latestSession.closedAt || 'Aún abierta'}`);
    console.log(`Monto Inicial (Apertura): $${latestSession.initialCash}`);
    console.log(`Efectivo Esperado (Static DB): $${latestSession.expectedCash}`);
    console.log(`Efectivo Real (Declarado): $${latestSession.actualCash}`);
    console.log(`Discrepancia de Efectivo: $${latestSession.discrepancy}`);

    console.log('\n--- VENTAS ASOCIADAS A ESTE TURNO ---');
    const sales = await Sale.find({
      user: latestSession.user?._id,
      createdAt: { $gte: latestSession.openedAt }
    });

    if (sales.length === 0) {
      console.log('No se encontraron ventas para este turno.');
    } else {
      let salesCash = 0;
      let salesCard = 0;
      let salesTransfer = 0;

      sales.forEach((sale, i) => {
        console.log(`Venta ${i+1}: Total $${sale.total} | Método: ${sale.paymentMethod} | Fecha: ${sale.createdAt}`);
        if (sale.paymentMethod === 'efectivo') salesCash += sale.total;
        if (sale.paymentMethod === 'tarjeta') salesCard += sale.total;
        if (sale.paymentMethod === 'transferencia') salesTransfer += sale.total;
      });

      console.log('\n--- CÓMPUTO EN TIEMPO REAL ---');
      console.log(`Total Efectivo en Ventas: $${salesCash}`);
      console.log(`Total Tarjeta en Ventas: $${salesCard}`);
      console.log(`Total Transferencia en Ventas: $${salesTransfer}`);
      console.log(`Esperado Total Físico (Fondo Inicial + Ventas Efectivo): $${latestSession.initialCash + salesCash}`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error al inspeccionar:', error);
  }
};

inspect();
