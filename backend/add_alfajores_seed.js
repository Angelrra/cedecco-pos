import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const addAlfajores = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurastock';
    await mongoose.connect(connStr);
    console.log('Conectado a MongoDB para sembrar catálogo de Alfajores...');

    // Fechas de vencimiento relativas (3 meses de vencimiento promedio para alfajores)
    const expiration = new Date();
    expiration.setMonth(expiration.getMonth() + 3);

    const alfajores = [
      // === GUAYMALLÉN ===
      {
        code: '7790290000295',
        name: 'Alfajor Guaymallén Chocolate Negro 1u',
        description: 'Alfajor clásico económico Guaymallén bañado con chocolate negro y dulce de leche.',
        category: 'Kiosco',
        purchasePrice: 120,
        salePrice: 300,
        stock: 150,
        minStock: 24,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790290000301',
        name: 'Alfajor Guaymallén Blanco 1u',
        description: 'Alfajor clásico económico Guaymallén con dulce de leche y baño de repostería blanco.',
        category: 'Kiosco',
        purchasePrice: 120,
        salePrice: 300,
        stock: 150,
        minStock: 24,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790290000325',
        name: 'Alfajor Guaymallén Membrillo 1u',
        description: 'Alfajor clásico económico Guaymallén con relleno de jalea de membrillo y cobertura glaseada blanca.',
        category: 'Kiosco',
        purchasePrice: 120,
        salePrice: 300,
        stock: 100,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790290000400',
        name: 'Alfajor Guaymallén Oro Chocolate 1u',
        description: 'Alfajor premium Guaymallén Oro relleno de dulce de leche con baño de chocolate semiamargo.',
        category: 'Kiosco',
        purchasePrice: 200,
        salePrice: 450,
        stock: 80,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790290000417',
        name: 'Alfajor Guaymallén Oro Blanco 1u',
        description: 'Alfajor premium Guaymallén Oro relleno de dulce de leche con cobertura blanca.',
        category: 'Kiosco',
        purchasePrice: 200,
        salePrice: 450,
        stock: 80,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },

      // === JORGITO / JORGELÍN ===
      {
        code: '7790040125436',
        name: 'Alfajor Jorgito Chocolate Simple 1u',
        description: 'Alfajor Jorgito relleno con dulce de leche y baño de chocolate negro.',
        category: 'Kiosco',
        purchasePrice: 220,
        salePrice: 500,
        stock: 120,
        minStock: 24,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790040125443',
        name: 'Alfajor Jorgito Blanco Simple 1u',
        description: 'Alfajor Jorgito relleno con dulce de leche y merengue glaseado blanco.',
        category: 'Kiosco',
        purchasePrice: 220,
        salePrice: 500,
        stock: 100,
        minStock: 24,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790040125504',
        name: 'Alfajor Maxijorgito Negro Triple 1u',
        description: 'Alfajor Jorgito triple gigante bañado con chocolate negro y dulce de leche.',
        category: 'Kiosco',
        purchasePrice: 320,
        salePrice: 750,
        stock: 90,
        minStock: 18,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790040125511',
        name: 'Alfajor Maxijorgito Blanco Triple 1u',
        description: 'Alfajor Jorgito triple gigante bañado con merengue glaseado blanco y dulce de leche.',
        category: 'Kiosco',
        purchasePrice: 320,
        salePrice: 750,
        stock: 80,
        minStock: 18,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790040125603',
        name: 'Alfajor Jorgelín Chocolate Triple 1u',
        description: 'Alfajor triple Jorgelín con dulce de leche y cobertura sabor chocolate negro.',
        category: 'Kiosco',
        purchasePrice: 300,
        salePrice: 700,
        stock: 85,
        minStock: 18,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790040125610',
        name: 'Alfajor Jorgelín Blanco Triple 1u',
        description: 'Alfajor triple Jorgelín con dulce de leche y cobertura sabor chocolate blanco.',
        category: 'Kiosco',
        purchasePrice: 300,
        salePrice: 700,
        stock: 80,
        minStock: 18,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790040125627',
        name: 'Alfajor Jorgelín Glaseado Triple 1u',
        description: 'Alfajor triple Jorgelín con dulce de leche y cobertura glaseada blanca.',
        category: 'Kiosco',
        purchasePrice: 300,
        salePrice: 700,
        stock: 70,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },

      // === FANTOCHE ===
      {
        code: '7790217004450',
        name: 'Alfajor Fantoche Triple Chocolate Negro 1u',
        description: 'El creador del alfajor triple. Relleno con dulce de leche y bañado en chocolate negro.',
        category: 'Kiosco',
        purchasePrice: 320,
        salePrice: 750,
        stock: 110,
        minStock: 20,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790217004467',
        name: 'Alfajor Fantoche Triple Blanco 1u',
        description: 'Alfajor triple Fantoche relleno de dulce de leche con merengue glaseado blanco.',
        category: 'Kiosco',
        purchasePrice: 320,
        salePrice: 750,
        stock: 100,
        minStock: 20,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790217004559',
        name: 'Alfajor Fantoche Triple Day Semiamargo 1u',
        description: 'Alfajor triple Fantoche con chocolate semiamargo y abundante dulce de leche.',
        category: 'Kiosco',
        purchasePrice: 330,
        salePrice: 800,
        stock: 60,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790217004351',
        name: 'Alfajor Fantoche Simple Chocolate 1u',
        description: 'Alfajor simple Fantoche bañado en chocolate negro relleno con dulce de leche.',
        category: 'Kiosco',
        purchasePrice: 200,
        salePrice: 450,
        stock: 75,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790217004368',
        name: 'Alfajor Fantoche Simple Blanco 1u',
        description: 'Alfajor simple Fantoche glaseado blanco relleno con dulce de leche.',
        category: 'Kiosco',
        purchasePrice: 200,
        salePrice: 450,
        stock: 70,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },

      // === TERRABUSI / MILKA / SUCHARD ===
      {
        code: '7790040334401',
        name: 'Alfajor Terrabusi Chocolate Simple 1u',
        description: 'Alfajor relleno con dulce de leche bañado con cobertura de chocolate Terrabusi.',
        category: 'Kiosco',
        purchasePrice: 220,
        salePrice: 500,
        stock: 80,
        minStock: 15,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790380023029',
        name: 'Alfajor Terrabusi Chocolate Triple 1u',
        description: 'Alfajor triple relleno de dulce de leche con baño de chocolate semiamargo Terrabusi.',
        category: 'Kiosco',
        purchasePrice: 320,
        salePrice: 750,
        stock: 90,
        minStock: 18,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790040334418',
        name: 'Alfajor Terrabusi Glaseado Triple 1u',
        description: 'Alfajor triple relleno de dulce de leche con cobertura glaseada de azúcar.',
        category: 'Kiosco',
        purchasePrice: 320,
        salePrice: 750,
        stock: 70,
        minStock: 15,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790380022640',
        name: 'Alfajor Suchard Mousse de Chocolate 1u',
        description: 'Alfajor clásico Suchard relleno de mousse de chocolate y cobertura semiamarga.',
        category: 'Kiosco',
        purchasePrice: 400,
        salePrice: 900,
        stock: 85,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790111112616',
        name: 'Alfajor Milka Mousse Simple Negro 1u',
        description: 'Alfajor Milka relleno de mousse de chocolate cubierto con chocolate de leche Milka.',
        category: 'Kiosco',
        purchasePrice: 350,
        salePrice: 800,
        stock: 90,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790111112630',
        name: 'Alfajor Milka Oreo Triple 1u',
        description: 'Alfajor triple con galletitas Oreo y crema de vainilla bañado en chocolate con leche Milka.',
        category: 'Kiosco',
        purchasePrice: 420,
        salePrice: 950,
        stock: 100,
        minStock: 15,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790111112623',
        name: 'Alfajor Milka Mousse Triple 1u',
        description: 'Alfajor triple relleno con relleno sabor mousse de chocolate y baño Milka.',
        category: 'Kiosco',
        purchasePrice: 420,
        salePrice: 950,
        stock: 90,
        minStock: 15,
        expirationDate: expiration,
        active: true
      },

      // === TOFI / COFLER / BLOCK ===
      {
        code: '7790580131802',
        name: 'Alfajor Tofi Chocolate Negro 1u',
        description: 'Alfajor Tofi relleno de dulce de leche con baño de chocolate semiamargo.',
        category: 'Kiosco',
        purchasePrice: 320,
        salePrice: 700,
        stock: 90,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790580131819',
        name: 'Alfajor Tofi Chocolate Blanco 1u',
        description: 'Alfajor Tofi relleno de dulce de leche con baño de chocolate blanco.',
        category: 'Kiosco',
        purchasePrice: 320,
        salePrice: 700,
        stock: 80,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790580131901',
        name: 'Alfajor Cofler Block Triple 1u',
        description: 'Alfajor triple Cofler Block relleno con dulce de leche y trozos de maní picado.',
        category: 'Kiosco',
        purchasePrice: 400,
        salePrice: 900,
        stock: 110,
        minStock: 18,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790580131925',
        name: 'Alfajor Cofler Mousse Triple 1u',
        description: 'Alfajor triple Cofler relleno con mousse de chocolate y baño clásico.',
        category: 'Kiosco',
        purchasePrice: 380,
        salePrice: 850,
        stock: 75,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790580131208',
        name: 'Alfajor Bon o Bon Chocolate Negro 1u',
        description: 'Alfajor relleno con crema de maní Bon o Bon bañado con chocolate negro.',
        category: 'Kiosco',
        purchasePrice: 250,
        salePrice: 550,
        stock: 120,
        minStock: 20,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790580131215',
        name: 'Alfajor Bon o Bon Chocolate Blanco 1u',
        description: 'Alfajor relleno con crema de maní Bon o Bon bañado con chocolate blanco.',
        category: 'Kiosco',
        purchasePrice: 250,
        salePrice: 550,
        stock: 100,
        minStock: 20,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790580132007',
        name: 'Alfajor Tatín Negro 1u',
        description: 'Alfajor simple económico Tatín bañado de repostería negro.',
        category: 'Kiosco',
        purchasePrice: 120,
        salePrice: 300,
        stock: 140,
        minStock: 24,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790580132014',
        name: 'Alfajor Tatín Blanco 1u',
        description: 'Alfajor simple económico Tatín bañado de repostería blanco.',
        category: 'Kiosco',
        purchasePrice: 120,
        salePrice: 300,
        stock: 130,
        minStock: 24,
        expirationDate: expiration,
        active: true
      },

      // === AGUILA MINITORTA ===
      {
        code: '7790580131505',
        name: 'Alfajor Aguila Minitorta Clásica 1u',
        description: 'Minitorta clásica Aguila rellena de dulce de leche y mousse sabor vainilla.',
        category: 'Kiosco',
        purchasePrice: 450,
        salePrice: 1000,
        stock: 75,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790580131529',
        name: 'Alfajor Aguila Minitorta Coco 1u',
        description: 'Minitorta Aguila rellena de dulce de leche con mousse y coco rallado.',
        category: 'Kiosco',
        purchasePrice: 450,
        salePrice: 1000,
        stock: 60,
        minStock: 12,
        expirationDate: expiration,
        active: true
      },

      // === CAPITÁN DEL ESPACIO ===
      {
        code: '7790264000016',
        name: 'Alfajor Capitán del Espacio Negro 1u',
        description: 'Alfajor clásico de culto Capitán del Espacio simple chocolate.',
        category: 'Kiosco',
        purchasePrice: 280,
        salePrice: 650,
        stock: 120,
        minStock: 24,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790264000023',
        name: 'Alfajor Capitán del Espacio Blanco 1u',
        description: 'Alfajor clásico de culto Capitán del Espacio simple glaseado blanco.',
        category: 'Kiosco',
        purchasePrice: 280,
        salePrice: 650,
        stock: 110,
        minStock: 24,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790264000030',
        name: 'Alfajor Capitán del Espacio Triple Negro 1u',
        description: 'Alfajor de culto Capitán del Espacio triple bañado en chocolate negro.',
        category: 'Kiosco',
        purchasePrice: 420,
        salePrice: 950,
        stock: 90,
        minStock: 18,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790264000047',
        name: 'Alfajor Capitán del Espacio Triple Blanco 1u',
        description: 'Alfajor de culto Capitán del Espacio triple bañado en glaseado blanco.',
        category: 'Kiosco',
        purchasePrice: 420,
        salePrice: 950,
        stock: 80,
        minStock: 18,
        expirationDate: expiration,
        active: true
      },

      // === CACHAFAZ / HAVANNA ===
      {
        code: '7798094350012',
        name: 'Alfajor Cachafaz Chocolate Negro 1u',
        description: 'Alfajor premium Cachafaz relleno de abundante dulce de leche y baño de chocolate negro genuino.',
        category: 'Kiosco',
        purchasePrice: 700,
        salePrice: 1600,
        stock: 60,
        minStock: 10,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7798094350029',
        name: 'Alfajor Cachafaz Chocolate Blanco 1u',
        description: 'Alfajor premium Cachafaz relleno de abundante dulce de leche y baño de chocolate blanco puro.',
        category: 'Kiosco',
        purchasePrice: 700,
        salePrice: 1600,
        stock: 50,
        minStock: 10,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7798094350036',
        name: 'Alfajor Cachafaz de Maicena 1u',
        description: 'Alfajor premium Cachafaz de fécula de maíz relleno con dulce de leche y rebozado de coco.',
        category: 'Kiosco',
        purchasePrice: 700,
        salePrice: 1600,
        stock: 40,
        minStock: 8,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790525000224',
        name: 'Alfajor Havanna Chocolate Negro 1u',
        description: 'Alfajor premium Havanna tradicional relleno de dulce de leche con baño de chocolate semiamargo.',
        category: 'Kiosco',
        purchasePrice: 850,
        salePrice: 1950,
        stock: 50,
        minStock: 10,
        expirationDate: expiration,
        active: true
      },
      {
        code: '7790525000231',
        name: 'Alfajor Havanna Merengue Blanco 1u',
        description: 'Alfajor premium Havanna relleno de dulce de leche con baño de merengue blanco.',
        category: 'Kiosco',
        purchasePrice: 850,
        salePrice: 1950,
        stock: 40,
        minStock: 10,
        expirationDate: expiration,
        active: true
      }
    ];

    let insertedCount = 0;
    let updatedCount = 0;

    for (const prodData of alfajores) {
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

    console.log('¡Siembra del catálogo completo de Alfajores finalizada con éxito!');
    console.log(`Nuevos insertados: ${insertedCount}`);
    console.log(`Actualizados / Corregidos: ${updatedCount}`);

    await mongoose.connection.close();
    console.log('Conexión cerrada.');
  } catch (error) {
    console.error('Error al sembrar alfajores:', error);
    process.exit(1);
  }
};

addAlfajores();
