import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import portalRoutes from './routes/portalRoutes.js';
import userRoutes from './routes/userRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4016',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Gestiona API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/portals', portalRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

export default app;
