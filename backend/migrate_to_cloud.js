import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import User from './models/User.js';

dotenv.config();

const migrate = async () => {
  let localProducts = [];
  let localUsers = [];

  try {
    // 1. Conectar a la base de datos LOCAL
    console.log('=== PASO 1: CONECTANDO A LA BASE DE DATOS LOCAL ===');
    const localURI = 'mongodb://127.0.0.1:27017/aurastock';
    await mongoose.connect(localURI);
    console.log('Conectado con éxito a la base de datos LOCAL.');

    // Descargar productos y usuarios
    localProducts = await Product.find({}).lean();
    localUsers = await User.find({}).lean();

    console.log(`Descargados de tu PC: ${localProducts.length} productos y ${localUsers.length} usuarios.`);
    
    // Desconectarse de local
    await mongoose.disconnect();
    console.log('Desconectado de la base de datos LOCAL.\n');

  } catch (err) {
    console.error('❌ Error al leer datos locales. Asegúrate de que el servicio de MongoDB local esté encendido.', err.message);
    process.exit(1);
  }

  // 2. Preparar los datos e insertar a Pepsi si no existe
  console.log('=== PASO 2: AGREGANDO PRODUCTO PEPSI ===');
  const hasPepsi = localProducts.some(p => p.code === '7790890200154' || p.name.toLowerCase().includes('pepsi'));
  
  if (!hasPepsi) {
    const inSixMonths = new Date();
    inSixMonths.setMonth(inSixMonths.getMonth() + 6);
    
    const pepsiProduct = {
      code: '7790890200154',
      name: 'Pepsi Regular 500ml',
      description: 'Bebida gaseosa refrescante sabor cola Pepsi.',
      category: 'Bebidas',
      purchasePrice: 450,
      salePrice: 1100,
      stock: 80,
      minStock: 15,
      expirationDate: inSixMonths,
      active: true
    };
    
    localProducts.push(pepsiProduct);
    console.log('✅ Pepsi Regular 500ml agregada con éxito al catálogo de migración.');
  } else {
    console.log('ℹ️ Pepsi ya existía en tu catálogo local. Se conservará la existente.');
  }
  console.log('\n');

  // 3. Conectar a la base de datos en la NUBE (Atlas)
  try {
    console.log('=== PASO 3: CONECTANDO A MONGODB ATLAS (NUBE) ===');
    const cloudURI = process.env.MONGODB_URI;
    if (!cloudURI || cloudURI.includes('localhost') || cloudURI.includes('127.0.0.1')) {
      throw new Error('La variable MONGODB_URI en backend/.env no es una dirección válida de Atlas.');
    }

    await mongoose.connect(cloudURI);
    console.log('Conectado con éxito a MONGODB ATLAS en la nube.');

    // Limpiar colecciones en la nube
    console.log('Limpiando catálogo antiguo de la nube...');
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('Catálogo de la nube limpio.');

    // Insertar los productos y usuarios migrados
    console.log('Subiendo productos a la nube...');
    await Product.insertMany(localProducts);
    
    console.log('Subiendo usuarios a la nube...');
    await User.insertMany(localUsers);

    console.log('\n==================================================');
    console.log('🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO ABSOLUTO!');
    console.log(`Subidos a internet: ${localProducts.length} productos (incluida Pepsi) y ${localUsers.length} usuarios.`);
    console.log('==================================================');

    await mongoose.disconnect();
    console.log('Conexión con la nube cerrada de forma segura.');

  } catch (err) {
    console.error('❌ Error al subir los datos a MongoDB Atlas en la nube:', err.message);
    process.exit(1);
  }
};

migrate();
