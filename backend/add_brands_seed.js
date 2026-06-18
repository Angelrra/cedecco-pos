import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const addBrandProducts = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurastock';
    await mongoose.connect(connStr);
    console.log('Conectado a MongoDB para agregar productos de marcas...');

    // Fechas de vencimiento relativas
    const inThreeMonths = new Date();
    inThreeMonths.setMonth(inThreeMonths.getMonth() + 3);

    const inSixMonths = new Date();
    inSixMonths.setMonth(inSixMonths.getMonth() + 6);

    const productsToAdd = [
      // BRAND: Coca-Cola
      {
        code: '7790890200017',
        name: 'Coca-Cola Original 1.5L',
        description: 'Bebida gaseosa refrescante sabor original tamaño mediano.',
        category: 'Bebidas',
        purchasePrice: 900,
        salePrice: 2200,
        stock: 50,
        minStock: 10,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790890200024',
        name: 'Coca-Cola Sin Azúcar 1.5L',
        description: 'Bebida gaseosa refrescante Coca-Cola sin azúcar.',
        category: 'Bebidas',
        purchasePrice: 900,
        salePrice: 2200,
        stock: 40,
        minStock: 10,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790890200031',
        name: 'Coca-Cola Original 2.25L',
        description: 'Bebida gaseosa refrescante sabor original tamaño familiar.',
        category: 'Bebidas',
        purchasePrice: 1200,
        salePrice: 2800,
        stock: 60,
        minStock: 12,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790890200048',
        name: 'Coca-Cola Sin Azúcar 500ml',
        description: 'Bebida gaseosa refrescante Coca-Cola sin azúcar tamaño chico.',
        category: 'Bebidas',
        purchasePrice: 450,
        salePrice: 1100,
        stock: 80,
        minStock: 15,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790890200062',
        name: 'Sprite Limón-Lima 1.5L',
        description: 'Bebida gaseosa refrescante sabor limón-lima.',
        category: 'Bebidas',
        purchasePrice: 850,
        salePrice: 2000,
        stock: 35,
        minStock: 8,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790890200079',
        name: 'Fanta Naranja 1.5L',
        description: 'Bebida gaseosa refrescante sabor naranja.',
        category: 'Bebidas',
        purchasePrice: 850,
        salePrice: 2000,
        stock: 35,
        minStock: 8,
        expirationDate: inThreeMonths,
        active: true
      },

      // BRAND: Pepsi
      {
        code: '7791813423151',
        name: 'Pepsi Cola Regular 1.5L',
        description: 'Bebida gaseosa sabor cola clásica.',
        category: 'Bebidas',
        purchasePrice: 800,
        salePrice: 1950,
        stock: 45,
        minStock: 10,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7791813423168',
        name: 'Pepsi Black 1.5L',
        description: 'Bebida gaseosa Pepsi con máximo sabor y cero azúcar.',
        category: 'Bebidas',
        purchasePrice: 800,
        salePrice: 1950,
        stock: 40,
        minStock: 10,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7791813423175',
        name: 'Pepsi Cola Regular 500ml',
        description: 'Bebida gaseosa sabor cola clásica personal.',
        category: 'Bebidas',
        purchasePrice: 400,
        salePrice: 1000,
        stock: 70,
        minStock: 15,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7791813423182',
        name: '7Up Regular 1.5L',
        description: 'Bebida gaseosa refrescante sabor lima-limón.',
        category: 'Bebidas',
        purchasePrice: 800,
        salePrice: 1950,
        stock: 30,
        minStock: 8,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7791813423199',
        name: 'Paso de los Toros Tónica 1.5L',
        description: 'Agua tónica Paso de los Toros con toque de amargor.',
        category: 'Bebidas',
        purchasePrice: 900,
        salePrice: 2100,
        stock: 25,
        minStock: 6,
        expirationDate: inThreeMonths,
        active: true
      },

      // BRAND: Arcor
      {
        code: '7790580120155',
        name: 'Galletitas Sonrisas Arcor 118g',
        description: 'Galletitas dulces rellenas sabor frutilla con caras divertidas.',
        category: 'Kiosco',
        purchasePrice: 300,
        salePrice: 650,
        stock: 45,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790580662105',
        name: 'Chocolate Arcor con Leche 80g',
        description: 'Tableta de chocolate premium con leche Arcor.',
        category: 'Kiosco',
        purchasePrice: 500,
        salePrice: 1100,
        stock: 30,
        minStock: 6,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790580221302',
        name: 'Caramelos Masticables Surtidos Arcor (Bolsa)',
        description: 'Bolsa de caramelos masticables surtidos sabor frutal.',
        category: 'Kiosco',
        purchasePrice: 650,
        salePrice: 1300,
        stock: 20,
        minStock: 5,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790580554103',
        name: 'Bon o Bon Leche 1u',
        description: 'Bombón de chocolate con leche relleno con crema de maní.',
        category: 'Kiosco',
        purchasePrice: 90,
        salePrice: 200,
        stock: 120,
        minStock: 20,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790580442301',
        name: 'Rocklets Lentejas de Chocolate 40g',
        description: 'Lentejas de chocolate con leche confitadas con colores divertidos.',
        category: 'Kiosco',
        purchasePrice: 250,
        salePrice: 550,
        stock: 60,
        minStock: 12,
        expirationDate: inSixMonths,
        active: true
      },

      // BRAND: Terrabusi
      {
        code: '7790040112207',
        name: 'Tita Terrabusi 1u',
        description: 'Galletita dulce bañada rellena sabor limón.',
        category: 'Kiosco',
        purchasePrice: 120,
        salePrice: 280,
        stock: 100,
        minStock: 15,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040112214',
        name: 'Rhodesia Terrabusi 1u',
        description: 'Oblea dulce bañada rellena sabor limón.',
        category: 'Kiosco',
        purchasePrice: 130,
        salePrice: 300,
        stock: 90,
        minStock: 15,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040334401',
        name: 'Alfajor Terrabusi Chocolate Simple 1u',
        description: 'Alfajor relleno con dulce de leche bañado con cobertura de chocolate Terrabusi.',
        category: 'Kiosco',
        purchasePrice: 160,
        salePrice: 380,
        stock: 75,
        minStock: 12,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790040334418',
        name: 'Alfajor Terrabusi Glaseado Triple 1u',
        description: 'Alfajor triple relleno de dulce de leche con cobertura glaseada de azúcar.',
        category: 'Kiosco',
        purchasePrice: 220,
        salePrice: 500,
        stock: 50,
        minStock: 10,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790040889901',
        name: 'Galletitas Variedad Terrabusi 400g',
        description: 'Surtido clásico de galletitas dulces Terrabusi.',
        category: 'Kiosco',
        purchasePrice: 700,
        salePrice: 1450,
        stock: 25,
        minStock: 5,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040889918',
        name: 'Galletitas Melba Terrabusi 120g',
        description: 'Galletitas sabor chocolate rellenas sabor limón.',
        category: 'Kiosco',
        purchasePrice: 320,
        salePrice: 700,
        stock: 40,
        minStock: 8,
        expirationDate: inSixMonths,
        active: true
      }
    ];

    let insertedCount = 0;
    let updatedCount = 0;

    for (const prodData of productsToAdd) {
      const result = await Product.findOneAndUpdate(
        { code: prodData.code },
        { $set: prodData },
        { new: true, upsert: true, rawResult: true }
      );

      if (result.lastErrorObject && result.lastErrorObject.updatedExisting) {
        updatedCount++;
      } else {
        insertedCount++;
      }
    }

    console.log(`¡Proceso de siembra de marcas finalizado con éxito!`);
    console.log(`Total de productos nuevos insertados: ${insertedCount}`);
    console.log(`Total de productos actualizados: ${updatedCount}`);

    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada.');
  } catch (error) {
    console.error('Error cargando los productos de marcas:', error);
    process.exit(1);
  }
};

addBrandProducts();
