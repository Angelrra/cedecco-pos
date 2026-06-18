import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const run = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    console.log('Connecting to database...');
    await mongoose.connect(connStr);
    console.log('Connected!');

    const users = await User.find().select('-password');
    console.log('\n--- USERS IN DATABASE ---');
    users.forEach(u => {
      console.log(`- ID: ${u._id}\n  Name: ${u.name}\n  Email: ${u.email}\n  Role: ${u.role}\n  Active: ${u.active}\n`);
    });

    await mongoose.connection.close();
    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
};

run();
