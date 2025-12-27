
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trash2, Database, RefreshCw, Sparkles, BrainCircuit, Loader2, 
  Search, BarChart3, Users, ShieldCheck, 
  ChevronRight, Eye, X, Filter, Download, ArrowUpRight, TrendingUp,
  LayoutDashboard, History, Users2, PieChart, Activity, AlertTriangle,
  Target, Zap, Shield, MessageSquare, BarChart, Lock, Key, CheckCircle2, AlertCircle,
  UserMinus, UserPlus, Hash, Building2, Briefcase, MapPin, Factory, EyeOff, SlidersHorizontal,
  Calendar, RotateCcw, Crown, Medal, Star, Award, ChevronDown, ChevronUp,
  TrendingDown, ShieldAlert, Fingerprint, Copy, Check
} from 'lucide-react';
import { 
  fetchAssessmentResults, 
  fetchAllUsers, 
  deleteAssessmentResult, 
  deleteUser,
  updateUserPassword,
  updateUserRecoveryCode,
  testDatabaseConnection,
  wipeAllData
} from '../db';
import { GoogleGenAI } from "@google/genai";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Radar as RadarFill,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, PieChart as RechartsPieChart, Pie,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import ITCLogo from './ITCLogo';

interface Props {
  onBack: () => void;
  currentUser: any;
}

const AdminDashboard: React.FC<Props> = ({ onBack, currentUser }) => {
  const [assessmentData, setAssessmentData] = useState<any[]>([]);
  const [userData, setUserData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Results' | 'Gamification' | 'Directory' | 'AI Insights' | 'Security'>('Overview');
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterLoc, setFilterLoc] = useState('All');
  const [filterCat, setFilterCat] = useState('All');
  
  // Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [scoreMin, setScoreMin] = useState<string>('0');
  const [scoreMax, setScoreMax] = useState<string>('5');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

  // Sorting
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [userDeleteConfirmId, setUserDeleteConfirmId] = useState<number | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkUserDeleteConfirm, setBulkUserDeleteConfirm] = useState(false);
  const [wipeAllConfirm, setWipeAllConfirm] = useState(false);

  // Security States
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [recoveryForm, setRecoveryForm] = useState({ current: '', newCode: '' });
  const [passStatus, setPassStatus] = useState<any>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const dbCheck = await testDatabaseConnection();
      setDbStatus(dbCheck.success ? 'online' : 'offline');

      const [results, users] = await Promise.all([fetchAssessmentResults(), fetchAllUsers()]);
      setAssessmentData(results || []);
      setUserData(users || []);
    } catch (err) {
      console.error(err);
      setDbStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: number) => {
    const success = await deleteAssessmentResult(id);
    if (success) {
      setAssessmentData(prev => prev.filter(item => item.id !== id));
      setDeleteConfirmId(null);
    }
  };

  const handleUserDelete = async (id: number) => {
    const success = await deleteUser(id);
    if (success) {
      setUserData(prev => prev.filter(u => u.id !== id));
      setAssessmentData(prev => prev.filter(a => a.employee_id !== id));
      setUserDeleteConfirmId(null);
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    for (const item of filteredAssessments) {
      if (item.id) await deleteAssessmentResult(item.id);
    }
    await loadData();
    setBulkDeleteConfirm(false);
    setLoading(false);
  };

  const handleBulkUserDelete = async () => {
    setLoading(true);
    const usersToClear = filteredUsers.filter(u => u.employee_id_pno !== 'ADMIN-001');
    for (const user of usersToClear) {
      await deleteUser(user.id);
    }
    await loadData();
    setBulkUserDeleteConfirm(false);
    setLoading(false);
  };

  const handleWipeAll = async () => {
    setLoading(true);
    const result = await wipeAllData();
    if (result.success) {
      await loadData();
      setWipeAllConfirm(false);
      setActiveTab('Overview');
    } else {
      alert("Nuclear Wipe Failed: " + result.error);
    }
    setLoading(false);
  };

  const stats = useMemo(() => {
    const total = assessmentData.length;
    if (total === 0) return { total: 0, avgEngagement: 0, avgPoints: 0, badgesAwarded: 0, behavioralAverages: [], deptAnalysis: [], badgeAnalysis: [], trendData: [], categoryAnalysis: [] };
    const avgEngagement = assessmentData.reduce((acc, curr) => acc + curr.engagementScore, 0) / total;
    const avgPoints = assessmentData.reduce((acc, curr) => acc + (curr.totalPoints || 0), 0) / total;
    const badgesAwarded = assessmentData.reduce((acc, curr) => acc + (curr.badges?.length || 0), 0);
    
    const bSums: Record<string, number> = {};
    assessmentData.forEach(item => {
      Object.entries(item.behavioralProfile || {}).forEach(([trait, val]) => {
        bSums[trait] = (bSums[trait] || 0) + (val as number);
      });
    });
    const behavioralAverages = Object.entries(bSums).map(([name, sum]) => ({ name, value: Number((sum / total).toFixed(2)) }));

    const deptPts: Record<string, { total: number, count: number }> = {};
    assessmentData.forEach(item => {
      const d = item.loginInfo?.department || 'Other';
      if (!deptPts[d]) deptPts[d] = { total: 0, count: 0 };
      deptPts[d].total += item.totalPoints || 0;
      deptPts[d].count += 1;
    });
    const deptAnalysis = Object.entries(deptPts).map(([name, s]) => ({
      name,
      avg: Math.round(s.total / s.count)
    })).sort((a, b) => b.avg - a.avg);

    const badgeCounts: Record<string, number> = {};
    assessmentData.forEach(item => {
      (item.badges || []).forEach((b: string) => {
        badgeCounts[b] = (badgeCounts[b] || 0) + 1;
      });
    });
    const badgeAnalysis = Object.entries(badgeCounts).map(([name, count]) => ({
      name,
      value: count
    }));

    const catCounts: Record<string, number> = {};
    assessmentData.forEach(item => {
      catCounts[item.category] = (catCounts[item.category] || 0) + 1;
    });
    const categoryAnalysis = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

    const dailyPoints: Record<string, number> = {};
    assessmentData.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString();
      dailyPoints[date] = (dailyPoints[date] || 0) + (item.totalPoints || 0);
    });
    const trendData = Object.entries(dailyPoints).map(([date, points]) => ({ date, points })).slice(-7);

    return { total, avgEngagement, avgPoints, badgesAwarded, behavioralAverages, deptAnalysis, badgeAnalysis, trendData, categoryAnalysis };
  }, [assessmentData]);

  const filteredAssessments = useMemo(() => {
    let result = assessmentData.filter(item => {
      const matchesSearch = item.loginInfo?.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.loginInfo?.pNo?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDept === 'All' || item.loginInfo?.department === filterDept;
      const matchesLoc = filterLoc === 'All' || item.loginInfo?.location === filterLoc;
      const matchesCat = filterCat === 'All' || item.category === filterCat;
      const score = item.engagementScore;
      const matchesScore = score >= parseFloat(scoreMin || '0') && score <= parseFloat(scoreMax || '5');
      
      const createdAt = new Date(item.created_at).getTime();
      const start = dateStart ? new Date(dateStart).setHours(0,0,0,0) : 0;
      const end = dateEnd ? new Date(dateEnd).setHours(23,59,59,999) : Infinity; 
      const matchesDate = createdAt >= start && createdAt <= end;
      
      const matchesTrait = selectedTraits.length === 0 || 
                          selectedTraits.some(trait => (item.behavioralProfile?.[trait] || 0) > 0);

      return matchesSearch && matchesDept && matchesLoc && matchesCat && matchesScore && matchesDate && matchesTrait;
    });

    result.sort((a, b) => {
      let valA: any, valB: any;
      if (sortKey === 'loginInfo.employeeName') {
        valA = a.loginInfo?.employeeName?.toLowerCase() || '';
        valB = b.loginInfo?.employeeName?.toLowerCase() || '';
      } else if (sortKey === 'loginInfo.pNo') {
        valA = Number(a.loginInfo?.pNo) || 0;
        valB = Number(b.loginInfo?.pNo) || 0;
      } else {
        valA = a[sortKey] ?? 0;
        valB = b[sortKey] ?? 0;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [assessmentData, searchTerm, filterDept, filterLoc, filterCat, scoreMin, scoreMax, dateStart, dateEnd, selectedTraits, sortKey, sortOrder]);

  const filteredUsers = useMemo(() => {
    return userData.filter(u => 
      u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
      u.employee_id_pno?.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [userData, userSearchTerm]);

  const generateAIAnalysis = async () => {
    if (assessmentData.length === 0) return;
    setAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as a senior HR analyst for ITC. Analyze this workforce survey dataset:
      - Participants: ${assessmentData.length}
      - Avg Engagement Pulse: ${stats.avgEngagement.toFixed(2)} / 5.0
      - Avg Excellence Points: ${stats.avgPoints.toFixed(0)}
      - Top Department: ${stats.deptAnalysis[0]?.name || 'N/A'}
      
      Provide a strategic summary with 3 sections:
      1. Morale Pulse (Sentiment analysis)
      2. Performance DNA (Key behavioral trends)
      3. Strategic Advice (How to improve excellence).
      Keep the tone professional and forward-thinking. Use bullet points.`;
      
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-pro-preview', 
        contents: prompt
      });
      setAiInsight(response.text || "Analysis complete.");
    } catch (err) {
      console.error("AI Insight Generation Failed:", err);
      setAiInsight("AI Analysis failed to compute. Please ensure the system has an active connection and try again.");
    } finally { setAnalyzing(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) return setPassStatus({ type: 'error', msg: 'Passwords do not match.' });
    setPassStatus({ type: 'loading', msg: 'Updating...' });
    const result = await updateUserPassword(currentUser.id, passForm.current, passForm.new);
    setPassStatus(result.success ? { type: 'success', msg: 'Security key updated successfully!' } : { type: 'error', msg: result.error });
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const exportCSV = () => {
    if (filteredAssessments.length === 0) return;
    
    const headers = ['Employee Name', 'P.NO', 'Department', 'Designation', 'Location', 'Engagement Score', 'Engagement Level', 'Total Points', 'Category', 'Feedback', 'Date'];
    const rows = filteredAssessments.map(row => [
      `"${row.loginInfo?.employeeName || ''}"`,
      `"${row.loginInfo?.pNo || ''}"`,
      `"${row.loginInfo?.department || ''}"`,
      `"${row.loginInfo?.designation || ''}"`,
      `"${row.loginInfo?.location || ''}"`,
      row.engagementScore.toFixed(2),
      row.engagementLevel,
      row.totalPoints,
      row.category,
      `"${(row.feedback || '').replace(/"/g, '""')}"`,
      new Date(row.created_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ITC_Assessments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const RecordDetailsModal = ({ record, onClose }: { record: any; onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/90 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[4rem] p-12 relative shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X /></button>
        <div className="flex flex-col md:flex-row gap-8 mb-12">
           <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center shadow-xl">
             <ITCLogo className="w-16 h-16" variant="color" />
           </div>
           <div>
             <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{record.loginInfo?.employeeName}</h3>
             <p className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.4em] uppercase text-xs mt-2">P.NO: {record.loginInfo?.pNo} • {record.category}</p>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Core Engagement</p>
            <div className="text-5xl font-black text-slate-900 dark:text-white mb-1">{record.engagementScore.toFixed(2)}</div>
            <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${record.engagementLevel === 'High' ? 'bg-emerald-100 text-emerald-700' : record.engagementLevel === 'Low' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{record.engagementLevel}</p>
          </div>
          <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Excellence Points</p>
            <div className="text-5xl font-black text-slate-900 dark:text-white mb-1">{record.totalPoints}</div>
            <p className="text-[10px] font-black uppercase text-slate-400">Total Accumulation</p>
          </div>
          <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Badges Earned</p>
            <div className="text-5xl font-black text-slate-900 dark:text-white mb-1">{record.badges?.length || 0}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {record.badges?.map((b: string) => <span key={b} className="text-[8px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-600">{b}</span>)}
            </div>
          </div>
        </div>
        <div className="mt-8 p-8 bg-indigo-50 dark:bg-indigo-950/20 rounded-[2.5rem]">
          <p className="text-[10px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Direct Feedback</p>
          <p className="text-xl font-bold italic text-indigo-900 dark:text-indigo-300">"{record.feedback || 'No feedback recorded.'}"</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <LayoutDashboard className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            Admin Intelligence Terminal
          </h2>
          <div className="flex items-center gap-4 text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
            <span>System Status:</span>
            <span className={`flex items-center gap-1.5 ${dbStatus === 'online' ? 'text-emerald-500' : 'text-rose-500'}`}>
              <Database className="w-3 h-3" />
              {dbStatus.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={loadData} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">
             <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
           </button>
           <button onClick={onBack} className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20">
             Close Console
           </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
        {(['Overview', 'Results', 'Gamification', 'Directory', 'AI Insights', 'Security'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap transition-all border ${
              activeTab === tab 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl scale-105' 
              : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Synchronizing Encrypted Data...</p>
        </div>
      ) : activeTab === 'Overview' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Assessments', val: stats.total, icon: <Users2 />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { label: 'Avg Pulse', val: stats.avgEngagement.toFixed(2), icon: <Activity />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { label: 'Excellence Points', val: Math.round(stats.avgPoints), icon: <Award />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                { label: 'Badges Issued', val: stats.badgesAwarded, icon: <Medal />, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' }
              ].map((s, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg} ${s.color}`}>
                    {React.cloneElement(s.icon as React.ReactElement, { className: 'w-7 h-7' })}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{s.val}</p>
                  </div>
                </div>
              ))}
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
                <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest">Sentiment Trend (7 Days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="points" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
                <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest">Department Benchmarks</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={stats.deptAnalysis}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <Bar dataKey="avg" fill="#6366f1" radius={[10, 10, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      ) : activeTab === 'Results' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
           {/* Filters */}
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex-1 min-w-[300px] relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    placeholder="Search P.NO or Name..." 
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 dark:text-white font-bold outline-none transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${showAdvancedFilters ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
                <button onClick={exportCSV} className="px-6 py-4 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 transition-all">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={() => setBulkDeleteConfirm(true)} className="px-6 py-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all">
                  <Trash2 className="w-4 h-4" /> Clear Filtered
                </button>
              </div>

              {showAdvancedFilters && (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><Calendar className="w-3 h-3" /> Start Date</label>
                      <input type="date" className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><Calendar className="w-3 h-3" /> End Date</label>
                      <input type="date" className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
                   </div>
                   <div className="flex items-end">
                      <button onClick={() => { setDateStart(''); setDateEnd(''); setScoreMin('0'); setScoreMax('5'); }} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Reset Date Filters</button>
                   </div>
                </div>
              )}
           </div>

           {/* Results Table */}
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      {(['loginInfo.employeeName', 'loginInfo.pNo', 'engagementScore', 'totalPoints', 'created_at'] as const).map(k => (
                        <th key={k} onClick={() => handleSort(k)} className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:text-slate-900 dark:hover:text-white">
                          <div className="flex items-center gap-2">
                            {k.split('.').pop()?.replace('_', ' ')}
                            {sortKey === k && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                          </div>
                        </th>
                      ))}
                      <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssessments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No matching results found</td>
                      </tr>
                    ) : (
                      filteredAssessments.map(row => (
                        <tr key={row.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                          <td className="px-8 py-6">
                            <p className="font-black text-slate-900 dark:text-white">{row.loginInfo?.employeeName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{row.loginInfo?.department}</p>
                          </td>
                          <td className="px-8 py-6 font-mono font-bold text-slate-500">{row.loginInfo?.pNo}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <span className="font-black text-slate-900 dark:text-white">{row.engagementScore.toFixed(2)}</span>
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${row.engagementLevel === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{row.engagementLevel}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="font-black text-indigo-600 dark:text-indigo-400">{row.totalPoints}</span>
                          </td>
                          <td className="px-8 py-6 text-[10px] font-bold text-slate-400">{new Date(row.created_at).toLocaleDateString()}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSelectedRecord(row)} className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => setDeleteConfirmId(row.id)} className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      ) : activeTab === 'Directory' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-6">
              <div className="flex-1 min-w-[300px] relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input 
                   placeholder="Search Directory (Name, P.No)..." 
                   className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 dark:text-white font-bold outline-none transition-all"
                   value={userSearchTerm}
                   onChange={e => setUserSearchTerm(e.target.value)}
                 />
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-4 rounded-2xl flex items-center gap-3">
                 <Users className="w-5 h-5 text-indigo-600" />
                 <span className="text-xs font-black uppercase text-indigo-700 tracking-widest">{filteredUsers.length} Total Users</span>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee Name</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">P.NO</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Dept & Desig</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Location</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Access</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Data Mgmt</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500">
                                {user.full_name?.charAt(0)}
                              </div>
                              <p className="font-black text-slate-900 dark:text-white">{user.full_name}</p>
                           </div>
                        </td>
                        <td className="px-8 py-6 font-mono font-bold text-slate-500">{user.employee_id_pno}</td>
                        <td className="px-8 py-6">
                           <p className="text-xs font-black text-slate-700 dark:text-slate-300">{user.department}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">{user.designation}</p>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-slate-500">
                              <MapPin className="w-3 h-3" />
                              <span className="text-xs font-bold">{user.location}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                             {user.role}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <button 
                             onClick={async () => {
                               const results = await fetchAssessmentResults();
                               const record = results.find(r => r.loginInfo.pNo === user.employee_id_pno);
                               if (record) {
                                 await deleteAssessmentResult(record.id);
                                 loadData();
                                 alert(`Assessment data cleared for ${user.full_name}`);
                               } else {
                                 alert('No assessment data found for this user.');
                               }
                             }}
                             className="text-[9px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 border-2 border-rose-100 dark:border-rose-900/30 px-3 py-1 rounded-xl transition-all"
                           >
                             Clear Assessment
                           </button>
                        </td>
                        <td className="px-8 py-6">
                           <button 
                             disabled={user.employee_id_pno === 'ADMIN-001'}
                             onClick={() => setUserDeleteConfirmId(user.id)} 
                             className={`p-2.5 rounded-xl transition-all ${user.employee_id_pno === 'ADMIN-001' ? 'opacity-20 cursor-not-allowed' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`}
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      ) : activeTab === 'Gamification' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
                 <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest">Badge Distribution</h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                       <Pie 
                         data={stats.badgeAnalysis} 
                         innerRadius={80} 
                         outerRadius={120} 
                         paddingAngle={5} 
                         dataKey="value"
                       >
                         {stats.badgeAnalysis.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5]} />
                         ))}
                       </Pie>
                       <RechartsTooltip />
                       <Legend />
                    </RechartsPieChart>
                 </ResponsiveContainer>
              </div>
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
                 <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest">Performance Tiers</h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart layout="vertical" data={stats.categoryAnalysis}>
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} width={120} />
                       <RechartsTooltip />
                       <Bar dataKey="value" fill="#10b981" radius={[0, 10, 10, 0]} />
                    </RechartsBarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                 <Crown className="w-8 h-8 text-amber-500" />
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Top Performers Leaderboard</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {assessmentData.slice(0, 3).map((item, idx) => (
                   <div key={idx} className={`p-8 rounded-[2.5rem] border-2 relative overflow-hidden flex flex-col items-center text-center gap-4 transition-all hover:scale-105 ${idx === 0 ? 'bg-amber-50 border-amber-200' : idx === 1 ? 'bg-slate-50 border-slate-200' : 'bg-orange-50 border-orange-200'}`}>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-orange-400 text-white' : ''}`}>
                        {idx + 1}
                      </div>
                      <div>
                         <p className="text-xl font-black text-slate-900">{item.loginInfo?.employeeName}</p>
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.loginInfo?.department}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-4xl font-black text-slate-900">{item.totalPoints}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">Total Excellence Pts</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      ) : activeTab === 'AI Insights' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="bg-indigo-600 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 blur-[100px]" />
              <div className="relative z-10 max-w-3xl space-y-6">
                 <div className="flex items-center gap-4">
                   <div className="bg-white/20 p-4 rounded-3xl"><Sparkles className="w-10 h-10" /></div>
                   <h3 className="text-4xl font-black tracking-tight">Strategy Generator</h3>
                 </div>
                 <p className="text-indigo-100 text-xl font-medium">Use the Gemini Reasoning Engine to synthesize multi-dimensional employee data into actionable leadership insights.</p>
                 <button 
                   onClick={generateAIAnalysis} 
                   disabled={analyzing}
                   className={`px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
                     analyzing ? 'bg-white/20 text-white/50' : 'bg-white text-indigo-900 hover:bg-indigo-50 shadow-xl'
                   }`}
                 >
                   {analyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <BrainCircuit className="w-6 h-6" />}
                   Generate Tactical Analysis
                 </button>
              </div>
           </div>

           {aiInsight && (
             <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-500">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                   <div className="whitespace-pre-wrap font-medium text-lg text-slate-700 dark:text-slate-300 leading-relaxed">{aiInsight}</div>
                </div>
             </div>
           )}
        </div>
      ) : activeTab === 'Security' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600"><Lock className="w-6 h-6" /></div>
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Credentials</h3>
              </div>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Current Key</label>
                    <input type="password" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 dark:text-white font-black" value={passForm.current} onChange={e => setFormState(setPassForm, 'current', e.target.value)} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Key</label>
                       <input type="password" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 dark:text-white font-black" value={passForm.new} onChange={e => setFormState(setPassForm, 'new', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm</label>
                       <input type="password" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 dark:text-white font-black" value={passForm.confirm} onChange={e => setFormState(setPassForm, 'confirm', e.target.value)} />
                    </div>
                 </div>
                 {passStatus && <p className={`text-[11px] font-black uppercase ${passStatus.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{passStatus.msg}</p>}
                 <button type="submit" className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl">Update Access</button>
              </form>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600"><AlertTriangle className="w-6 h-6" /></div>
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Danger Zone</h3>
              </div>
              <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-3xl space-y-4">
                 <p className="text-xs font-bold text-rose-800 dark:text-rose-400">Warning: The following action will permanently purge all employee data and assessments. This cannot be undone.</p>
                 <button onClick={() => setWipeAllConfirm(true)} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                   <Fingerprint className="w-4 h-4" /> Execute System Wipe
                 </button>
              </div>
           </div>
        </div>
      ) : null}

      {/* Modals */}
      {selectedRecord && <RecordDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
      
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/40">
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-6">
              <div className="bg-rose-50 dark:bg-rose-950/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-rose-600"><AlertCircle className="w-10 h-10" /></div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">Purge Record?</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Are you sure you want to permanently delete this worker assessment?</p>
              <div className="flex gap-4">
                 <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-[10px]">Cancel</button>
                 <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-4 rounded-2xl bg-rose-600 text-white font-black uppercase text-[10px]">Delete</button>
              </div>
           </div>
        </div>
      )}

      {userDeleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/40">
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-6">
              <div className="bg-rose-50 dark:bg-rose-950/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-rose-600"><UserMinus className="w-10 h-10" /></div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">Delete User?</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Deleting this user will also erase all their assessment records from the history.</p>
              <div className="flex gap-4">
                 <button onClick={() => setUserDeleteConfirmId(null)} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-[10px]">Cancel</button>
                 <button onClick={() => handleUserDelete(userDeleteConfirmId)} className="flex-1 py-4 rounded-2xl bg-rose-600 text-white font-black uppercase text-[10px]">Delete User</button>
              </div>
           </div>
        </div>
      )}

      {wipeAllConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl bg-rose-950/60">
           <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-2xl max-w-lg w-full text-center space-y-8 animate-in zoom-in-95">
              <div className="bg-rose-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-white shadow-2xl shadow-rose-500/50"><ShieldAlert className="w-14 h-14" /></div>
              <div className="space-y-2">
                <h4 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nuclear Reset</h4>
                <p className="text-rose-600 dark:text-rose-400 font-black uppercase text-[10px] tracking-[0.3em]">Authorized Personnel Only</p>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">This operation will wipe all employee records and survey results from the ITC Cloud Database. This action is irreversible.</p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleWipeAll} className="w-full py-5 rounded-2xl bg-rose-600 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-500/20">Purge Registry Now</button>
                 <button onClick={() => setWipeAllConfirm(false)} className="w-full py-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-xs tracking-widest">Abort Mission</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

function setFormState(setter: any, key: string, val: string) {
  setter((prev: any) => ({ ...prev, [key]: val }));
}

export default AdminDashboard;
