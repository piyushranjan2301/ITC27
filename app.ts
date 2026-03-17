
import express from 'express';
import { neon } from '@neondatabase/serverless';

const app = express();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_eof70OsTYIFZ@ep-floral-darkness-aeaknj5y-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL.replace(/^psql\s+/, '').replace(/^['"]|['"]$/g, ''));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let isDbInitialized = false;
async function initDatabase() {
  if (isDbInitialized) return;
  try {
    await sql`SELECT 1`;
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
        is_locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    // Migration: Add is_locked column if it doesn't exist (for existing tables)
    try {
      await sql`ALTER TABLE itc_users ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE`;
    } catch (e) {
      console.log('Migration info: is_locked column might already exist or table is being created.');
    }

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
    
    const adminExists = await sql`SELECT id FROM itc_users WHERE employee_id_pno = 'ADMIN-001' LIMIT 1`;
    if (adminExists.length === 0) {
      await sql`
        INSERT INTO itc_users (username, password, role, full_name, employee_id_pno, department, designation, recovery_code)
        VALUES ('ADMIN-001', 'admin123', 'admin', 'System Administrator', 'ADMIN-001', 'IT & Governance', 'Chief Admin', 'ITC-MASTER-RESET-2024')
      `;
    }

    const testUserExists = await sql`SELECT id FROM itc_users WHERE employee_id_pno = '55' LIMIT 1`;
    if (testUserExists.length === 0) {
      await sql`
        INSERT INTO itc_users (username, password, role, full_name, employee_id_pno, department, designation, phone_number, location, recovery_code)
        VALUES ('55', '5555', 'worker', 'Test User 55', '55', 'PMD', 'Operator', '9876543210', 'Munger', 'RECOVERY-55')
      `;
    }
    isDbInitialized = true;
  } catch (error) {
    console.error('Database Init Error:', error);
  }
}

// Middleware to ensure DB is initialized
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/db')) {
    await initDatabase();
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api-ping', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString() });
});

app.get('/api/db/test', async (req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as any).message });
  }
});

app.post('/api/db/register', async (req, res) => {
  const { user } = req.body;
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

app.post('/api/db/login', async (req, res) => {
  const { pNo, securityKey } = req.body;
  try {
    const user = await sql`SELECT * FROM itc_users WHERE employee_id_pno = ${pNo} LIMIT 1`;
    if (user.length === 0) return res.json({ success: false, error: 'USER_NOT_FOUND' });
    if (user[0].is_locked && user[0].role !== 'admin') return res.json({ success: false, error: 'ACCOUNT_LOCKED' });
    if (user[0].password !== securityKey) return res.json({ success: false, error: 'INCORRECT_KEY' });
    res.json({ success: true, user: user[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'CONNECTION_FAILED' });
  }
});

app.post('/api/db/save-result', async (req, res) => {
  const { result } = req.body;
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
    
    // Lock the user account after submission (except for admins)
    if (result.loginInfo?.pNo && result.loginInfo?.role !== 'admin') {
      await sql`UPDATE itc_users SET is_locked = TRUE WHERE employee_id_pno = ${result.loginInfo.pNo}`;
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as any).message });
  }
});

app.get('/api/db/results', async (req, res) => {
  try {
    const results = await sql`SELECT * FROM itc_assessment_results ORDER BY total_points DESC, created_at DESC`;
    res.json(results);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/db/result/:pNo', async (req, res) => {
  const { pNo } = req.params;
  try {
    const result = await sql`SELECT * FROM itc_assessment_results WHERE employee_id_pno = ${pNo} LIMIT 1`;
    res.json(result[0] || null);
  } catch (error) {
    res.json(null);
  }
});

app.delete('/api/db/result/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM itc_assessment_results WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as any).message });
  }
});

app.get('/api/db/users', async (req, res) => {
  try {
    const users = await sql`SELECT id, role, full_name, employee_id_pno, department, designation, phone_number, location, created_at FROM itc_users ORDER BY created_at DESC`;
    res.json(users);
  } catch (error) {
    res.json([]);
  }
});

app.delete('/api/db/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM itc_users WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as any).message });
  }
});

app.post('/api/db/wipe', async (req, res) => {
  try {
    await sql`DELETE FROM itc_assessment_results`;
    // We don't wipe users to avoid locking ourselves out, or maybe just non-admins?
    // Usually wipe means everything.
    await sql`DELETE FROM itc_users WHERE role != 'admin'`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as any).message });
  }
});

app.get('/api/db/questions-count', async (req, res) => {
  try {
    const count = await sql`SELECT COUNT(*) as total FROM itc_assessment_results`;
    res.json({ total: parseInt(count[0].total) });
  } catch (error) {
    res.json({ total: 0 });
  }
});

app.post('/api/db/update-password', async (req, res) => {
  const { userId, currentPass, newPass } = req.body;
  try {
    const user = await sql`SELECT password FROM itc_users WHERE id = ${userId} LIMIT 1`;
    if (user.length === 0 || user[0].password !== currentPass) {
      return res.json({ success: false, error: 'Current password incorrect' });
    }
    await sql`UPDATE itc_users SET password = ${newPass} WHERE id = ${userId}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as any).message });
  }
});

app.post('/api/db/update-recovery', async (req, res) => {
  const { userId, currentPass, newRecoveryCode } = req.body;
  try {
    const user = await sql`SELECT password FROM itc_users WHERE id = ${userId} LIMIT 1`;
    if (user.length === 0 || user[0].password !== currentPass) {
      return res.json({ success: false, error: 'Current password incorrect' });
    }
    await sql`UPDATE itc_users SET recovery_code = ${newRecoveryCode} WHERE id = ${userId}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as any).message });
  }
});

app.post('/api/db/reset-password', async (req, res) => {
  const { pNo, recoveryCode, newKey } = req.body;
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

export { app };
