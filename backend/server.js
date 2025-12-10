import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import labRoutes from './routes/labs.js';
import assetRoutes from './routes/assets.js';
import importExportRoutes from './routes/importExport.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/import', importExportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

