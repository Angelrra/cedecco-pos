import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const addCajasUsers = async () => {
  try {
    const cloudURI = process.env.MONGODB_URI;
    if (!cloudURI) {
      throw new Error('La variable MONGODB_URI no está definida en backend/.env');
    }

    console.log('Conectando a MongoDB Atlas en la nube...');
    await mongoose.connect(cloudURI);
    console.log('Conectado con éxito.');

    // 1. Crear Caja 1
    const emailCaja1 = 'caja1@aurastock.com';
    const existingCaja1 = await User.findOne({ email: emailCaja1 });
    if (!existingCaja1) {
      const userCaja1 = new User({
        name: 'Caja 1',
        email: emailCaja1,
        password: 'caja1', // Encriptada en pre-save
        role: 'vendedor'
      });
      await userCaja1.save();
      console.log('✔ Caja 1 creada con éxito (Email: caja1@aurastock.com | Password: caja1)');
    } else {
      console.log('ℹ Caja 1 ya existía en la base de datos.');
    }

    // 2. Crear Caja 2
    const emailCaja2 = 'caja2@aurastock.com';
    const existingCaja2 = await User.findOne({ email: emailCaja2 });
    if (!existingCaja2) {
      const userCaja2 = new User({
        name: 'Caja 2',
        email: emailCaja2,
        password: 'caja2', // Encriptada en pre-save
        role: 'vendedor'
      });
      await userCaja2.save();
      console.log('✔ Caja 2 creada con éxito (Email: caja2@aurastock.com | Password: caja2)');
    } else {
      console.log('ℹ Caja 2 ya existía en la base de datos.');
    }

    console.log('\n¡Proceso de registro finalizado!');
    await mongoose.disconnect();
    console.log('Conexión cerrada de forma segura.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error al agregar las cajas:', err.message);
    process.exit(1);
  }
};

addCajasUsers();
