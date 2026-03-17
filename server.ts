import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from './app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log('--- SERVER STARTUP SEQUENCE START ---');
  
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('Initializing Vite middleware...');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      
      app.use(vite.middlewares);
      
      // SPA Fallback for development
      app.get('*', async (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        
        try {
          const fs = await import('fs');
          const indexPath = path.resolve(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(req.url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          res.status(500).send(`Vite Transform Error: ${e instanceof Error ? e.message : String(e)}`);
        }
      });
    } catch (viteError) {
      console.error('CRITICAL: Failed to initialize Vite middleware:', viteError);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
