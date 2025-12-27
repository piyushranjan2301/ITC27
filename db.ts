
import { neon } from '@neondatabase/serverless';
// Fixed: Added missing import for ScoringResult type
import { ScoringResult } from './types';

// Updated connection string
const DATABASE_URL = 'postgresql://neondb_owner:npg_zckqGUED3i8L@ep-wandering-math-adclj848-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(DATABASE_URL);

let isDbInitialized = false;

async function initDatabase() {
  if (isDbInitialized) return;
  try {
    // Initial schema setup
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

    // Ensure columns exist (incremental update)
    try { await sql`ALTER TABLE itc_assessment_results ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0`; } catch(e) {}
    try { await sql`ALTER TABLE itc_assessment_results ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb`; } catch(e) {}
    try { await sql`ALTER TABLE itc_assessment_results ADD COLUMN IF NOT EXISTS feedback TEXT`; } catch(e) {}
    try { await sql`ALTER TABLE itc_assessment_results ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0`; } catch(e) {}

    const adminExists = await sql`SELECT id FROM itc_users WHERE employee_id_pno = 'ADMIN-001' LIMIT 1`;
    if (adminExists.length === 0) {
      await sql`
        INSERT INTO itc_users (username, password, role, full_name, employee_id_pno, department, designation, recovery_code)
        VALUES ('ADMIN-001', 'admin123', 'admin', 'System Administrator', 'ADMIN-001', 'IT & Governance', 'Chief Admin', 'ITC-MASTER-RESET-2024')
      `;
    }
    isDbInitialized = true;
  } catch (error) {
    console.error('Database Init Error:', error);
  }
}

export async function testDatabaseConnection() {
  try {
    await sql`SELECT 1`;
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
}

export async function wipeAllData() {
  await initDatabase();
  try {
    await sql`DELETE FROM itc_users WHERE employee_id_pno != 'ADMIN-001'`;
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
}

export async function getTotalAnsweredQuestionsCount() {
  await initDatabase();
  try {
    const result = await sql`
      SELECT 
        COALESCE(SUM(jsonb_obj_len(engagement_responses)), 0) + 
        COALESCE(SUM(jsonb_obj_len(behavioral_responses)), 0) + 
        COALESCE(SUM(jsonb_obj_len(sjt_responses)), 0) as total
      FROM itc_assessment_results
    `;
    return parseInt(result[0].total, 10) || 0;
  } catch (error) {
    return 0;
  }
}

export async function registerUser(user: any) {
  await initDatabase();
  try {
    const checkPno = await sql`SELECT id FROM itc_users WHERE employee_id_pno = ${user.pNo} LIMIT 1`;
    if (checkPno.length > 0) return { success: false, error: 'This P.NO is already registered.' };

    await sql`
      INSERT INTO itc_users (username, password, role, full_name, employee_id_pno, department, designation, phone_number, location)
      VALUES (${user.pNo}, ${user.password}, ${user.role}, ${user.fullName}, ${user.pNo}, ${user.department}, ${user.designation}, ${user.phoneNumber}, ${user.location})
    `;
    const newUser = await sql`SELECT * FROM itc_users WHERE employee_id_pno = ${user.pNo} LIMIT 1`;
    return { success: true, user: newUser[0] };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
}

export async function loginUser(pNo: string, securityKey: string) {
  await initDatabase();
  try {
    const user = await sql`SELECT * FROM itc_users WHERE employee_id_pno = ${pNo} LIMIT 1`;
    if (user.length === 0) return { success: false, error: 'USER_NOT_FOUND' };
    if (user[0].password !== securityKey) return { success: false, error: 'INCORRECT_KEY' };
    return { success: true, user: user[0] };
  } catch (error) {
    return { success: false, error: 'CONNECTION_FAILED' };
  }
}

// Fixed: Added correct type for 'result' parameter
export async function saveAssessmentResult(result: ScoringResult) {
  await initDatabase();
  try {
    await sql`
      INSERT INTO itc_assessment_results (
        employee_id, employee_id_pno, employee_name, employee_role,
        department, designation, phone_number, location, 
        engagement_score, engagement_level, behavioral_profile, sjt_alignment, 
        category, total_points, badges, engagement_responses, behavioral_responses, sjt_responses, feedback, time_taken_seconds
      ) VALUES (
        ${result.employeeId}, ${result.loginInfo?.pNo}, ${result.loginInfo?.employeeName}, ${result.loginInfo?.role},
        ${result.loginInfo?.department}, ${result.loginInfo?.designation}, ${result.loginInfo?.phoneNumber}, ${result.loginInfo?.location},
        ${result.engagementScore}, ${result.engagementLevel}, ${JSON.stringify(result.behavioralProfile)}, ${JSON.stringify(result.sjtAlignment)},
        ${result.category}, ${result.totalPoints}, ${JSON.stringify(result.badges)},
        ${JSON.stringify(result.engagementResponses || {})}, 
        ${JSON.stringify(result.behavioralResponses || {})}, 
        ${JSON.stringify(result.sjtResponses || {})},
        ${result.feedback},
        ${result.timeTakenSeconds || 0}
      )
    `;
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
}

export async function fetchAssessmentResults() {
  await initDatabase();
  try {
    const results = await sql`SELECT * FROM itc_assessment_results ORDER BY total_points DESC, created_at DESC`;
    return results.map(row => ({
      ...row,
      engagementScore: row.engagement_score,
      engagementLevel: row.engagement_level,
      behavioralProfile: row.behavioral_profile,
      sjtAlignment: row.sjt_alignment,
      totalPoints: row.total_points,
      badges: row.badges,
      feedback: row.feedback,
      timeTakenSeconds: row.time_taken_seconds,
      loginInfo: {
        employeeName: row.employee_name,
        pNo: row.employee_id_pno,
        department: row.department,
        designation: row.designation,
        role: row.employee_role || 'worker',
        phoneNumber: row.phone_number,
        location: row.location,
        timestamp: row.created_at
      }
    }));
  } catch (error) {
    return [];
  }
}

export async function fetchResultByPNo(pNo: string) {
  await initDatabase();
  try {
    const result = await sql`SELECT * FROM itc_assessment_results WHERE employee_id_pno = ${pNo} LIMIT 1`;
    if (result.length === 0) return null;
    const row = result[0];
    return {
      ...row,
      engagementScore: row.engagement_score,
      engagementLevel: row.engagement_level,
      behavioralProfile: row.behavioral_profile,
      sjtAlignment: row.sjt_alignment,
      totalPoints: row.total_points,
      badges: row.badges,
      feedback: row.feedback,
      timeTakenSeconds: row.time_taken_seconds,
      loginInfo: {
        employeeName: row.employee_name,
        pNo: row.employee_id_pno,
        department: row.department,
        designation: row.designation,
        role: row.employee_role || 'worker',
        phoneNumber: row.phone_number,
        location: row.location,
        timestamp: row.created_at
      }
    };
  } catch (error) {
    return null;
  }
}

export async function fetchAllUsers() {
  await initDatabase();
  try {
    return await sql`SELECT id, role, full_name, employee_id_pno, department, designation, phone_number, location, created_at FROM itc_users ORDER BY created_at DESC`;
  } catch (error) {
    return [];
  }
}

export async function updateUserPassword(userId: number, currentPass: string, newPass: string) {
  await initDatabase();
  try {
    const user = await sql`SELECT password FROM itc_users WHERE id = ${userId} LIMIT 1`;
    if (!user.length || user[0].password !== currentPass) return { success: false, error: 'Verification failed.' };
    await sql`UPDATE itc_users SET password = ${newPass} WHERE id = ${userId}`;
    return { success: true };
  } catch (error) {
    return { success: false, error: 'System error.' };
  }
}

export async function updateUserRecoveryCode(userId: number, currentPass: string, newRecoveryCode: string) {
  await initDatabase();
  try {
    const user = await sql`SELECT password FROM itc_users WHERE id = ${userId} LIMIT 1`;
    if (!user.length || user[0].password !== currentPass) return { success: false, error: 'Verification failed.' };
    await sql`UPDATE itc_users SET recovery_code = ${newRecoveryCode} WHERE id = ${userId}`;
    return { success: true };
  } catch (error) {
    return { success: false, error: 'System error.' };
  }
}

export async function resetUserPasswordWithRecovery(pNo: string, recoveryCode: string, newKey: string) {
  await initDatabase();
  try {
    const user = await sql`SELECT id, recovery_code FROM itc_users WHERE employee_id_pno = ${pNo} LIMIT 1`;
    if (user.length === 0) return { success: false, error: 'USER_NOT_FOUND' };
    if (user[0].recovery_code !== recoveryCode) return { success: false, error: 'INVALID_RECOVERY_CODE' };
    await sql`UPDATE itc_users SET password = ${newKey} WHERE id = ${user[0].id}`;
    return { success: true };
  } catch (error) {
    return { success: false, error: 'SYSTEM_ERROR' };
  }
}

export async function deleteUser(id: number) {
  await initDatabase();
  try {
    await sql`DELETE FROM itc_users WHERE id = ${id}`;
    return true;
  } catch (error) {
    return false;
  }
}

export async function deleteAssessmentResult(id: number) {
  await initDatabase();
  try {
    await sql`DELETE FROM itc_assessment_results WHERE id = ${id}`;
    return true;
  } catch (error) {
    return false;
  }
}
