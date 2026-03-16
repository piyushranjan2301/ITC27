
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { neon } from '@neondatabase/serverless';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_eof70OsTYIFZ@ep-floral-darkness-aeaknj5y-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

async function startServer() {
  console.log('--- SERVER STARTUP SEQUENCE START ---');
  console.log('Node Version:', process.version);
  console.log('Environment:', process.env.NODE_ENV);
  
  const sql = neon(DATABASE_URL);
  const app = express();
  const PORT = 3000;

  console.log('Configuring middleware...');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (req, res) => {
    res.send('OK');
  });

  // Log all requests for debugging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} (Path: ${req.path})`);
    next();
  });

  // Database initialization logic
  let isDbInitialized = false;
  async function initDatabase() {
    if (isDbInitialized) return;
    try {
      console.log('Initializing database...');
      await sql`SELECT 1`;
      console.log('Database connection verified.');
      await sql`
        CREATE TABLE IF NOT EXISTS itc_users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE, 
          password TEXT NOT NULL,
          role TEXT NOT NULL, 
          full_name TEXT NOT NULL,
          employee_id_pno TEXT UNIQUE NOT NULL,
          department TEXT,
          designation TEXT,
          phone_number TEXT,
          location TEXT,
          recovery_code TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS itc_assessment_results (
          id SERIAL PRIMARY KEY,
          employee_id INTEGER NOT NULL REFERENCES itc_users(id) ON DELETE CASCADE,
          employee_id_pno TEXT UNIQUE,
          employee_name TEXT NOT NULL,
          employee_role TEXT,
          department TEXT,
          designation TEXT,
          phone_number TEXT NOT NULL,
          location TEXT NOT NULL,
          engagement_score FLOAT NOT NULL,
          engagement_level TEXT NOT NULL,
          behavioral_profile JSONB NOT NULL,
          sjt_alignment JSONB NOT NULL,
          category TEXT NOT NULL,
          total_points INTEGER DEFAULT 0,
          badges JSONB DEFAULT '[]'::jsonb,
          engagement_responses JSONB DEFAULT '{}'::jsonb,
          behavioral_responses JSONB DEFAULT '{}'::jsonb,
          sjt_responses JSONB DEFAULT '{}'::jsonb,
          feedback TEXT,
          time_taken_seconds INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      // Incremental updates
      try { await sql`ALTER TABLE itc_assessment_results ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0`; } catch(e) {}
      try { await sql`ALTER TABLE itc_assessment_results ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb`; } catch(e) {}
      try { await sql`ALTER TABLE itc_assessment_results ADD COLUMN IF NOT EXISTS feedback TEXT`; } catch(e) {}
      try { await sql`ALTER TABLE itc_assessment_results ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0`; } catch(e) {}

      const adminExists = await sql`SELECT id FROM itc_users WHERE employee_id_pno = 'ADMIN-001' LIMIT 1`;
      if (adminExists.length === 0) {
        console.log('Creating default admin user...');
        await sql`
          INSERT INTO itc_users (username, password, role, full_name, employee_id_pno, department, designation, recovery_code)
          VALUES ('ADMIN-001', 'admin123', 'admin', 'System Administrator', 'ADMIN-001', 'IT & Governance', 'Chief Admin', 'ITC-MASTER-RESET-2024')
        `;
        console.log('Default admin user created.');
      }
      isDbInitialized = true;
      console.log('Database initialized successfully.');
    } catch (error) {
      console.error('Database Init Error:', error);
      throw error; // Propagate error during startup
    }
  }

  // Pre-initialize database
  try {
    await initDatabase();
  } catch (dbError) {
    console.error('FAILED TO INITIALIZE DATABASE ON STARTUP. Server will still start but API may fail.');
  }

  // API Routes
  app.get('/api/db/test', async (req, res) => {
    try {
      await sql`SELECT 1`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as any).message });
    }
  });

  app.post('/api/db/init', async (req, res) => {
    await initDatabase();
    res.json({ success: true });
  });

  app.post('/api/db/wipe', async (req, res) => {
    await initDatabase();
    try {
      await sql`DELETE FROM itc_users WHERE employee_id_pno != 'ADMIN-001'`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as any).message });
    }
  });

  app.get('/api/db/questions-count', async (req, res) => {
    await initDatabase();
    try {
      const result = await sql`
        SELECT 
          COALESCE(SUM(jsonb_obj_len(engagement_responses)), 0) + 
          COALESCE(SUM(jsonb_obj_len(behavioral_responses)), 0) + 
          COALESCE(SUM(jsonb_obj_len(sjt_responses)), 0) as total
        FROM itc_assessment_results
      `;
      res.json({ total: parseInt(result[0].total, 10) || 0 });
    } catch (error) {
      res.json({ total: 0 });
    }
  });

  app.post(['/api/db/register', '/api/db/register/'], async (req, res) => {
    console.log('POST /api/db/register reached');
    const { user } = req.body;
    await initDatabase();
    try {
      const checkPno = await sql`SELECT id FROM itc_users WHERE employee_id_pno = ${user.pNo} LIMIT 1`;
      if (checkPno.length > 0) return res.json({ success: false, error: 'This P.NO is already registered.' });

      await sql`
        INSERT INTO itc_users (username, password, role, full_name, employee_id_pno, department, designation, phone_number, location)
        VALUES (${user.pNo}, ${user.password}, ${user.role}, ${user.fullName}, ${user.pNo}, ${user.department}, ${user.designation}, ${user.phoneNumber}, ${user.location})
      `;
      const newUser = await sql`SELECT * FROM itc_users WHERE employee_id_pno = ${user.pNo} LIMIT 1`;
      res.json({ success: true, user: newUser[0] });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as any).message });
    }
  });

  app.post(['/api/db/login', '/api/db/login/'], async (req, res) => {
    console.log(`POST /api/db/login reached. Body: ${JSON.stringify(req.body)}`);
    const { pNo, securityKey } = req.body;
    try {
      const user = await sql`SELECT * FROM itc_users WHERE employee_id_pno = ${pNo} LIMIT 1`;
      if (user.length === 0) {
        console.log(`Login failed: User ${pNo} not found`);
        return res.json({ success: false, error: 'USER_NOT_FOUND' });
      }
      if (user[0].password !== securityKey) {
        console.log(`Login failed: Incorrect key for user ${pNo}`);
        return res.json({ success: false, error: 'INCORRECT_KEY' });
      }
      console.log(`Login successful for user ${pNo}`);
      res.json({ success: true, user: user[0] });
    } catch (error) {
      console.error('Login Route Error:', error);
      res.status(500).json({ success: false, error: 'CONNECTION_FAILED', details: (error as any).message });
    }
  });

  app.post('/api/db/save-result', async (req, res) => {
    const { result } = req.body;
    await initDatabase();
    try {
      await sql`
        INSERT INTO itc_assessment_results (
          employee_id, employee_id_pno, employee_name, employee_role,
          department, designation, phone_number, location, 
          engagement_score, engagement_level, behavioral_profile, sjt_alignment, 
          category, total_points, badges, engagement_responses, 
          behavioral_responses, sjt_responses, feedback, time_taken_seconds
        ) VALUES (
          ${result.employeeId || 0}, ${result.loginInfo?.pNo || 'N/A'}, 
          ${result.loginInfo?.employeeName || 'Anonymous'}, ${result.loginInfo?.role || 'worker'},
          ${result.loginInfo?.department || 'N/A'}, ${result.loginInfo?.designation || 'N/A'}, 
          ${result.loginInfo?.phoneNumber || 'N/A'}, ${result.loginInfo?.location || 'N/A'},
          ${result.engagementScore}, ${result.engagementLevel}, 
          ${JSON.stringify(result.behavioralProfile || {})}, ${JSON.stringify(result.sjtAlignment || {})},
          ${result.category}, ${result.totalPoints || 0}, 
          ${JSON.stringify(result.badges || [])}, ${JSON.stringify(result.engagementResponses || {})}, 
          ${JSON.stringify(result.behavioralResponses || {})}, ${JSON.stringify(result.sjtResponses || {})},
          ${result.feedback || ''}, ${result.timeTakenSeconds || 0}
        )
      `;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as any).message });
    }
  });

  app.get('/api/db/results', async (req, res) => {
    await initDatabase();
    try {
      const results = await sql`SELECT * FROM itc_assessment_results ORDER BY total_points DESC, created_at DESC`;
      res.json(results);
    } catch (error) {
      res.json([]);
    }
  });

  app.get('/api/db/result/:pNo', async (req, res) => {
    const { pNo } = req.params;
    await initDatabase();
    try {
      const result = await sql`SELECT * FROM itc_assessment_results WHERE employee_id_pno = ${pNo} LIMIT 1`;
      res.json(result[0] || null);
    } catch (error) {
      res.json(null);
    }
  });

  app.get('/api/db/users', async (req, res) => {
    await initDatabase();
    try {
      const users = await sql`SELECT id, role, full_name, employee_id_pno, department, designation, phone_number, location, created_at FROM itc_users ORDER BY created_at DESC`;
      res.json(users);
    } catch (error) {
      res.json([]);
    }
  });

  app.post('/api/db/update-password', async (req, res) => {
    const { userId, currentPass, newPass } = req.body;
    await initDatabase();
    try {
      const user = await sql`SELECT password FROM itc_users WHERE id = ${userId} LIMIT 1`;
      if (!user.length || user[0].password !== currentPass) return res.json({ success: false, error: 'Verification failed.' });
      await sql`UPDATE itc_users SET password = ${newPass} WHERE id = ${userId}`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: 'System error.' });
    }
  });

  app.post('/api/db/update-recovery', async (req, res) => {
    const { userId, currentPass, newRecoveryCode } = req.body;
    await initDatabase();
    try {
      const user = await sql`SELECT password FROM itc_users WHERE id = ${userId} LIMIT 1`;
      if (!user.length || user[0].password !== currentPass) return res.json({ success: false, error: 'Verification failed.' });
      await sql`UPDATE itc_users SET recovery_code = ${newRecoveryCode} WHERE id = ${userId}`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: 'System error.' });
    }
  });

  app.post('/api/db/reset-password', async (req, res) => {
    const { pNo, recoveryCode, newKey } = req.body;
    await initDatabase();
    try {
      const user = await sql`SELECT id, recovery_code FROM itc_users WHERE employee_id_pno = ${pNo} LIMIT 1`;
      if (user.length === 0) return res.json({ success: false, error: 'USER_NOT_FOUND' });
      if (user[0].recovery_code !== recoveryCode) return res.json({ success: false, error: 'INVALID_RECOVERY_CODE' });
      await sql`UPDATE itc_users SET password = ${newKey} WHERE id = ${user[0].id}`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: 'SYSTEM_ERROR' });
    }
  });

  app.delete('/api/db/user/:id', async (req, res) => {
    const { id } = req.params;
    await initDatabase();
    try {
      await sql`DELETE FROM itc_users WHERE id = ${id}`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  app.delete('/api/db/result/:id', async (req, res) => {
    const { id } = req.params;
    await initDatabase();
    try {
      await sql`DELETE FROM itc_assessment_results WHERE id = ${id}`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  // Catch-all for unmatched API routes
  app.all('/api/*', (req, res) => {
    console.log(`404 - Unmatched API Route: ${req.method} ${req.url} (Path: ${req.path})`);
    res.status(404).json({ success: false, error: `API Route Not Found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('Initializing Vite middleware (with 30s timeout)...');
      const vitePromise = createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Vite initialization timed out')), 30000)
      );

      const vite = await Promise.race([vitePromise, timeoutPromise]) as any;
      app.use(vite.middlewares);
      
      app.get('*', async (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        try {
          const fs = await import('fs');
          let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
          template = await vite.transformIndexHtml(req.url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          console.error('Vite HTML Transform Error:', e);
          next(e);
        }
      });

      console.log('Vite middleware initialized successfully.');
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

  // Final initialization
  console.log('--- SERVER STARTUP SEQUENCE COMPLETE ---');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global Error Handler:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error', details: err.message });
  });
}

startServer();
