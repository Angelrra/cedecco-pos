import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const addCerealAndCookies = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurastock';
    await mongoose.connect(connStr);
    console.log('Conectado a MongoDB para sembrar galletitas y barras de cereales...');

    // Fechas de vencimiento relativas
    const inFourMonths = new Date();
    inFourMonths.setMonth(inFourMonths.getMonth() + 4);

    const inSixMonths = new Date();
    inSixMonths.setMonth(inSixMonths.getMonth() + 6);

    const productsToAdd = [
      // === CATEGORY: Barras de Cereales ===
      {
        code: '7790580534204',
        name: 'Barra de Cereal Mix Arcor Frutilla 1u',
        description: 'Barra de cereales Cereal Mix sabor frutilla con base de yogur.',
        category: 'Kiosco',
        purchasePrice: 90,
        salePrice: 200,
        stock: 120,
        minStock: 20,
        expirationDate: inFourMonths,
        active: true
      },
      {
        code: '7790580534211',
        name: 'Barra de Cereal Mix Arcor Chocolate 1u',
        description: 'Barra de cereales Cereal Mix con chispas de chocolate y base de chocolate.',
        category: 'Kiosco',
        purchasePrice: 90,
        salePrice: 200,
        stock: 110,
        minStock: 20,
        expirationDate: inFourMonths,
        active: true
      },
      {
        code: '7790580534228',
        name: 'Barra de Cereal Mix Arcor Manzana 1u',
        description: 'Barra de cereales Cereal Mix sabor manzana y avena integral.',
        category: 'Kiosco',
        purchasePrice: 90,
        salePrice: 200,
        stock: 80,
        minStock: 15,
        expirationDate: inFourMonths,
        active: true
      },
      {
        code: '7790580534235',
        name: 'Barra de Cereal Mix Arcor Yogur Durazno 1u',
        description: 'Barra de cereales Cereal Mix sabor durazno con base de yogur.',
        category: 'Kiosco',
        purchasePrice: 90,
        salePrice: 200,
        stock: 90,
        minStock: 15,
        expirationDate: inFourMonths,
        active: true
      },
      {
        code: '7790060012013',
        name: 'Barra de Arroz Gallo Chocobar Leche 1u',
        description: 'Barra de arroz inflado Gallo bañada en chocolate con leche original.',
        category: 'Kiosco',
        purchasePrice: 110,
        salePrice: 250,
        stock: 100,
        minStock: 20,
        expirationDate: inFourMonths,
        active: true
      },
      {
        code: '7790060012020',
        name: 'Barra de Arroz Gallo Chocobar Blanco 1u',
        description: 'Barra de arroz inflado Gallo bañada en chocolate blanco premium.',
        category: 'Kiosco',
        purchasePrice: 110,
        salePrice: 250,
        stock: 95,
        minStock: 20,
        expirationDate: inFourMonths,
        active: true
      },
      {
        code: '7790123000548',
        name: 'Barra de Cereal Quaker Frutilla 1u',
        description: 'Barra de avena y cereal Quaker sabor frutilla ligera.',
        category: 'Kiosco',
        purchasePrice: 100,
        salePrice: 230,
        stock: 70,
        minStock: 15,
        expirationDate: inFourMonths,
        active: true
      },
      {
        code: '7790123000555',
        name: 'Barra de Cereal Quaker Chispas Chocolate 1u',
        description: 'Barra de avena y cereal Quaker con chips de chocolate.',
        category: 'Kiosco',
        purchasePrice: 100,
        salePrice: 230,
        stock: 85,
        minStock: 15,
        expirationDate: inFourMonths,
        active: true
      },
      {
        code: '7790580911029',
        name: 'Barra de Cereal Nature Valley Miel 1u',
        description: 'Barra crujiente de avena Nature Valley sabor miel importada.',
        category: 'Kiosco',
        purchasePrice: 150,
        salePrice: 350,
        stock: 50,
        minStock: 10,
        expirationDate: inFourMonths,
        active: true
      },

      // === CATEGORY: Galletas Dulces y Pepas ===
      {
        code: '7790212000541',
        name: 'Pepas Terepin con Membrillo 250g',
        description: 'Galletitas dulces tradicionales con abundante dulce de membrillo Terepin.',
        category: 'Almacén',
        purchasePrice: 380,
        salePrice: 850,
        stock: 40,
        minStock: 8,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790212000558',
        name: 'Pepas Terepin con Batata 250g',
        description: 'Galletitas dulces tradicionales con abundante dulce de batata Terepin.',
        category: 'Almacén',
        purchasePrice: 380,
        salePrice: 850,
        stock: 35,
        minStock: 8,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790320001049',
        name: 'Galletitas Cerealitas Clásicas 200g',
        description: 'Galletitas de salvado integral Cerealitas de Granix súper crocantes.',
        category: 'Almacén',
        purchasePrice: 350,
        salePrice: 790,
        stock: 50,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790320001056',
        name: 'Galletitas Cerealitas Avena y Trigo 200g',
        description: 'Galletitas integrales con avena, trigo y sésamo Cerealitas.',
        category: 'Almacén',
        purchasePrice: 360,
        salePrice: 820,
        stock: 45,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790320012014',
        name: 'Galletitas Frutigran Avena y Pasas 250g',
        description: 'Galletitas dulces integrales Frutigran con avena y pasas de uva.',
        category: 'Almacén',
        purchasePrice: 420,
        salePrice: 950,
        stock: 30,
        minStock: 8,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790320012021',
        name: 'Galletitas Frutigran Avena y Chips Chocolate 250g',
        description: 'Galletitas dulces integrales Frutigran con avena y chispas de chocolate.',
        category: 'Almacén',
        purchasePrice: 430,
        salePrice: 980,
        stock: 35,
        minStock: 8,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040112139',
        name: 'Galletitas Lincoln Bagley 153g',
        description: 'Galletitas dulces tradicionales sabor vainilla con forma de letra.',
        category: 'Almacén',
        purchasePrice: 250,
        salePrice: 550,
        stock: 50,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040112146',
        name: 'Galletitas Maná Bagley Vainilla 153g',
        description: 'Galletitas dulces secas Maná sabor vainilla clásica.',
        category: 'Almacén',
        purchasePrice: 230,
        salePrice: 520,
        stock: 60,
        minStock: 12,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040112153',
        name: 'Galletitas Maná Bagley Coco 153g',
        description: 'Galletitas dulces secas Maná con delicioso sabor a coco.',
        category: 'Almacén',
        purchasePrice: 230,
        salePrice: 520,
        stock: 55,
        minStock: 12,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040033440',
        name: 'Galletitas Rex Terrabusi Saladas 75g',
        description: 'Galletitas crackers saladas pequeñas y redondas Rex.',
        category: 'Almacén',
        purchasePrice: 180,
        salePrice: 400,
        stock: 70,
        minStock: 15,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040033457',
        name: 'Galletitas Club Social Original (3 packs)',
        description: 'Galletitas crackers saladas tipo hojaldradas Club Social.',
        category: 'Almacén',
        purchasePrice: 380,
        salePrice: 850,
        stock: 80,
        minStock: 15,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790060012037',
        name: 'Galletitas Oreo Nabisco 118g',
        description: 'Galletitas de chocolate rellenas con crema de vainilla Oreo.',
        category: 'Kiosco',
        purchasePrice: 280,
        salePrice: 600,
        stock: 60,
        minStock: 12,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790060012044',
        name: 'Galletitas Oreo Nabisco Familiar 354g',
        description: 'Galletitas Oreo en paquete familiar de tres tubos.',
        category: 'Almacén',
        purchasePrice: 700,
        salePrice: 1500,
        stock: 30,
        minStock: 6,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790060012051',
        name: 'Galletitas Pepitos Nabisco 118g',
        description: 'Galletitas dulces con abundantes chips de chocolate real Pepitos.',
        category: 'Kiosco',
        purchasePrice: 280,
        salePrice: 600,
        stock: 65,
        minStock: 12,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790060012068',
        name: 'Galletitas Pepitos Nabisco Familiar 354g',
        description: 'Galletitas Pepitos con chispas de chocolate paquete familiar.',
        category: 'Almacén',
        purchasePrice: 700,
        salePrice: 1500,
        stock: 30,
        minStock: 6,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790580662136',
        name: 'Galletitas Tentaciones Chocolate Arcor 170g',
        description: 'Galletitas dulces rellenas premium Tentaciones sabor chocolate.',
        category: 'Almacén',
        purchasePrice: 400,
        salePrice: 900,
        stock: 40,
        minStock: 8,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790580662143',
        name: 'Galletitas Tentaciones Frutilla Arcor 170g',
        description: 'Galletitas dulces rellenas premium Tentaciones sabor frutilla.',
        category: 'Almacén',
        purchasePrice: 400,
        salePrice: 900,
        stock: 35,
        minStock: 8,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790060012075',
        name: 'Galletitas Toddy con Chispas Chocolate 210g',
        description: 'Galletitas americanas súper crocantes con chispas gigantes de chocolate Toddy.',
        category: 'Almacén',
        purchasePrice: 550,
        salePrice: 1200,
        stock: 45,
        minStock: 10,
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

    console.log(`¡Siembra de galletitas y barras de cereales en MongoDB finalizada!`);
    console.log(`Nuevos productos de galletitas/barras insertados: ${insertedCount}`);
    console.log(`Productos actualizados: ${updatedCount}`);

    await mongoose.connection.close();
    console.log('Conexión cerrada.');
  } catch (error) {
    console.error('Error cargando cereales y galletas:', error);
    process.exit(1);
  }
};

addCerealAndCookies();
