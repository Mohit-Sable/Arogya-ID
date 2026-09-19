import Sequelize from 'sequelize';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// --- Sequelize (SQL / SQLite) ---
const sequelize = new Sequelize.Sequelize({
  dialect: process.env.SQL_DIALECT || 'sqlite',
  storage: process.env.SQL_STORAGE || './data/healthid.sqlite',
  logging: false,
  define: {
    timestamps: true,
  },
});

// --- Mongoose (MongoDB) ---
let isMongoConnected = false;

const connectMongo = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/healthid';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    isMongoConnected = false;
    console.warn(`⚠️ MongoDB not connected (${err.message}). Using resilient local record store.`);
  }
};

// --- Sync SQL tables ---
const syncSQL = async () => {
  await sequelize.sync();
  console.log('✅ SQL tables synced');
};

export { sequelize, connectMongo, syncSQL, isMongoConnected };
