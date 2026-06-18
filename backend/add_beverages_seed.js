import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const addBeverages = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurastock';
    await mongoose.connect(connStr);
    console.log('Conectado a MongoDB para sembrar bebidas de soya, alcohólicas y jugos de naranja...');

    // Fechas de vencimiento relativas
    const inThreeMonths = new Date();
    inThreeMonths.setMonth(inThreeMonths.getMonth() + 3);

    const inSixMonths = new Date();
    inSixMonths.setMonth(inSixMonths.getMonth() + 6);

    const productsToAdd = [
      // === CATEGORY: Bebidas Ades (Soya) ===
      {
        code: '7790890200505',
        name: 'Bebida de Soya Ades Manzana 1L',
        description: 'Bebida a base de soya sabor manzana con vitaminas y minerales.',
        category: 'Bebidas',
        purchasePrice: 480,
        salePrice: 1100,
        stock: 35,
        minStock: 8,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790890200512',
        name: 'Bebida de Soya Ades Durazno 1L',
        description: 'Bebida a base de soya sabor durazno cremosa y liviana.',
        category: 'Bebidas',
        purchasePrice: 480,
        salePrice: 1100,
        stock: 30,
        minStock: 8,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790890200529',
        name: 'Bebida de Soya Ades Naranja 1L',
        description: 'Bebida a base de soya sabor naranja refrescante.',
        category: 'Bebidas',
        purchasePrice: 480,
        salePrice: 1100,
        stock: 25,
        minStock: 6,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790890200536',
        name: 'Bebida de Soya Ades Multifruta 1L',
        description: 'Bebida a base de soya sabor multifruta nutritiva.',
        category: 'Bebidas',
        purchasePrice: 480,
        salePrice: 1100,
        stock: 28,
        minStock: 6,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790890200543',
        name: 'Bebida de Soya Ades Manzana 200ml',
        description: 'Bebida a base de soya sabor manzana envase individual chico.',
        category: 'Bebidas',
        purchasePrice: 150,
        salePrice: 380,
        stock: 60,
        minStock: 12,
        expirationDate: inThreeMonths,
        active: true
      },

      // === CATEGORY: Bebidas Alcohólicas ===
      {
        code: '7790045000219',
        name: 'Fernet Branca Aperitivo 750ml',
        description: 'El clásico aperitivo amargo de hierbas italiano, infaltable en el drugstore.',
        category: 'Bebidas',
        purchasePrice: 3500,
        salePrice: 7500,
        stock: 24,
        minStock: 5,
        expirationDate: inSixMonths, // Gran durabilidad
        active: true
      },
      {
        code: '7790045000226',
        name: 'Fernet Branca Aperitivo 450ml',
        description: 'Aperitivo amargo Fernet Branca tamaño mediano.',
        category: 'Bebidas',
        purchasePrice: 2400,
        salePrice: 5100,
        stock: 20,
        minStock: 5,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790110001015',
        name: 'Aperitivo Gancia Americano 950ml',
        description: 'Aperitivo clásico americano elaborado con hierbas seleccionadas.',
        category: 'Bebidas',
        purchasePrice: 1400,
        salePrice: 3200,
        stock: 18,
        minStock: 4,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790070001212',
        name: 'Aperitivo Campari Bitter 750ml',
        description: 'Aperitivo rojo amargo Campari ideal para tragos premium.',
        category: 'Bebidas',
        purchasePrice: 2200,
        salePrice: 4800,
        stock: 12,
        minStock: 3,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7792799000101',
        name: 'Cerveza Quilmes Clásica Lata 473ml',
        description: 'Cerveza rubia clásica argentina en lata helada.',
        category: 'Bebidas',
        purchasePrice: 450,
        salePrice: 1050,
        stock: 96, // 4 packs enteros
        minStock: 24,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7792799000118',
        name: 'Cerveza Corona Porrón Botella 330ml',
        description: 'Cerveza rubia premium mexicana refrescante en porrón.',
        category: 'Bebidas',
        purchasePrice: 750,
        salePrice: 1600,
        stock: 48,
        minStock: 12,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7792799000125',
        name: 'Cerveza Stella Artois Lata 473ml',
        description: 'Cerveza lager rubia premium europea Stella Artois lata.',
        category: 'Bebidas',
        purchasePrice: 650,
        salePrice: 1400,
        stock: 48,
        minStock: 12,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7792799000132',
        name: 'Cerveza Brahma Chopp Lata 473ml',
        description: 'Cerveza rubia suave Brahma refrescante lata.',
        category: 'Bebidas',
        purchasePrice: 400,
        salePrice: 950,
        stock: 72,
        minStock: 18,
        expirationDate: inThreeMonths,
        active: true
      },

      // === CATEGORY: Jugos de Naranja y Cítricos ===
      {
        code: '7798106260011',
        name: 'Jugo de Naranja Exprimido Citric 1L',
        description: 'Jugo 100% exprimidor de naranja puro sin conservantes Citric.',
        category: 'Bebidas',
        purchasePrice: 1100,
        salePrice: 2400,
        stock: 20,
        minStock: 5,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7798106260028',
        name: 'Jugo de Naranja Exprimido Citric 500ml',
        description: 'Jugo 100% exprimidor de naranja puro Citric tamaño chico.',
        category: 'Bebidas',
        purchasePrice: 600,
        salePrice: 1300,
        stock: 25,
        minStock: 6,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790550088928',
        name: 'Jugo Cepita Naranja Del Valle 1.5L',
        description: 'Jugo de naranja en cartón familiar Cepita del Valle.',
        category: 'Bebidas',
        purchasePrice: 750,
        salePrice: 1700,
        stock: 35,
        minStock: 8,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790070211055',
        name: 'Jugo en Polvo Clight Naranja 1u',
        description: 'Sobre de jugo en polvo dietético Clight sabor naranja dulce.',
        category: 'Almacén',
        purchasePrice: 80,
        salePrice: 200,
        stock: 150,
        minStock: 30,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790070211062',
        name: 'Jugo en Polvo Tang Naranja 1u',
        description: 'Sobre de jugo en polvo Tang sabor naranja clásica con vitamina C.',
        category: 'Almacén',
        purchasePrice: 80,
        salePrice: 200,
        stock: 200,
        minStock: 30,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790070211079',
        name: 'Jugo en Polvo Tang Naranja Durazno 1u',
        description: 'Sobre de jugo en polvo Tang sabor combinado naranja durazno.',
        category: 'Almacén',
        purchasePrice: 80,
        salePrice: 200,
        stock: 150,
        minStock: 30,
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

    console.log(`¡Siembra de bebidas Ades, alcohólicas y jugos en MongoDB finalizada!`);
    console.log(`Nuevos productos insertados: ${insertedCount}`);
    console.log(`Productos actualizados: ${updatedCount}`);

    await mongoose.connection.close();
    console.log('Conexión cerrada.');
  } catch (error) {
    console.error('Error cargando bebidas y jugos:', error);
    process.exit(1);
  }
};

addBeverages();
