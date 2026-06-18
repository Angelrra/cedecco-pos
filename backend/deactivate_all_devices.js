import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Device from './models/Device.js';
import { getServerMac, BYPASS_MACS } from './middleware/license.js';

dotenv.config();

const run = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      throw new Error('MONGODB_URI no está definido en el archivo .env');
    }

    console.log('Conectando a la base de datos...');
    await mongoose.connect(connStr);
    console.log('Conexión establecida con éxito.');

    const serverMac = getServerMac().toLowerCase().replace(/-/g, ':');
    console.log(`MAC del Servidor Principal: ${serverMac}`);
    console.log(`MACs de Bypass (iPhone XR):`, BYPASS_MACS);

    // Eliminar dispositivos que no sean el servidor ni tengan MAC en BYPASS_MACS
    const result = await Device.deleteMany({
      mac: { $nin: [serverMac, ...BYPASS_MACS.map(m => m.toLowerCase())] },
      serialNumber: { $ne: 'DEV-SRV-MAIN-9999' }
    });

    console.log(`\n======================================================`);
    console.log(`  BAJA DE DISPOSITIVOS COMPLETADA`);
    console.log(`  Se eliminaron ${result.deletedCount} dispositivos de la lista.`);
    console.log(`======================================================\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error al dar de baja los dispositivos:', error);
  }
};

run();
