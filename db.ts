
import { ScoringResult } from './types';

async function apiRequest(path: string, method: string = 'GET', body?: any) {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }
  return response.json();
}

export async function testDatabaseConnection() {
  try {
    return await apiRequest('/api/db/test');
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
}

export async function wipeAllData() {
  return await apiRequest('/api/db/wipe', 'POST');
}

export async function getTotalAnsweredQuestionsCount() {
  try {
    const data = await apiRequest('/api/db/questions-count');
    return data.total;
  } catch (error) {
    return 0;
  }
}

export async function registerUser(user: any) {
  try {
    return await apiRequest('/api/db/register', 'POST', { user });
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
}

export async function loginUser(pNo: string, securityKey: string) {
  try {
    return await apiRequest('/api/db/login', 'POST', { pNo, securityKey });
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
}

export async function saveAssessmentResult(result: ScoringResult) {
  try {
    return await apiRequest('/api/db/save-result', 'POST', { result });
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
}

export async function fetchAssessmentResults() {
  try {
    const results = await apiRequest('/api/db/results');
    return results.map((row: any) => ({
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
  try {
    const row = await apiRequest(`/api/db/result/${pNo}`);
    if (!row) return null;
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
  try {
    return await apiRequest('/api/db/users');
  } catch (error) {
    return [];
  }
}

export async function updateUserPassword(userId: number, currentPass: string, newPass: string) {
  try {
    return await apiRequest('/api/db/update-password', 'POST', { userId, currentPass, newPass });
  } catch (error) {
    return { success: false, error: 'System error.' };
  }
}

export async function updateUserRecoveryCode(userId: number, currentPass: string, newRecoveryCode: string) {
  try {
    return await apiRequest('/api/db/update-recovery', 'POST', { userId, currentPass, newRecoveryCode });
  } catch (error) {
    return { success: false, error: 'System error.' };
  }
}

export async function resetUserPasswordWithRecovery(pNo: string, recoveryCode: string, newKey: string) {
  try {
    return await apiRequest('/api/db/reset-password', 'POST', { pNo, recoveryCode, newKey });
  } catch (error) {
    return { success: false, error: 'SYSTEM_ERROR' };
  }
}

export async function deleteUser(id: number) {
  try {
    await apiRequest(`/api/db/user/${id}`, 'DELETE');
    return true;
  } catch (error) {
    return false;
  }
}

export async function deleteAssessmentResult(id: number) {
  try {
    await apiRequest(`/api/db/result/${id}`, 'DELETE');
    return true;
  } catch (error) {
    return false;
  }
}
