import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeyforaurastockdevelopment2026', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Registrar un usuario (El primer usuario se crea como Admin automáticamente)
// @access  Público para el primer usuario / Admin para usuarios subsecuentes
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe con ese correo electrónico' });
    }

    // Verificar si es el primer usuario en el sistema
    const userCount = await User.countDocuments();
    let assignedRole = role || 'vendedor';

    // Auto-bootstrap: primer usuario es Admin obligatoriamente
    if (userCount === 0) {
      assignedRole = 'admin';
    } else {
      // Si no es el primer usuario, se requiere autenticación de administrador para crearlo
      const authHeader = req.header('Authorization');
      if (!authHeader) {
        return res.status(401).json({ message: 'No autorizado para crear usuarios' });
      }
      
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforaurastockdevelopment2026');
        const creator = await User.findById(decoded.id);
        if (!creator || creator.role !== 'admin') {
          return res.status(403).json({ message: 'Solo los administradores pueden registrar nuevos usuarios' });
        }
      } catch (err) {
        return res.status(401).json({ message: 'Token de administrador no válido o ausente' });
      }
    }

    const newUser = new User({
      name,
      email,
      password,
      role: assignedRole
    });

    await newUser.save();

    res.status(201).json({
      message: `Usuario ${newUser.name} registrado con éxito como ${newUser.role}`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      token: generateToken(newUser._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor al registrar usuario', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Iniciar sesión
// @access  Público
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas (usuario no encontrado)' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Esta cuenta ha sido desactivada' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas (contraseña incorrecta)' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
});


// @route   GET /api/auth/me
// @desc    Obtener datos del usuario autenticado
// @access  Privado
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// @route   GET /api/auth/users
// @desc    Listar todos los usuarios
// @access  Privado (Admin)
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const query = {};
    // Ocultar el usuario creador angel.admin@store.com de la lista si no es él quien consulta
    if (req.user.email !== 'angel.admin@store.com') {
      query.email = { $ne: 'angel.admin@store.com' };
    }
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
});

// @route   PUT /api/auth/users/:id
// @desc    Actualizar rol o estado de un usuario
// @access  Privado (Admin)
router.put('/users/:id', auth, adminOnly, async (req, res) => {
  const { role, active, name, email, password } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // No permitir que el admin se desactive a sí mismo o se quite el rol de admin
    if (user._id.toString() === req.user._id.toString() && (active === false || role !== 'admin')) {
      return res.status(400).json({ message: 'No puedes desactivarte o quitarte el rol de administrador a ti mismo' });
    }

    // No permitir que otros usuarios editen al Creador del Sistema (angel.admin@store.com)
    if (user.email === 'angel.admin@store.com' && req.user.email !== 'angel.admin@store.com') {
      return res.status(403).json({ message: 'Acceso denegado: Solo el Creador puede modificar su propia cuenta' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role !== undefined) user.role = role;
    if (active !== undefined) user.active = active;

    if (password !== undefined && password !== '') {
      if (password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
      }
      user.password = password;
    }

    await user.save();
    res.json({
      message: 'Usuario actualizado correctamente',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
});

export default router;
