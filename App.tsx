
import React, { useState, useEffect } from 'react';
import { Phase, Language, AssessmentState, ScoringResult, LoginInfo } from './types';
import { 
  ENGAGEMENT_QUESTIONS, 
  BEHAVIORAL_QUESTIONS, 
  SJT_QUESTIONS 
} from './constants';
import AuthScreen from './components/AuthScreen';
import IntroScreen from './components/IntroScreen';
import EngagementScreen from './components/EngagementScreen';
import BehavioralScreen from './components/BehavioralScreen';
import SJTScreen from './components/SJTScreen';
import ScoringMappingScreen from './components/ScoringMappingScreen';
import GrowthScreen from './components/GrowthScreen';
import InstitutionalizationScreen from './components/InstitutionalizationScreen';
import FeedbackScreen from './components/FeedbackScreen';
import ResultsScreen from './components/ResultsScreen';
import AdminDashboard from './components/AdminDashboard';
import ITCLogo from './components/ITCLogo';
import { LogOut, Loader2, Moon, Sun } from 'lucide-react';
import { saveAssessmentResult, fetchResultByPNo, getTotalAnsweredQuestionsCount } from './db';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [finalResults, setFinalResults] = useState<ScoringResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [globalQuestionOffset, setGlobalQuestionOffset] = useState(0);
  const [assessmentStartTime, setAssessmentStartTime] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('itc_theme');
    return saved === 'dark';
  });

  const [state, setState] = useState<AssessmentState>({
    language: 'hi',
    currentPhase: Phase.Login,
    loginInfo: null,
    currentQuestionIndex: 0,
    questionPath: [],
    engagementResponses: {},
    behavioralResponses: {},
    sjtResponses: {}
  });

  useEffect(() => {
    localStorage.setItem('itc_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const setLanguage = (lang: Language) => setState(prev => ({ ...prev, language: lang }));
  
  const handleAuthSuccess = async (user: any) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setState(prev => ({ ...prev, currentPhase: Phase.Admin }));
    } else {
      setIsSyncing(true);
      try {
        const existingResult = await fetchResultByPNo(user.employee_id_pno);
        const info: LoginInfo = {
          employeeName: user.full_name,
          pNo: user.employee_id_pno || 'N/A',
          department: user.department || 'General',
          designation: user.designation || 'Staff',
          role: user.role || 'worker',
          phoneNumber: user.phone_number || '',
          location: user.location || 'Unknown',
          timestamp: new Date().toISOString()
        };

        if (existingResult) {
          setFinalResults(existingResult);
          setState(prev => ({ ...prev, loginInfo: info, currentPhase: Phase.Results }));
        } else {
          setState(prev => ({ ...prev, loginInfo: info, currentPhase: Phase.Intro }));
        }
      } catch (err) {
        console.error("Auth Data Sync Error:", err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setFinalResults(null);
    setGlobalQuestionOffset(0);
    setAssessmentStartTime(null);
    setState({
      language: 'hi',
      currentPhase: Phase.Login,
      loginInfo: null,
      currentQuestionIndex: 0,
      questionPath: [],
      engagementResponses: {},
      behavioralResponses: {},
      sjtResponses: {}
    });
  };

  const startAssessment = async () => {
    setIsSyncing(true);
    try {
      const count = await getTotalAnsweredQuestionsCount();
      setGlobalQuestionOffset(count);
      setAssessmentStartTime(Date.now());
      setState(prev => ({ 
        ...prev, 
        currentPhase: Phase.Engagement, 
        questionPath: [ENGAGEMENT_QUESTIONS[0].id] 
      }));
    } catch (err) {
      console.error("Start Assessment Error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEngagementSubmit = (responses: Record<string, number>) => {
    setState(prev => ({
      ...prev,
      engagementResponses: responses,
      currentPhase: Phase.Behavioral,
      questionPath: [BEHAVIORAL_QUESTIONS[0].id]
    }));
  };

  const handleBehavioralSubmit = (responses: Record<string, 'A' | 'B'>) => {
    setState(prev => ({
      ...prev,
      behavioralResponses: responses,
      currentPhase: Phase.SJT,
      questionPath: [SJT_QUESTIONS[0].id]
    }));
  };

  const handleSJTSubmit = (responses: Record<string, 'A' | 'B' | 'C' | 'D'>) => {
    setState(prev => ({
      ...prev,
      sjtResponses: responses,
      currentPhase: Phase.ScoringMapping
    }));
  };

  const handleScoringComplete = () => setState(prev => ({ ...prev, currentPhase: Phase.Growth }));
  const handleGrowthComplete = () => setState(prev => ({ ...prev, currentPhase: Phase.Institutionalization }));
  const handleInstComplete = () => setState(prev => ({ ...prev, currentPhase: Phase.Feedback }));

  const handleFeedbackComplete = async (feedback: string) => {
    setIsSyncing(true);
    try {
      const assessmentDurationSeconds = assessmentStartTime ? Math.floor((Date.now() - assessmentStartTime) / 1000) : 0;
      
      const eValues = Object.values(state.engagementResponses) as number[];
      const avgE = eValues.length > 0 ? eValues.reduce((a, b) => a + b, 0) / eValues.length : 0;
      const eLevel: 'High' | 'Moderate' | 'Low' = avgE >= 4.0 ? 'High' : avgE >= 3.0 ? 'Moderate' : 'Low';

      const bProfile: Record<string, number> = {};
      Object.entries(state.behavioralResponses).forEach(([qid, choice]) => {
        const q = BEHAVIORAL_QUESTIONS.find(bq => bq.id === qid);
        if (q) {
          const trait = q.options[choice as 'A' | 'B'].trait;
          bProfile[trait] = (bProfile[trait] || 0) + 1;
        }
      });

      const sjtAlignment: Record<string, number> = {};
      Object.entries(state.sjtResponses).forEach(([qid, choice]) => {
        const q = SJT_QUESTIONS.find(sq => sq.id === qid);
        if (q) {
          const align = q.options[choice as 'A' | 'B' | 'C' | 'D'].alignment;
          sjtAlignment[align] = (sjtAlignment[align] || 0) + 1;
        }
      });

      let totalPoints = Math.round(avgE * 250);
      const badges: string[] = ["Certified Participant"];
      
      if (avgE >= 4.5) badges.push("Engagement Star");
      if (sjtAlignment["Strategic"] > 3) badges.push("Strategic Thinker");
      if (bProfile["Guardian"] > 4) badges.push("Safety Shield");
      if (bProfile["Harmonizer"] > 4) badges.push("Team Catalyst");
      if (avgE >= 4.0) totalPoints += 200;

      // Time-Based Scoring Dependency
      // Ideal range: 3m (180s) to 8m (480s)
      if (assessmentDurationSeconds < 120) {
         totalPoints -= 150; // Penalty for rushing
      } else if (assessmentDurationSeconds >= 180 && assessmentDurationSeconds <= 600) {
         totalPoints += 250; // Optimal Bonus
      } else if (assessmentDurationSeconds > 600) {
         totalPoints += 100; // Diligence Bonus
      }

      let category = 'Skilled Operator';
      const dominantTraits = Object.entries(bProfile).sort((a, b) => b[1] - a[1]);
      const topTrait = dominantTraits[0]?.[0];
      if (avgE >= 4.0 && (topTrait === 'Executor' || topTrait === 'Informer')) category = 'Leadership Pool';
      else if (avgE >= 3.5 && topTrait === 'Harmonizer') category = 'Mentor Candidate';
      else if (avgE < 2.5) category = 'Needs Support';

      const results: ScoringResult = {
        employeeId: currentUser?.id,
        engagementScore: avgE,
        engagementLevel: eLevel,
        behavioralProfile: bProfile,
        sjtAlignment: sjtAlignment,
        category,
        loginInfo: state.loginInfo!,
        totalPoints: Math.max(0, totalPoints),
        badges,
        engagementResponses: state.engagementResponses,
        behavioralResponses: state.behavioralResponses,
        sjtResponses: state.sjtResponses,
        feedback: feedback,
        timeTakenSeconds: assessmentDurationSeconds
      };

      const dbSave = await saveAssessmentResult(results);
      if (dbSave.success) {
        setFinalResults(results);
      } else {
        const existing = await fetchResultByPNo(state.loginInfo!.pNo);
        if (existing) setFinalResults(existing);
      }
      
      setState(prev => ({ ...prev, currentPhase: Phase.Results }));
    } catch (err) {
      console.error("Finalization Error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const renderContent = () => {
    if (isSyncing) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-6 animate-pulse">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ITCLogo className="w-10 h-10" />
            </div>
          </div>
          <p className="text-blue-900 dark:text-blue-400 font-black uppercase tracking-widest text-[10px]">Accessing Secure Vault...</p>
        </div>
      );
    }

    switch (state.currentPhase) {
      case Phase.Login:
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
      case Phase.Intro:
        return <IntroScreen language={state.language} onLanguageChange={setLanguage} onStart={startAssessment} />;
      case Phase.Engagement:
        return <EngagementScreen language={state.language} questions={ENGAGEMENT_QUESTIONS} onComplete={handleEngagementSubmit} globalOffset={globalQuestionOffset} />;
      case Phase.Behavioral:
        return <BehavioralScreen language={state.language} questions={BEHAVIORAL_QUESTIONS} onComplete={handleBehavioralSubmit} globalOffset={globalQuestionOffset} phase1Count={Object.keys(state.engagementResponses).length} />;
      case Phase.SJT:
        return <SJTScreen language={state.language} questions={SJT_QUESTIONS} onComplete={handleSJTSubmit} globalOffset={globalQuestionOffset} phase12Count={Object.keys(state.engagementResponses).length + Object.keys(state.behavioralResponses).length} />;
      case Phase.ScoringMapping:
        return <ScoringMappingScreen language={state.language} onComplete={handleScoringComplete} />;
      case Phase.Growth:
        return <GrowthScreen language={state.language} onComplete={handleGrowthComplete} />;
      case Phase.Institutionalization:
        return <InstitutionalizationScreen language={state.language} onComplete={handleInstComplete} />;
      case Phase.Feedback:
        return <FeedbackScreen language={state.language} onComplete={handleFeedbackComplete} />;
      case Phase.Results:
        return finalResults && <ResultsScreen language={state.language} results={finalResults} responses={state} />;
      case Phase.Admin:
        return <AdminDashboard onBack={logout} currentUser={currentUser} />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`${state.currentPhase === Phase.Admin ? 'bg-slate-900' : 'bg-blue-900'} text-white shadow-xl sticky top-0 z-50 transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="bg-white px-4 py-2 rounded-xl flex items-center justify-center shadow-inner transition-transform hover:scale-105">
              <ITCLogo className="w-24 h-14" variant="color" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-black leading-none tracking-tighter uppercase mb-1">ITC</h1>
              <p className={`text-[9px] uppercase tracking-[0.3em] font-black opacity-70 ${state.currentPhase === Phase.Admin ? 'text-indigo-400' : 'text-blue-300'}`}>
                {state.currentPhase === Phase.Admin ? 'Strategic Intelligence Dashboard' : 'engagement survey'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-black/20 border border-white/10 hover:bg-black/30 transition-all"
                aria-label="Toggle Night Mode"
             >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-200" />}
             </button>

             <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${state.language === 'en' ? 'bg-white text-blue-900 shadow-md' : 'text-white/60 hover:text-white'}`}>EN</button>
                <button onClick={() => setLanguage('hi')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${state.language === 'hi' ? 'bg-white text-blue-900 shadow-md' : 'text-white/60 hover:text-white'}`}>HI</button>
             </div>
             {currentUser && (
               <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end px-4 border-r border-white/10">
                     <span className="text-xs font-black text-white">{currentUser.full_name}</span>
                     <span className={`text-[9px] font-black uppercase tracking-widest ${state.currentPhase === Phase.Admin ? 'text-indigo-400' : 'text-blue-300'}`}>{currentUser.employee_id_pno}</span>
                  </div>
                  <button onClick={logout} className={`p-3 rounded-xl transition-all border shadow-lg ${state.currentPhase === Phase.Admin ? 'bg-slate-800 border-slate-700 hover:bg-rose-600' : 'bg-blue-800 border-blue-700 hover:bg-rose-600'}`}>
                    <LogOut className="w-5 h-5" />
                  </button>
               </div>
             )}
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">{renderContent()}</main>
      <footer className="py-12 text-center text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-slate-400 transition-colors">
        <p>&copy; 2024 ITC Limited - Operational Excellence Intelligence</p>
      </footer>
    </div>
  );
};

export default App;
