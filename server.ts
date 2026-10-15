import { app } from './src/server/app.ts';
import { seedDatabase } from './src/db/seed.ts';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import path from 'path';

// Dev server must run on port 3000 in AI Studio environment
const PORT = 3000;


async function startServer() {
  try {
    // Seed initial PostgreSQL tables and canonical active users
    await seedDatabase();
  } catch (error) {
    console.error('Warning during database seed:', error);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Sahla ERP Server running at http://0.0.0.0:${PORT}`);
    });
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Sahla ERP Server running at http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();
