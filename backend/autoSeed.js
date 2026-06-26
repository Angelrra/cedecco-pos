import User from './models/User.js';
import Product from './models/Product.js';

export const autoSeed = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Base de datos vacía. Iniciando siembra automática de usuarios...');
      
      // Crear administrador por defecto
      const adminUser = new User({
        name: 'Administrador Cedecco',
        email: 'admin@cedecco.com',
        password: 'admin123',
        role: 'admin'
      });
      await adminUser.save();
      
      // Crear cuenta especializada para el dueño
      const developerUser = new User({
        name: 'Mark Cedecco',
        email: 'mark@cedecco.com',
        password: 'especial123',
        role: 'admin'
      });
      await developerUser.save();
      
      // Crear vendedor por defecto
      const sellerUser = new User({
        name: 'Vendedor Cedecco',
        email: 'vendedor@cedecco.com',
        password: 'vendedor123',
        role: 'vendedor'
      });
      await sellerUser.save();
      
      console.log('Usuarios sembrados con éxito.');

      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        console.log('Iniciando siembra automática de productos de prueba...');
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
            minStock: 5,
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
          }
        ];
        await Product.insertMany(mockProducts);
        console.log('Productos de prueba sembrados con éxito.');
      }
    }
  } catch (err) {
    console.error('Error en la siembra automática:', err.message);
  }
};
