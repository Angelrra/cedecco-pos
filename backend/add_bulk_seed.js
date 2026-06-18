import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const addBulkProducts = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurastock';
    await mongoose.connect(connStr);
    console.log('Conectado a MongoDB para sembrar productos lácteos y de almacén en masa...');

    // Fechas de vencimiento relativas
    const inTenDays = new Date();
    inTenDays.setDate(inTenDays.getDate() + 10);

    const inFifteenDays = new Date();
    inFifteenDays.setDate(inFifteenDays.getDate() + 15);

    const inThreeMonths = new Date();
    inThreeMonths.setMonth(inThreeMonths.getMonth() + 3);

    const inSixMonths = new Date();
    inSixMonths.setMonth(inSixMonths.getMonth() + 6);

    const bulkProducts = [
      // === CATEGORY: Lácteos (Yogures Bebibles y Firmes) ===
      {
        code: '7790080031803',
        name: 'Yogurt Bebible La Serenísima Frutilla 1L',
        description: 'Yogurt entero bebible sabor frutilla enriquecido con vitaminas.',
        category: 'Lácteos',
        purchasePrice: 650,
        salePrice: 1500,
        stock: 25,
        minStock: 6,
        expirationDate: inTenDays,
        active: true
      },
      {
        code: '7790080031810',
        name: 'Yogurt Bebible La Serenísima Vainilla 1L',
        description: 'Yogurt entero bebible sabor vainilla suave y nutritivo.',
        category: 'Lácteos',
        purchasePrice: 650,
        salePrice: 1500,
        stock: 20,
        minStock: 6,
        expirationDate: inTenDays,
        active: true
      },
      {
        code: '7790080031827',
        name: 'Yogurt Bebible La Serenísima Durazno 1L',
        description: 'Yogurt entero bebible sabor durazno cremoso.',
        category: 'Lácteos',
        purchasePrice: 650,
        salePrice: 1500,
        stock: 18,
        minStock: 6,
        expirationDate: inTenDays,
        active: true
      },
      {
        code: '7790080032046',
        name: 'Yogurt Firme La Serenísima Frutilla 190g',
        description: 'Yogurt batido firme sabor frutilla en vasito tradicional.',
        category: 'Lácteos',
        purchasePrice: 300,
        salePrice: 700,
        stock: 35,
        minStock: 8,
        expirationDate: inFifteenDays,
        active: true
      },
      {
        code: '7790080032053',
        name: 'Yogurt Firme La Serenísima Vainilla 190g',
        description: 'Yogurt batido firme sabor vainilla ideal para meriendas.',
        category: 'Lácteos',
        purchasePrice: 300,
        salePrice: 700,
        stock: 30,
        minStock: 8,
        expirationDate: inFifteenDays,
        active: true
      },
      {
        code: '7790080032060',
        name: 'Yogurt con Copos de Maíz La Serenísima 165g',
        description: 'Yogurt endulzado con cereales copos de maíz crujientes en el topping.',
        category: 'Lácteos',
        purchasePrice: 420,
        salePrice: 950,
        stock: 24,
        minStock: 6,
        expirationDate: inTenDays,
        active: true
      },
      {
        code: '7790080032077',
        name: 'Yogurt con Confites Rocklets La Serenísima 165g',
        description: 'Yogurt cremoso de vainilla con vasito de lentejas Rocklets.',
        category: 'Lácteos',
        purchasePrice: 450,
        salePrice: 1000,
        stock: 20,
        minStock: 6,
        expirationDate: inTenDays,
        active: true
      },
      {
        code: '7790670051802',
        name: 'Yogurt Bebible Sancor Frutilla 1L',
        description: 'Yogurt entero bebible sabor frutilla marca Sancor.',
        category: 'Lácteos',
        purchasePrice: 620,
        salePrice: 1400,
        stock: 15,
        minStock: 5,
        expirationDate: inTenDays,
        active: true
      },
      {
        code: '7790670052045',
        name: 'Yogurt Firme Sancor Durazno vasito 190g',
        description: 'Yogurt firme batido sabor durazno clásico.',
        category: 'Lácteos',
        purchasePrice: 280,
        salePrice: 650,
        stock: 25,
        minStock: 8,
        expirationDate: inFifteenDays,
        active: true
      },
      {
        code: '7790080045237',
        name: 'Postre Danette Dulce de Leche 120g',
        description: 'Cremoso postre lácteo sabor dulce de leche original.',
        category: 'Lácteos',
        purchasePrice: 380,
        salePrice: 850,
        stock: 30,
        minStock: 8,
        expirationDate: inTenDays,
        active: true
      },
      {
        code: '7790080045244',
        name: 'Postre Ser Chocolate Light 120g',
        description: 'Postre lácteo dietético sabor chocolate cero grasas.',
        category: 'Lácteos',
        purchasePrice: 390,
        salePrice: 880,
        stock: 16,
        minStock: 5,
        expirationDate: inTenDays,
        active: true
      },

      // === CATEGORY: Lácteos Generales y Quesos ===
      {
        code: '7790080000212',
        name: 'Leche Entera La Serenísima Cartón 1L',
        description: 'Leche clásica entera UAT en envase larga vida.',
        category: 'Lácteos',
        purchasePrice: 600,
        salePrice: 1300,
        stock: 80,
        minStock: 15,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790080000229',
        name: 'Leche Descremada La Serenísima Cartón 1L',
        description: 'Leche parcialmente descremada UAT 1% en envase larga vida.',
        category: 'Lácteos',
        purchasePrice: 600,
        salePrice: 1300,
        stock: 60,
        minStock: 15,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790080012017',
        name: 'Dulce de Leche La Serenísima Colonial 400g',
        description: 'Dulce de leche clásico argentino con receta tipo colonial.',
        category: 'Lácteos',
        purchasePrice: 850,
        salePrice: 1900,
        stock: 45,
        minStock: 8,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790670012025',
        name: 'Dulce de Leche Sancor Receta Casera 400g',
        description: 'Dulce de leche tradicional receta familiar.',
        category: 'Lácteos',
        purchasePrice: 800,
        salePrice: 1800,
        stock: 30,
        minStock: 8,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790080026106',
        name: 'Queso Crema Casancrem Clásico 290g',
        description: 'Queso crema blanco untable original ideal para comidas.',
        category: 'Lácteos',
        purchasePrice: 1100,
        salePrice: 2400,
        stock: 22,
        minStock: 6,
        expirationDate: inFifteenDays,
        active: true
      },
      {
        code: '7790080026113',
        name: 'Queso Crema Casancrem Light 290g',
        description: 'Queso crema blanco untable bajo en calorías y grasas.',
        category: 'Lácteos',
        purchasePrice: 1100,
        salePrice: 2400,
        stock: 25,
        minStock: 6,
        expirationDate: inFifteenDays,
        active: true
      },
      {
        code: '7790080018903',
        name: 'Manteca La Serenísima Clásica 200g',
        description: 'Pan de manteca de leche de calidad superior.',
        category: 'Lácteos',
        purchasePrice: 950,
        salePrice: 2100,
        stock: 28,
        minStock: 6,
        expirationDate: inFifteenDays,
        active: true
      },
      {
        code: '7790400002104',
        name: 'Crema de Leche Milkaut 200g',
        description: 'Crema de leche entera ideal para repostería y salsas.',
        category: 'Lácteos',
        purchasePrice: 650,
        salePrice: 1400,
        stock: 35,
        minStock: 8,
        expirationDate: inFifteenDays,
        active: true
      },
      {
        code: '7790080005408',
        name: 'Queso Rallado Reggianito La Serenísima 150g',
        description: 'Queso duro rallado finamente en hebras seleccionadas.',
        category: 'Lácteos',
        purchasePrice: 1200,
        salePrice: 2600,
        stock: 40,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },

      // === CATEGORY: Panificados y Galletitas ===
      {
        code: '7790060233050',
        name: 'Pan Lactal Bimbo Blanco Grande',
        description: 'Pan de molde lacteado clásico Bimbo ideal para tostadas.',
        category: 'Almacén',
        purchasePrice: 1100,
        salePrice: 2500,
        stock: 18,
        minStock: 5,
        expirationDate: inFifteenDays,
        active: true
      },
      {
        code: '7790060233067',
        name: 'Pan Lactal Bimbo Integrador Grande',
        description: 'Pan de molde lacteado con salvado y fibras naturales.',
        category: 'Almacén',
        purchasePrice: 1150,
        salePrice: 2600,
        stock: 15,
        minStock: 5,
        expirationDate: inFifteenDays,
        active: true
      },
      {
        code: '7790040112108',
        name: 'Galletitas Criollitas Bagley (Pack x3)',
        description: 'Pack de galletitas de agua clásicas crocantes Criollitas.',
        category: 'Almacén',
        purchasePrice: 600,
        salePrice: 1300,
        stock: 50,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040112115',
        name: 'Galletitas Express Bagley (Pack x3)',
        description: 'Pack de galletitas de agua sin sal agregada Express.',
        category: 'Almacén',
        purchasePrice: 600,
        salePrice: 1300,
        stock: 45,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040003017',
        name: 'Galletitas Chocolinas Bagley 170g',
        description: 'Galletitas dulces de chocolate originales ideales para chocotorta.',
        category: 'Almacén',
        purchasePrice: 480,
        salePrice: 1050,
        stock: 60,
        minStock: 15,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040003024',
        name: 'Galletitas Rumba Bagley 112g',
        description: 'Galletitas dulces sabor chocolate con relleno sabor coco.',
        category: 'Kiosco',
        purchasePrice: 220,
        salePrice: 480,
        stock: 40,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040003031',
        name: 'Galletitas Amor Bagley 112g',
        description: 'Galletitas dulces con relleno sabor vainilla decoradas.',
        category: 'Kiosco',
        purchasePrice: 220,
        salePrice: 480,
        stock: 40,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790040112122',
        name: 'Galletitas Traviatas Bagley 101g',
        description: 'Galletitas crackers saladas e infladas Traviatas clásicas.',
        category: 'Almacén',
        purchasePrice: 200,
        salePrice: 450,
        stock: 55,
        minStock: 12,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790440001006',
        name: 'Bizcochitos Don Satur de Grasa 200g',
        description: 'Bizcochitos salados clásicos horneados con grasa vacuna.',
        category: 'Almacén',
        purchasePrice: 380,
        salePrice: 850,
        stock: 80,
        minStock: 20,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790440001013',
        name: 'Bizcochitos Don Satur Dulces 200g',
        description: 'Bizcochitos dulces espolvoreados con azúcar crujiente.',
        category: 'Almacén',
        purchasePrice: 380,
        salePrice: 850,
        stock: 60,
        minStock: 15,
        expirationDate: inSixMonths,
        active: true
      },

      // === CATEGORY: Almacén y Comestibles ===
      {
        code: '7790070318105',
        name: 'Fideos Tallarines Lucchetti 500g',
        description: 'Fideos secos de sémola de trigo candeal tipo tallarín.',
        category: 'Almacén',
        purchasePrice: 320,
        salePrice: 750,
        stock: 100,
        minStock: 20,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790070500159',
        name: 'Fideos Tirabuzón Matarazzo 500g',
        description: 'Fideos secos premium Matarazzo tipo tirabuzón.',
        category: 'Almacén',
        purchasePrice: 380,
        salePrice: 890,
        stock: 75,
        minStock: 15,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790070211024',
        name: 'Arroz Largo Fino Lucchetti 1kg',
        description: 'Arroz largo fino grado 5 seleccionado de cocción perfecta.',
        category: 'Almacén',
        purchasePrice: 650,
        salePrice: 1400,
        stock: 50,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790580320159',
        name: 'Puré de Tomate Arcor Cartón 520g',
        description: 'Puré de tomates seleccionados tamizados y listos.',
        category: 'Almacén',
        purchasePrice: 280,
        salePrice: 600,
        stock: 90,
        minStock: 15,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790290001034',
        name: 'Aceite de Girasol Natura 900ml',
        description: 'Aceite refinado de girasol Natura, puro y liviano.',
        category: 'Almacén',
        purchasePrice: 1100,
        salePrice: 2400,
        stock: 45,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790550000258',
        name: 'Mayonesa Hellmann\'s Clásica Doypack 250g',
        description: 'Aderezo de mayonesa Hellmann\'s cremosa textura original.',
        category: 'Almacén',
        purchasePrice: 380,
        salePrice: 850,
        stock: 70,
        minStock: 12,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790550000265',
        name: 'Ketchup Hellmann\'s Doypack 250g',
        description: 'Aderezo ketchup elaborado con tomates seleccionados.',
        category: 'Almacén',
        purchasePrice: 380,
        salePrice: 850,
        stock: 50,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790550000272',
        name: 'Mostaza Savora Clásica Doypack 250g',
        description: 'La mostaza preferida argentina Savora receta original.',
        category: 'Almacén',
        purchasePrice: 350,
        salePrice: 800,
        stock: 50,
        minStock: 10,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790250000046',
        name: 'Sal Fina Dos Anclas Salero 250g',
        description: 'Sal fina de mesa Dos Anclas en práctico envase salero.',
        category: 'Almacén',
        purchasePrice: 250,
        salePrice: 550,
        stock: 40,
        minStock: 8,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7791234567891',
        name: 'Yerba Mate Playadito 1kg',
        description: 'Yerba mate con palo de molienda tradicional sabor suave.',
        category: 'Almacén',
        purchasePrice: 1900,
        salePrice: 4200,
        stock: 50,
        minStock: 12,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7791234567892',
        name: 'Yerba Mate Taragüí con Palo 1kg',
        description: 'Yerba mate clásica Taragüí con palo sabor intenso y rendidor.',
        category: 'Almacén',
        purchasePrice: 1800,
        salePrice: 3950,
        stock: 40,
        minStock: 12,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790220001011',
        name: 'Café Molido La Virginia Filtro 250g',
        description: 'Café tostado y molido sabor equilibrado para filtro.',
        category: 'Almacén',
        purchasePrice: 1300,
        salePrice: 2900,
        stock: 25,
        minStock: 6,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790220005408',
        name: 'Té Taragüí Clásico 50 Saquitos',
        description: 'Té negro en saquitos blend clásico Taragüí.',
        category: 'Almacén',
        purchasePrice: 350,
        salePrice: 800,
        stock: 30,
        minStock: 6,
        expirationDate: inSixMonths,
        active: true
      },

      // === CATEGORY: Kiosco y Golosinas ===
      {
        code: '7790040125436',
        name: 'Alfajor Jorgito Chocolate Simple 1u',
        description: 'Alfajor Jorgito relleno con dulce de leche y baño de chocolate negro.',
        category: 'Kiosco',
        purchasePrice: 150,
        salePrice: 350,
        stock: 120,
        minStock: 20,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790040125443',
        name: 'Alfajor Jorgito Blanco Simple 1u',
        description: 'Alfajor Jorgito relleno con dulce de leche y merengue glaseado blanco.',
        category: 'Kiosco',
        purchasePrice: 150,
        salePrice: 350,
        stock: 100,
        minStock: 20,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790040125450',
        name: 'Alfajor Guaymallén Chocolate 1u',
        description: 'Alfajor clásico económico Guaymallén bañado con chocolate negro.',
        category: 'Kiosco',
        purchasePrice: 100,
        salePrice: 220,
        stock: 200,
        minStock: 30,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790040125467',
        name: 'Alfajor Guaymallén Blanco 1u',
        description: 'Alfajor clásico económico Guaymallén con cobertura de azúcar blanca.',
        category: 'Kiosco',
        purchasePrice: 100,
        salePrice: 220,
        stock: 180,
        minStock: 30,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790580662112',
        name: 'Chocolate Milka Leger Aireado 45g',
        description: 'Barra de chocolate de leche aireado Milka Leger súper suave.',
        category: 'Kiosco',
        purchasePrice: 400,
        salePrice: 900,
        stock: 45,
        minStock: 8,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790580662129',
        name: 'Chocolate Milka Oreo 100g',
        description: 'Tableta de chocolate con leche Milka rellena con crema y galletitas Oreo.',
        category: 'Kiosco',
        purchasePrice: 900,
        salePrice: 2000,
        stock: 30,
        minStock: 6,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790290123019',
        name: 'Chicle Beldent Menta 1u',
        description: 'Chicles sin azúcar Beldent sabor menta tradicional.',
        category: 'Kiosco',
        purchasePrice: 150,
        salePrice: 350,
        stock: 150,
        minStock: 25,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790290123026',
        name: 'Chicle Beldent Menta Fuerte 1u',
        description: 'Chicles sin azúcar Beldent sabor menta extra refrescante.',
        category: 'Kiosco',
        purchasePrice: 150,
        salePrice: 350,
        stock: 120,
        minStock: 25,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790290456124',
        name: 'Pastillas Tic Tac Menta 16g',
        description: 'Pequeñas e intensas pastillas sabor menta refrescante.',
        category: 'Kiosco',
        purchasePrice: 180,
        salePrice: 400,
        stock: 100,
        minStock: 15,
        expirationDate: inSixMonths,
        active: true
      },
      {
        code: '7790290456131',
        name: 'Pastillas Tic Tac Naranja 16g',
        description: 'Pequeñas e intensas pastillas sabor naranja cítrico.',
        category: 'Kiosco',
        purchasePrice: 180,
        salePrice: 400,
        stock: 90,
        minStock: 15,
        expirationDate: inSixMonths,
        active: true
      },

      // === CATEGORY: Bebidas y Jugos ===
      {
        code: '7791234500906',
        name: 'Jugo Baggio Pronto Durazno 1L',
        description: 'Jugo de frutas listo para tomar sabor durazno Baggio.',
        category: 'Bebidas',
        purchasePrice: 420,
        salePrice: 950,
        stock: 60,
        minStock: 12,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7791234500913',
        name: 'Jugo Baggio Pronto Naranja 1L',
        description: 'Jugo de frutas listo para tomar sabor naranja Baggio.',
        category: 'Bebidas',
        purchasePrice: 420,
        salePrice: 950,
        stock: 55,
        minStock: 12,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7790550088911',
        name: 'Jugo Cepita Naranja Del Valle 1L',
        description: 'Jugo de naranja natural exprimido Cepita en cartón Tetra.',
        category: 'Bebidas',
        purchasePrice: 550,
        salePrice: 1200,
        stock: 40,
        minStock: 10,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7791813423113',
        name: 'Agua Saborizada Levité Pomelo 1.5L',
        description: 'Agua saborizada mineral Levité sabor pomelo liviana.',
        category: 'Bebidas',
        purchasePrice: 650,
        salePrice: 1500,
        stock: 35,
        minStock: 8,
        expirationDate: inThreeMonths,
        active: true
      },
      {
        code: '7791813423120',
        name: 'Agua Saborizada Levité Manzana 1.5L',
        description: 'Agua saborizada mineral Levité sabor manzana refrescante.',
        category: 'Bebidas',
        purchasePrice: 650,
        salePrice: 1500,
        stock: 30,
        minStock: 8,
        expirationDate: inThreeMonths,
        active: true
      }
    ];

    let insertedCount = 0;
    let updatedCount = 0;

    for (const prodData of bulkProducts) {
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

    console.log(`¡Siembra masiva de base de datos de MongoDB completada!`);
    console.log(`Total de productos nuevos insertados: ${insertedCount}`);
    console.log(`Total de productos actualizados/corregidos: ${updatedCount}`);

    await mongoose.connection.close();
    console.log('Conexión cerrada.');
  } catch (error) {
    console.error('Error sembrando datos en masa:', error);
    process.exit(1);
  }
};

addBulkProducts();
