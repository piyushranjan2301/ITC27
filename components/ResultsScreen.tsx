
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScoringResult, AssessmentState, Language } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Radar as RadarFill,
  BarChart, Bar, XAxis, Cell
} from 'recharts';
import { 
  Trophy, Zap, Loader2, Award, Flame, Crown, Lock,
  Medal, Activity, CheckCircle2, FileText, Clock,
  Sparkles, Check
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { fetchAssessmentResults } from '../db';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ITCLogo from './ITCLogo';
import ReactMarkdown from 'react-markdown';

interface Props {
  language: Language;
  results: ScoringResult;
  responses: AssessmentState;
}

const ALL_POSSIBLE_BADGES = [
  { name: "Certified Participant", tier: "Common", color: "text-slate-500", bg: "bg-slate-50" },
  { name: "Engagement Star", tier: "Rare", color: "text-blue-500", bg: "bg-blue-50" },
  { name: "Strategic Thinker", tier: "Epic", color: "text-purple-500", bg: "bg-purple-50" },
  { name: "Safety Shield", tier: "Rare", color: "text-emerald-500", bg: "bg-emerald-50" },
  { name: "Team Catalyst", tier: "Epic", color: "text-orange-500", bg: "bg-blue-50" },
  { name: "High Morale Hero", tier: "Legendary", color: "text-amber-500", bg: "bg-amber-50" },
  { name: "Precision Expert", tier: "Rare", color: "text-indigo-500", bg: "bg-indigo-50" }
];

const ResultsScreen: React.FC<Props> = ({ language, results, responses }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [globalStats, setGlobalStats] = useState<any>(null);
  
  const certificateRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateAIInsight();
    loadGlobalTelemetry();
  }, []);

  const loadGlobalTelemetry = async () => {
    try {
      const data = await fetchAssessmentResults();
      if (!data || data.length === 0) return;
      
      const deptSums: Record<string, { total: number, count: number }> = {};
      data.forEach(item => {
        const dept = item.loginInfo?.department || 'General';
        if (!deptSums[dept]) deptSums[dept] = { total: 0, count: 0 };
        deptSums[dept].total += item.totalPoints || 0;
        deptSums[dept].count += 1;
      });

      const benchmarks = Object.entries(deptSums).map(([name, stats]) => ({
        name: name.split(' ').slice(0, 2).join(' '),
        fullName: name,
        avg: Math.round(stats.total / stats.count),
        isUserDept: results.loginInfo?.department === name
      }));

      setGlobalStats({ benchmarks, totalParticipants: data.length });
    } catch (err) {
      console.error("Telemetry Error:", err);
    }
  };

  const generateAIInsight = async () => {
    setAnalyzing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) throw new Error("API_KEY_MISSING");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Act as a helpful ITC Career Guide. Summarize this worker's profile for them.
      - Worker Name: ${results.loginInfo?.employeeName}
      - Achievement Category: ${results.category}
      - Total Points Earned: ${results.totalPoints}
      - Engagement Score: ${results.engagementScore.toFixed(2)} / 5.0
      
      Output Language: ${language === 'hi' ? 'Hindi' : 'English'}.
      Tone: Simple, encouraging, positive, and clear.
      Length: Short (2-3 sentences).`;
      
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt
      });
      setAiAnalysis(response.text || (language === 'hi' ? "शानदार काम!" : "Great work!"));
    } catch (err) {
      setAiAnalysis(language === 'hi' ? "आप बहुत अच्छा काम कर रहे हैं!" : "You are doing great!");
    } finally {
      setAnalyzing(false);
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadPDF = async (ref: React.RefObject<HTMLDivElement>, filename: string, orientation: 'portrait' | 'landscape') => {
    if (!ref.current) return;
    const isCert = filename.includes('Cert');
    if (isCert) setIsGeneratingCert(true);
    else setIsGeneratingReport(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const canvas = await html2canvas(ref.current, {
        scale: 4, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: ref.current.scrollWidth,
        height: ref.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: orientation, unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      if (isCert) setIsGeneratingCert(false);
      else setIsGeneratingReport(false);
    }
  };

  const levelInfo = useMemo(() => {
    const p = results.totalPoints;
    if (p >= 3500) return { name: language === 'hi' ? 'ग्रैंडमास्टर' : 'Grandmaster', icon: <Crown />, color: 'from-amber-400 to-amber-600', max: 5000 };
    if (p >= 2000) return { name: language === 'hi' ? 'मास्टर' : 'Master', icon: <Award />, color: 'from-purple-500 to-indigo-600', max: 3500 };
    if (p >= 1000) return { name: language === 'hi' ? 'विशेषज्ञ' : 'Expert', icon: <Flame />, color: 'from-orange-500 to-rose-600', max: 2000 };
    return { name: language === 'hi' ? 'नौसिखिया' : 'Novice', icon: <Zap />, color: 'from-slate-400 to-slate-600', max: 1000 };
  }, [results.totalPoints, language]);

  const progressToNext = Math.min(100, (results.totalPoints / levelInfo.max) * 100);
  const radarData = Object.entries(results.behavioralProfile).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-10 py-4 animate-in fade-in duration-700">
      
      {/* 
        CORPORATE OPERATIONAL EXCELLENCE CERTIFICATE 
        CLEAN MINIMALIST AESTHETICS
      */}
      <div className="fixed -left-[40000px] top-0 pointer-events-none" aria-hidden="true">
        <div 
          ref={certificateRef}
          className="w-[297mm] h-[210mm] bg-white p-[15mm] relative flex flex-col items-center overflow-hidden font-sans"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Sophisticated Corporate Border */}
          <div className="absolute inset-[10mm] border-[1px] border-slate-200 pointer-events-none" />
          <div className="absolute inset-[12mm] border-[4px] border-[#002a5c] pointer-events-none" />
          
          {/* Content Container */}
          <div className="relative z-10 flex flex-col items-center w-full h-full py-12 px-20">
            {/* Logo Section */}
            <div className="mb-12">
              <ITCLogo className="w-32 h-20" variant="color" />
            </div>

            {/* Header Section */}
            <div className="flex flex-col items-center mb-16">
              <h1 className="text-[#002a5c] text-[52px] font-playfair font-black uppercase tracking-tight text-center leading-tight">
                CERTIFICATE OF OPERATIONAL EXCELLENCE
              </h1>
              <div className="w-24 h-1 bg-[#002a5c] mt-6" />
            </div>

            {/* Recipient Section */}
            <div className="flex-1 flex flex-col items-center text-center w-full">
              <p className="text-slate-500 text-[22px] font-medium mb-8">This is to certify that</p>
              
              <div className="mb-6">
                <h3 className="text-slate-900 text-[72px] font-bold tracking-tight leading-none">
                  {results.loginInfo?.employeeName}
                </h3>
              </div>

              <div className="mb-10">
                <p className="text-slate-600 text-[24px] font-bold tracking-widest uppercase">
                  P.NO: {results.loginInfo?.pNo}
                </p>
              </div>
              
              <p className="text-slate-500 text-[20px] font-medium max-w-3xl leading-relaxed">
                has successfully completed the
              </p>
              <p className="text-[#002a5c] text-[24px] font-bold mt-2">
                ITC Factory Engagement & Behavioral Assessment
              </p>
            </div>

            {/* Footer Section */}
            <div className="w-full grid grid-cols-3 items-end gap-16 mt-12">
              {/* Date of Award */}
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">DATE OF AWARD</p>
                <p className="text-[20px] font-bold text-slate-900">
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Performance Tier Badge */}
              <div className="flex justify-center">
                <div className="bg-slate-100 border border-slate-200 px-8 py-4 rounded-lg shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">PERFORMANCE TIER</p>
                  <p className="text-[24px] font-black text-[#002a5c] uppercase whitespace-nowrap">{results.category}</p>
                </div>
              </div>

              {/* Signature Block */}
              <div className="text-right">
                <div className="border-b border-slate-300 pb-2 mb-2">
                  <p className="font-playfair italic text-[28px] text-slate-900 leading-none">
                    Digital Signature
                  </p>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PLANT OPERATIONS HEAD</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED DIAGNOSTIC REPORT CARD (OFF-SCREEN) */}
      <div className="fixed -left-[40000px] top-[300mm] pointer-events-none" aria-hidden="true">
        <div 
          ref={reportRef}
          className="w-[210mm] h-[297mm] bg-white p-[12mm] flex flex-col text-slate-900 relative overflow-hidden"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Subtle Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-50 rounded-full -ml-48 -mb-48" />

          {/* Header */}
          <div className="relative z-10 flex justify-between items-end border-b-2 border-[#002a5c] pb-6 mb-10">
            <div className="flex items-center gap-4">
              <ITCLogo className="w-24 h-12" variant="color" />
              <div className="w-[1px] h-10 bg-slate-200" />
              <div>
                <h2 className="text-2xl font-black text-[#002a5c] tracking-tighter uppercase">Operational Diagnostics</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Factory Intelligence Report</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REPORT ID</p>
              <p className="text-sm font-bold text-slate-900">ITC-OP-{results.loginInfo?.pNo}-{new Date().getFullYear()}</p>
            </div>
          </div>

          {/* Profile Section */}
          <div className="relative z-10 grid grid-cols-3 gap-8 mb-10">
            <div className="col-span-2 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee Information</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{results.loginInfo?.employeeName}</h3>
                <div className="flex items-center gap-4 text-slate-500 font-bold">
                  <span className="text-lg">P.NO: {results.loginInfo?.pNo}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-lg">{results.loginInfo?.department}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Assessment Date</p>
                  <p className="text-sm font-bold">{new Date().toLocaleDateString('en-GB')}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Completion Time</p>
                  <p className="text-sm font-bold">{formatTime(results.timeTakenSeconds)}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#002a5c] text-white p-8 rounded-[2.5rem] flex flex-col justify-center items-center text-center shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Performance Tier</p>
              <p className="text-4xl font-black leading-tight mb-4">{results.category}</p>
              <div className="w-full h-[1px] bg-white/20 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Certified Result</p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="relative z-10 grid grid-cols-3 gap-6 mb-10">
            <div className="bg-white border-2 border-slate-50 p-6 rounded-3xl shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Engagement</p>
              <p className="text-4xl font-black text-[#002a5c]">{results.engagementScore.toFixed(2)}</p>
              <p className="text-[9px] font-bold text-blue-600 uppercase mt-2 tracking-widest">{results.engagementLevel} Level</p>
            </div>

            <div className="bg-white border-2 border-slate-50 p-6 rounded-3xl shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Merit Points</p>
              <p className="text-4xl font-black text-[#002a5c]">{results.totalPoints}</p>
              <p className="text-[9px] font-bold text-amber-600 uppercase mt-2 tracking-widest">Performance Score</p>
            </div>

            <div className="bg-white border-2 border-slate-50 p-6 rounded-3xl shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Badges</p>
              <p className="text-4xl font-black text-[#002a5c]">{results.badges.length}</p>
              <p className="text-[9px] font-bold text-emerald-600 uppercase mt-2 tracking-widest">Earned Medals</p>
            </div>
          </div>

          {/* Behavioral Radar & Traits */}
          <div className="relative z-10 grid grid-cols-2 gap-8 mb-10">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Behavioral Profile</h4>
              <div className="space-y-4">
                {Object.entries(results.behavioralProfile).map(([trait, value], idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold uppercase">
                      <span className="text-slate-600">{trait}</span>
                      <span className="text-[#002a5c]">{value as number}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#002a5c] rounded-full" 
                        style={{ width: `${((value as number) / 6) * 100}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Strategic Alignment</h4>
              <div className="flex-1 flex flex-col justify-center gap-4">
                {Object.entries(results.sjtAlignment).map(([align, value], idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#002a5c] font-black text-sm">
                      {value}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-slate-400 leading-none mb-1">Alignment</p>
                      <p className="text-sm font-bold text-slate-900">{align}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Synthesis */}
          <div className="relative z-10 flex-1 bg-[#002a5c] text-white p-10 rounded-[3rem] shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] opacity-80">AI Executive Synthesis</h4>
            </div>
            <div className="space-y-6">
              <p className="text-xl font-medium leading-relaxed italic opacity-90">
                "{aiAnalysis || 'Generating professional behavioral synthesis...'}"
              </p>
              <div className="h-[1px] w-full bg-white/10" />
              <p className="text-sm leading-relaxed opacity-70">
                This diagnostic summary is based on the multi-phase engagement and behavioral assessment conducted at ITC Factory. 
                The results reflect current operational readiness and strategic alignment within the factory ecosystem.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 pt-8 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">
              OFFICIAL DIGITAL RECORD • SECURELY VALIDATED BY ITC INTELLIGENCE HUB
            </p>
          </div>
        </div>
      </div>

      {/* VISIBLE RESULTS DASHBOARD UI */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 bg-slate-950 overflow-hidden rounded-[3rem] text-white relative shadow-2xl">
          <div className="relative z-10 p-12 flex flex-col lg:flex-row items-center gap-10">
             <div className="relative">
               <div className={`w-36 h-36 bg-slate-900 rounded-[2.5rem] flex items-center justify-center border-4 border-white/10 relative overflow-hidden`}>
                 <div className={`absolute inset-0 bg-gradient-to-br ${levelInfo.color} opacity-20`} />
                 {React.cloneElement(levelInfo.icon as React.ReactElement<any>, { className: "w-20 h-20 text-white" })}
               </div>
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white text-slate-950 px-4 py-1 rounded-xl font-black text-[10px] uppercase shadow-lg whitespace-nowrap">
                 {levelInfo.name}
               </div>
             </div>
             <div className="flex-1 space-y-6 text-center lg:text-left">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight">{results.loginInfo?.employeeName}</h1>
                    <p className="text-indigo-400 font-black uppercase text-[11px] tracking-widest">{language === 'hi' ? 'कार्य स्तर' : 'Work Level'}: {results.category}</p>
                </div>
                <div className="space-y-2 max-w-lg mx-auto lg:mx-0">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>{language === 'hi' ? 'प्रगति' : 'Progress'}</span>
                    <span>{results.totalPoints} / {levelInfo.max} Pts</span>
                  </div>
                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${levelInfo.color} rounded-full`} style={{ width: `${progressToNext}%` }} />
                  </div>
                </div>
             </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col justify-center items-center text-center gap-4 transition-all">
           <Activity className="w-10 h-10 text-emerald-500" />
           <div>
              <p className="text-5xl font-black text-slate-950 dark:text-white">{results.engagementScore.toFixed(1)}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{language === 'hi' ? 'काम की ऊर्जा' : 'Work Energy'}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-slate-50 dark:border-slate-800 flex flex-col gap-6">
           <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-500" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{language === 'hi' ? 'मेरे मेडल' : 'My Medals'}</h3>
           </div>
           <div className="space-y-3">
              {ALL_POSSIBLE_BADGES.map((badge, idx) => {
                const isEarned = results.badges.includes(badge.name);
                return (
                  <div key={idx} className={`p-4 rounded-2xl border flex items-center gap-4 ${isEarned ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm' : 'opacity-30'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEarned ? badge.bg : 'bg-slate-100'}`}>
                      {isEarned ? <Medal className={`w-5 h-5 ${badge.color}`} /> : <Lock className="w-4 h-4 text-slate-300" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900 dark:text-white">{badge.name}</p>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-xl flex flex-col justify-center">
                <div className="flex items-start gap-4">
                  <Sparkles className="w-8 h-8 shrink-0" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-black">{language === 'hi' ? 'मददगार सुझाव' : 'Helpful Tips'}</h3>
                    {analyzing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <div className="text-lg opacity-90 italic prose prose-invert max-w-none">
                        <ReactMarkdown>{aiAnalysis || ""}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-xl border border-slate-50 dark:border-slate-800 flex flex-col justify-center items-center text-center gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                   <p className="text-4xl font-black text-slate-950 dark:text-white">{formatTime(results.timeTakenSeconds)}</p>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{language === 'hi' ? 'कुल समय' : 'Completion Time'}</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] shadow-xl border border-slate-50 dark:border-slate-800 h-[380px] flex flex-col">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{language === 'hi' ? 'काम करने का तरीका' : 'Working Style'}</h4>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                       <PolarGrid stroke="#f1f5f9" /><PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                       <RadarFill dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} strokeWidth={3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] shadow-xl border border-slate-50 dark:border-slate-800 h-[380px] flex flex-col">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{language === 'hi' ? 'टीमों की तुलना' : 'Team Comparison'}</h4>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={globalStats?.benchmarks || []}>
                      <XAxis dataKey="name" hide />
                      <Bar dataKey="avg" radius={[10, 10, 10, 10]}>
                        {globalStats?.benchmarks?.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.isUserDept ? '#6366f1' : '#e2e8f0'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-5 blur-[100px]" />
         <div className="space-y-1 text-center md:text-left relative z-10">
            <h4 className="text-3xl font-black">{language === 'hi' ? 'अपनी उपलब्धियां प्राप्त करें' : 'Download Your Rewards'}</h4>
            <p className="text-slate-400 text-lg">{language === 'hi' ? 'अपना आधिकारिक प्रमाण पत्र और रिपोर्ट कार्ड सुरक्षित रखें।' : 'Secure your official excellence certificate and strategic report.'}</p>
         </div>
         <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <button 
              onClick={() => downloadPDF(certificateRef, `ITC_Excellence_Cert_${results.loginInfo?.pNo}.pdf`, 'landscape')} 
              disabled={isGeneratingCert}
              className={`px-10 py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl ${
                isGeneratingCert ? 'bg-slate-800 text-slate-500' : 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95'
              }`}
            >
              {isGeneratingCert ? <Loader2 className="w-6 h-6 animate-spin" /> : <Medal className="w-6 h-6" />}
              {language === 'hi' ? 'प्रमाण पत्र (PDF)' : 'Official Certificate'}
            </button>
            <button 
              onClick={() => downloadPDF(reportRef, `ITC_Report_Card_${results.loginInfo?.pNo}.pdf`, 'portrait')} 
              disabled={isGeneratingReport}
              className={`px-10 py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl border border-white/10 ${
                isGeneratingReport ? 'bg-slate-800 text-slate-500' : 'bg-white/10 text-white hover:bg-white/20 active:scale-95'
              }`}
            >
              {isGeneratingReport ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
              {language === 'hi' ? 'रिपोर्ट कार्ड (PDF)' : 'Diagnostic Summary'}
            </button>
         </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
