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
        name: 'Mouse Óptico Inalámbrico Logitech M170',
        description: 'Mouse inalámbrico compacto de 1000 DPI con conexión plug-and-play estable de 2.4 GHz.',
        category: 'Periféricos',
        purchasePrice: 4500,
        salePrice: 9500,
        stock: 35,
        minStock: 8,
        expirationDate: null,
        active: true
      },
      {
        code: '7791234500029',
        name: 'Teclado Mecánico Redragon Kumara K552 RGB',
        description: 'Teclado mecánico TKL compacto con switches Outemu Blue e iluminación RGB.',
        category: 'Periféricos',
        purchasePrice: 18000,
        salePrice: 32000,
        stock: 4,
        minStock: 5, // Gatilla alerta de stock bajo
        expirationDate: null,
        active: true
      },
      {
        code: '7790890200055',
        name: 'Pendrive Kingston DataTraveler Exodia 64GB USB 3.2',
        description: 'Memoria flash USB 3.2 Gen 1 de alta velocidad con capuchón protector y llavero de color.',
        category: 'Almacenamiento',
        purchasePrice: 3200,
        salePrice: 6800,
        stock: 80,
        minStock: 15,
        expirationDate: null,
        active: true
      },
      {
        code: '7790890200086',
        name: 'Cable HDMI 2.0 Full HD/4K 1.8 metros',
        description: 'Cable HDMI de alta velocidad con conectores dorados para transmisión de audio y video digital sin pérdida.',
        category: 'Conectividad',
        purchasePrice: 1500,
        salePrice: 3900,
        stock: 45,
        minStock: 10,
        expirationDate: null,
        active: true
      },
      {
        code: '7795432100033',
        name: 'Cartucho de Tinta HP 667XL Negro Original',
        description: 'Cartucho de tinta de alto rendimiento para impresoras HP Advantage. Rinde aprox. 480 páginas.',
        category: 'Impresión',
        purchasePrice: 12000,
        salePrice: 24500,
        stock: 6,
        minStock: 8, // Alerta stock bajo
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7795432100071',
        name: 'Resma de Papel A4 Boreal 75g (500 hojas)',
        description: 'Papel obra blanco alcalino de alta calidad, óptimo para impresiones láser y chorro de tinta.',
        category: 'Papelería',
        purchasePrice: 3500,
        salePrice: 6500,
        stock: 120,
        minStock: 20,
        expirationDate: null,
        active: true
      },
      {
        code: '7798765400041',
        name: 'Disco Sólido SSD Interno Kingston A400 480GB SATA3',
        description: 'Unidad de estado sólido de 2.5 pulgadas con velocidades de lectura de hasta 500MB/s para acelerar tu sistema.',
        category: 'Almacenamiento',
        purchasePrice: 22000,
        salePrice: 38000,
        stock: 12,
        minStock: 3,
        expirationDate: null,
        active: true
      }
    ];

    await Product.insertMany(mockProducts);
    console.log('¡Productos sembrados con éxito en la base de datos!');

    // Crear un usuario vendedor de prueba para no requerir que registren todo a mano
    const existingSeller = await User.findOne({ email: 'vendedor@cedecco.com' });
    if (!existingSeller) {
      const sellerUser = new User({
        name: 'Vendedor Cedecco',
        email: 'vendedor@cedecco.com',
        password: 'vendedor123', // Será encriptada en pre-save
        role: 'vendedor'
      });
      await sellerUser.save();
      console.log('¡Usuario vendedor creado con éxito!');
      console.log('Email: vendedor@cedecco.com | Password: vendedor123');
    }

    // Crear un usuario administrador de prueba predeterminado
    const existingAdmin = await User.findOne({ email: 'admin@cedecco.com' });
    if (!existingAdmin) {
      const adminUser = new User({
        name: 'Administrador Cedecco',
        email: 'admin@cedecco.com',
        password: 'admin123', // Será encriptada en pre-save
        role: 'admin'
      });
      await adminUser.save();
      console.log('¡Usuario administrador creado con éxito!');
      console.log('Email: admin@cedecco.com | Password: admin123');
    }

    await mongoose.connection.close();
    console.log('Conexión cerrada. Proceso completado.');
  } catch (error) {
    console.error('Error sembrando datos:', error);
    process.exit(1);
  }
};

seedData();
