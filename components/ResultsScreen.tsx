
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScoringResult, AssessmentState, Language } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Radar as RadarFill,
  BarChart, Bar, XAxis, Cell
} from 'recharts';
import { 
  Trophy, Zap, Loader2, Award, Flame, Crown, Lock,
  Medal, Activity, AlertCircle, CheckCircle2, ShieldCheck, FileText, Clock,
  QrCode, Shield, Sparkles
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { fetchAssessmentResults } from '../db';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ITCLogo from './ITCLogo';

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
  { name: "Team Catalyst", tier: "Epic", color: "text-orange-500", bg: "bg-orange-50" },
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

  const certId = useMemo(() => {
    const timestamp = results.loginInfo?.timestamp ? new Date(results.loginInfo.timestamp).getTime() : Date.now();
    return `ITC-CERT-${results.loginInfo?.pNo}-${(timestamp % 100000).toString().padStart(5, '0')}`;
  }, [results]);

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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as a helpful ITC Career Guide. Summarize this worker's profile for them.
      - Worker Name: ${results.loginInfo?.employeeName}
      - Achievement Category: ${results.category}
      - Total Points Earned: ${results.totalPoints}
      - Engagement Score: ${results.engagementScore.toFixed(2)} / 5.0
      
      Output Language: ${language === 'hi' ? 'Hindi' : 'English'}.
      Tone: Simple, encouraging, positive, and clear.
      Length: Short (2-3 sentences).
      Objective: Congratulate them on their contribution to ITC and mention one potential growth area. Do not use corporate jargon.`;
      
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt
      });
      setAiAnalysis(response.text || (language === 'hi' ? "शानदार काम!" : "Great work!"));
    } catch (err) {
      console.error("AI Insight Failed:", err);
      setAiAnalysis(language === 'hi' ? "आप बहुत अच्छा काम कर रहे हैं! मेहनत जारी रखें।" : "You are doing great! Keep up the hard work.");
    } finally {
      setAnalyzing(false);
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeFeedback = (seconds?: number) => {
    if (!seconds) return '';
    if (seconds < 120) return language === 'hi' ? 'बहुत तेज़ (Fast)' : 'High Speed Response';
    if (seconds > 600) return language === 'hi' ? 'गहन विचार (Deep Thinker)' : 'Very Thorough Evaluation';
    return language === 'hi' ? 'इष्टतम समय (Optimal)' : 'Optimal Engagement Time';
  };

  const downloadPDF = async (ref: React.RefObject<HTMLDivElement>, filename: string, orientation: 'portrait' | 'landscape', isCert: boolean) => {
    if (!ref.current) return;
    const setLoader = isCert ? setIsGeneratingCert : setIsGeneratingReport;
    setLoader(true);
    
    try {
      await new Promise(r => setTimeout(r, 800));

      const canvas = await html2canvas(ref.current, {
        scale: 4, 
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById(isCert ? 'itc-cert-render' : 'itc-report-render');
          if (el) {
            el.style.position = 'static';
            el.style.display = 'flex';
            el.style.visibility = 'visible';
            el.style.opacity = '1';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (!imgData || imgData === 'data:,' || !imgData.startsWith('data:image/png;base64,')) {
        throw new Error("Invalid image generated.");
      }

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(filename);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert(language === 'hi' ? "फ़ाइल डाउनलोड करने में विफल। पुनः प्रयास करें।" : "Failed to download file. Please try again.");
    } finally {
      setLoader(false);
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
        PREMIUM INSTITUTIONAL CERTIFICATE
        Designed for prestige and physical authenticity
      */}
      <div className="fixed -left-[30000px] top-0 pointer-events-none" aria-hidden="true">
        <div 
          ref={certificateRef}
          id="itc-cert-render"
          className="w-[297mm] h-[210mm] bg-[#fdfaf5] p-[12mm] relative flex flex-col items-center justify-between border-[16px] border-[#002a5c]"
          style={{ 
            boxSizing: 'border-box',
            backgroundImage: 'radial-gradient(#002a5c15 1px, transparent 1px)',
            backgroundSize: '35px 35px'
          }}
        >
          {/* Parchment/Linen Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/linen-paper.png")' }} />

          {/* Luxury Border System */}
          <div className="absolute inset-4 border-[2px] border-[#d4af37] pointer-events-none" />
          <div className="absolute inset-8 border-[1px] border-[#002a5c11] pointer-events-none" />

          {/* Ornamental Corner Pieces */}
          <div className="absolute top-12 left-12 w-24 h-24 border-t-8 border-l-8 border-[#d4af37]" />
          <div className="absolute top-12 right-12 w-24 h-24 border-t-8 border-r-8 border-[#d4af37]" />
          <div className="absolute bottom-12 left-12 w-24 h-24 border-b-8 border-l-8 border-[#d4af37]" />
          <div className="absolute bottom-12 right-12 w-24 h-24 border-b-8 border-r-8 border-[#d4af37]" />

          {/* Central Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] scale-[2.5] pointer-events-none">
            <ITCLogo className="w-full h-full" variant="dark" />
          </div>

          {/* Header Branding */}
          <div className="mt-10 flex flex-col items-center relative z-10">
            <ITCLogo className="w-56 h-28 mb-6" variant="color" />
            <div className="text-center space-y-2">
              <h1 className="text-[#002a5c] text-[100px] font-black uppercase tracking-[0.25em] leading-none m-0 italic underline decoration-[#d4af37]/30 decoration-8 underline-offset-[20px]">CERTIFICATE</h1>
              <div className="flex items-center justify-center gap-8 pt-6">
                 <div className="h-[2px] w-32 bg-[#d4af37]" />
                 <h2 className="text-[#d4af37] text-2xl font-black uppercase tracking-[0.6em] whitespace-nowrap">OF OPERATIONAL EXCELLENCE</h2>
                 <div className="h-[2px] w-32 bg-[#d4af37]" />
              </div>
            </div>
          </div>

          {/* Recipient Content */}
          <div className="text-center flex-1 flex flex-col justify-center items-center w-full px-36 space-y-8 relative z-10">
            <p className="text-slate-400 text-3xl italic font-playfair font-black tracking-widest">This is to certify that</p>
            
            <div className="relative group">
               <h3 className="text-slate-900 text-[125px] font-playfair font-black tracking-tighter leading-none border-b-8 border-slate-100 pb-4 px-16 inline-block">
                 {results.loginInfo?.employeeName}
               </h3>
               <div className="flex items-center justify-center gap-4 mt-6">
                 <p className="text-[#002a5c] text-[32px] font-black uppercase tracking-[0.15em]">
                   P.NO: {results.loginInfo?.pNo}
                 </p>
                 <span className="text-[#d4af37] text-3xl opacity-50">•</span>
                 <p className="text-[#002a5c] text-[32px] font-black uppercase tracking-[0.15em]">
                   {results.loginInfo?.department} UNIT
                 </p>
               </div>
            </div>
            
            <p className="text-slate-500 text-2xl font-medium max-w-5xl leading-relaxed mt-4">
              has completed the comprehensive Factory Engagement & Strategic Assessment,<br/>exhibiting technical proficiency and workplace leadership at the tier of:
            </p>

            {/* Gold-Embossed Achievement Plaque */}
            <div className="relative mt-4 transform scale-110">
               <div className="absolute -inset-4 bg-[#d4af37] rounded-3xl blur-2xl opacity-20" />
               <div className="bg-gradient-to-r from-[#b8860b] via-[#ffd700] to-[#b8860b] p-[3px] rounded-2xl shadow-[0_20px_50px_rgba(184,134,11,0.4)]">
                 <div className="bg-[#002a5c] text-white px-28 py-8 rounded-xl flex items-center justify-center border border-white/20">
                    <Shield className="w-12 h-12 text-[#ffd700] mr-6 fill-[#ffd700]/10" />
                    <span className="text-[64px] font-black uppercase tracking-[0.18em] drop-shadow-md">{results.category}</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Footer Security Elements */}
          <div className="w-full flex justify-between items-end px-36 pb-20 relative z-10">
            
            {/* Left: Validation QR & Traceability */}
            <div className="flex items-end gap-10">
              <div className="p-5 bg-white border-[3px] border-slate-100 rounded-3xl shadow-2xl flex flex-col items-center relative group">
                <div className="absolute inset-0 bg-[#002a5c]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                <QrCode className="w-24 h-24 text-slate-800 relative z-10" strokeWidth={1.5} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Registry Trace</p>
              </div>
              <div className="text-left mb-2">
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Document ID</p>
                  <p className="text-sm font-mono font-black text-[#002a5c] tracking-tighter">{certId}</p>
                </div>
                <div className="h-[2px] w-64 bg-gradient-to-r from-[#d4af37] to-transparent my-4" />
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Issue Authority Date</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Center: Luxury Institutional Seal */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-12 scale-[1.35]">
               <div className="w-44 h-44 rounded-full border-[10px] border-[#d4af37] bg-white flex items-center justify-center shadow-[0_30px_60px_rgba(0,0,0,0.15)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37] via-[#fff8dc] to-[#d4af37] opacity-60" />
                  <div className="relative z-10 flex flex-col items-center">
                    <CheckCircle2 className="w-20 h-20 text-[#8b4513]" strokeWidth={3} />
                    <p className="text-[11px] font-black uppercase text-[#8b4513] tracking-[0.2em] mt-3">VERIFIED</p>
                    <p className="text-[8px] font-black uppercase text-[#8b4513] opacity-60 tracking-widest">EXCELLENCE HUB</p>
                  </div>
                  {/* Decorative Radial Guilloche Lines */}
                  <div className="absolute inset-0 border-[1px] border-dashed border-[#8b4513]/20 rounded-full m-3" />
                  <div className="absolute inset-0 border-[1px] border-dashed border-[#8b4513]/20 rounded-full m-5 rotate-45" />
               </div>
            </div>

            {/* Right: Signature & Executive Ratification */}
            <div className="text-center w-96">
              <div className="mb-6 relative">
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-25">
                  <ShieldCheck className="w-20 h-20 text-[#002a5c]" />
                </div>
                <div className="relative border-b-4 border-slate-900/90 pb-3 flex flex-col items-center">
                  <p className="font-playfair italic text-[42px] text-slate-800 tracking-tighter leading-none mb-1">
                    ITC Digital Registry
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">Integrated Authentication Unit</p>
                </div>
              </div>
              <p className="text-[13px] font-black uppercase tracking-[0.3em] text-slate-400">Executive Endorsement</p>
              <p className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">PLANT OPERATIONS HEAD</p>
            </div>
          </div>
        </div>
      </div>

      {/* OFF-SCREEN REPORT CONTAINER (Unchanged Structure, updated for clarity) */}
      <div className="fixed -left-[30000px] top-[300mm] pointer-events-none" aria-hidden="true">
        <div ref={reportRef} id="itc-report-render" className="w-[210mm] bg-white p-[15mm] text-slate-900 flex flex-col" style={{ boxSizing: 'border-box' }}>
          <div className="flex justify-between items-start border-b-4 border-[#002a5c] pb-8">
            <ITCLogo className="w-32 h-16" variant="color" />
            <div className="text-right">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Performance Scorecard</h2>
              <p className="text-xs font-bold text-slate-400">ITC OPERATIONAL INTELLIGENCE UNIT</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-10">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-[#002a5c] px-3 py-1 inline-block rounded">Employee Information</h3>
              <div className="space-y-1">
                <p className="text-2xl font-black">{results.loginInfo?.employeeName}</p>
                <p className="text-sm font-bold text-slate-500">P.NO: {results.loginInfo?.pNo}</p>
                <p className="text-sm font-bold text-slate-500">Dept: {results.loginInfo?.department}</p>
                <p className="text-xs font-bold text-indigo-600 mt-2">Duration: {formatTime(results.timeTakenSeconds)}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Tier Achievement</p>
              <p className="text-3xl font-black text-[#002a5c]">{results.category}</p>
              <div className="mt-2 px-4 py-1 bg-[#002a5c] text-white text-[8px] font-black rounded-full uppercase">Officially Validated</div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4">
            <div className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] text-center">
              <p className="text-[10px] font-black uppercase text-slate-400">Pulse</p>
              <p className="text-4xl font-black">{results.engagementScore.toFixed(1)}</p>
              <p className="text-[9px] font-bold text-emerald-600 uppercase">Engagement</p>
            </div>
            <div className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] text-center">
              <p className="text-[10px] font-black uppercase text-slate-400">Points</p>
              <p className="text-4xl font-black">{results.totalPoints}</p>
              <p className="text-[9px] font-bold text-amber-600 uppercase">Excellence</p>
            </div>
            <div className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] text-center">
              <p className="text-[10px] font-black uppercase text-slate-400">Badges</p>
              <p className="text-4xl font-black">{results.badges.length}</p>
              <p className="text-[9px] font-bold text-indigo-600 uppercase">Awards</p>
            </div>
          </div>

          <div className="mt-10 p-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/20">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Direct Worker Sentiment</h3>
             <p className="p-5 bg-white rounded-xl border border-slate-100 italic text-md text-slate-700">"{results.feedback || 'No feedback provided'}"</p>
             <div className="mt-6 p-5 bg-indigo-50 rounded-xl text-indigo-900 font-bold text-sm leading-relaxed">
               AI Analysis: {aiAnalysis || 'Synthesizing data...'}
             </div>
          </div>

          <div className="mt-auto pt-16 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Digitally Verified Document - ITC Integrated Systems</p>
          </div>
        </div>
      </div>

      {/* MAIN VISIBLE UI SECTION */}
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
                    {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <p className="text-lg opacity-90 italic">"{aiAnalysis}"</p>}
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
                   <p className="text-[10px] font-bold text-indigo-600 uppercase mt-2 tracking-tight">{getTimeFeedback(results.timeTakenSeconds)}</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] shadow-xl border border-slate-50 dark:border-slate-800 h-[380px] flex flex-col">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{language === 'hi' ? 'काम करने का तरीका' : 'Working Style'}</h4>
                {radarData.length > 0 ? (
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                         <PolarGrid stroke="#f1f5f9" /><PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                         <RadarFill dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} strokeWidth={3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 italic">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <p className="text-xs">No Data Available</p>
                  </div>
                )}
             </div>

             <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] shadow-xl border border-slate-50 dark:border-slate-800 h-[380px] flex flex-col">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{language === 'hi' ? 'टीमों की तुलना' : 'Team Comparison'}</h4>
                {globalStats?.benchmarks ? (
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={globalStats.benchmarks}>
                        <XAxis dataKey="name" hide />
                        <Bar dataKey="avg" radius={[10, 10, 10, 10]}>
                          {globalStats.benchmarks.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.isUserDept ? '#6366f1' : '#e2e8f0'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 italic">
                    <Activity className="w-8 h-8 mb-2" />
                    <p className="text-xs">Gathering Team Insights...</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-5 blur-[100px]" />
         <div className="space-y-1 text-center md:text-left relative z-10">
            <h4 className="text-3xl font-black">{language === 'hi' ? 'अपनी उपलब्धियां प्राप्त करें' : 'Download Your Rewards'}</h4>
            <p className="text-slate-400 text-lg">{language === 'hi' ? 'अपना परिणाम और प्रमाण पत्र सुरक्षित रखें।' : 'Secure your official report and excellence certificate.'}</p>
         </div>
         <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <button 
              onClick={() => downloadPDF(certificateRef, `ITC_Excellence_Cert_${results.loginInfo?.pNo}.pdf`, 'landscape', true)} 
              disabled={isGeneratingCert}
              className={`px-10 py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl ${
                isGeneratingCert ? 'bg-slate-800 text-slate-500' : 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95'
              }`}
            >
              {isGeneratingCert ? <Loader2 className="w-6 h-6 animate-spin" /> : <Medal className="w-6 h-6" />}
              {language === 'hi' ? 'प्रमाण पत्र (PDF)' : 'Certificate (PDF)'}
            </button>
            <button 
              onClick={() => downloadPDF(reportRef, `ITC_Performance_Report_${results.loginInfo?.pNo}.pdf`, 'portrait', false)} 
              disabled={isGeneratingReport}
              className={`px-10 py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl ${
                isGeneratingReport ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-950 hover:bg-blue-50 active:scale-95'
              }`}
            >
              {isGeneratingReport ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
              {language === 'hi' ? 'रिपोर्ट (PDF)' : 'Full Report (PDF)'}
            </button>
         </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
