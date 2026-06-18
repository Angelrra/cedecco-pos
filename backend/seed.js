import mongoose from 'mongoose';
import Product from './models/Product.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurastock';
    await mongoose.connect(connStr);
    console.log('Conectado a MongoDB para la siembra de datos...');

    // Limpiar productos existentes
    await Product.deleteMany({});
    console.log('Catálogo de productos limpio.');

    // Fechas de vencimiento relativas
    const inSixMonths = new Date();
    inSixMonths.setMonth(inSixMonths.getMonth() + 6);

    const inThreeMonths = new Date();
    inThreeMonths.setMonth(inThreeMonths.getMonth() + 3);

    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 2);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const mockProducts = [
      {
        code: '7791234500012',
        name: 'Ibuprofeno 600mg (20 comp.)',
        description: 'Analgésico y antiinflamatorio para alivio rápido de dolores intensos.',
        category: 'Farmacia',
        purchasePrice: 200,
        salePrice: 550,
        stock: 45,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7791234500029',
        name: 'Paracetamol 500mg (10 comp.)',
        description: 'Antifebril y analgésico de amplio espectro.',
        category: 'Farmacia',
        purchasePrice: 120,
        salePrice: 320,
        stock: 3,
        minStock: 8, // Gatilla alerta de stock bajo
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790890200055',
        name: 'Coca-Cola Original 500ml',
        description: 'Bebida gaseosa refrescante sabor original.',
        category: 'Bebidas',
        purchasePrice: 450,
        salePrice: 1100,
        stock: 90,
        minStock: 15,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790890200086',
        name: 'Agua Mineral Sin Gas 500ml',
        description: 'Agua mineral de manantial pura y natural.',
        category: 'Bebidas',
        purchasePrice: 250,
        salePrice: 650,
        stock: 60,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7795432100033',
        name: 'Yogur de Frutilla con Cereales 150g',
        description: 'Yogur endulzado con trozos de fruta y topping de copos de maíz crujientes.',
        category: 'Lácteos',
        purchasePrice: 300,
        salePrice: 790,
        stock: 6,
        minStock: 8, // Alerta stock bajo
        expirationDate: inTwoDays, // Gatilla alerta de vencimiento inminente (2 días)
        active: true
      },
      {
        code: '7795432100071',
        name: 'Alfajor Triple de Chocolate Suizo',
        description: 'Alfajor triple relleno de abundante dulce de leche bañado en chocolate semiamargo.',
        category: 'Kiosco',
        purchasePrice: 150,
        salePrice: 450,
        stock: 0, // Sin stock total
        minStock: 10, // Alerta
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7798765400041',
        name: 'Barra de Chocolate Blanco con Almendras',
        description: 'Chocolate premium importado con almendras seleccionadas crujientes.',
        category: 'Kiosco',
        purchasePrice: 600,
        salePrice: 1500,
        stock: 12,
        minStock: 4,
        expirationDate: yesterday, // Gatilla alerta de producto VENCIDO (ayer)
        active: true
      }
    ];

    await Product.insertMany(mockProducts);
    console.log('¡Productos sembrados con éxito en la base de datos!');

    // Crear un usuario vendedor de prueba para no requerir que registren todo a mano
    const existingSeller = await User.findOne({ email: 'vendedor@aurastock.com' });
    if (!existingSeller) {
      const sellerUser = new User({
        name: 'Cajero de Prueba',
        email: 'vendedor@aurastock.com',
        password: 'vendedor123', // Será encriptada en pre-save
        role: 'vendedor'
      });
      await sellerUser.save();
      console.log('¡Usuario vendedor creado con éxito!');
      console.log('Email: vendedor@aurastock.com | Password: vendedor123');
    }

    // Crear un usuario administrador de prueba predeterminado
    const existingAdmin = await User.findOne({ email: 'admin@aurastock.com' });
    if (!existingAdmin) {
      const adminUser = new User({
        name: 'Administrador',
        email: 'admin@aurastock.com',
        password: 'admin123', // Será encriptada en pre-save
        role: 'admin'
      });
      await adminUser.save();
      console.log('¡Usuario administrador creado con éxito!');
      console.log('Email: admin@aurastock.com | Password: admin123');
    }

    await mongoose.connection.close();
    console.log('Conexión cerrada. Proceso completado.');
  } catch (error) {
    console.error('Error sembrando datos:', error);
    process.exit(1);
  }
};

seedData();
