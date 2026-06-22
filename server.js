import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { PORT } from './src/config/env.js';

connectDB();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
