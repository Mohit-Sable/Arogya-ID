import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectMongo, syncSQL } from './config/db.js';
// Import models to ensure they're registered
import './models/sql/index.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Connect databases
    await connectMongo();
    await syncSQL();

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🏥 Health ID Backend running on http://localhost:${PORT}`);
      console.log(`📋 API Docs: http://localhost:${PORT}/api/health`);
      console.log(`🚨 Emergency endpoint: http://localhost:${PORT}/api/emergency/:healthId\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

start();
