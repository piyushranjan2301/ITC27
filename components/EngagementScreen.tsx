
import React, { useState, useEffect } from 'react';
import { Question, Language } from '../types';
import { ChevronRight, ChevronLeft, CheckCircle, Zap, ShieldAlert, Activity, Sparkles, Hash } from 'lucide-react';

interface Props {
  language: Language;
  questions: Question[];
  onComplete: (responses: Record<string, number>) => void;
  globalOffset: number;
}

const EngagementScreen: React.FC<Props> = ({ language, questions, onComplete, globalOffset }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [questionPath, setQuestionPath] = useState<string[]>([]);
  const [adaptiveMode, setAdaptiveMode] = useState<'Leadership' | 'Support' | 'Operational' | null>(null);
  const [showInsight, setShowInsight] = useState(false);

  const STANDARD_COUNT = 8;
  const ADAPTIVE_COUNT = 7; 
  const TOTAL_EXPECTED = STANDARD_COUNT + ADAPTIVE_COUNT; // 15

  useEffect(() => {
    if (questionPath.length === 0) {
      // Pick 8 random standard questions from the pool
      const standardPool = questions.filter(q => q.adaptiveTag === 'Standard');
      const shuffled = [...standardPool].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, STANDARD_COUNT).map(q => q.id);
      setQuestionPath(selected);
    }
  }, [questions]);

  if (questionPath.length === 0) return null;

  const currentQuestionId = questionPath[currentIndex];
  const currentQuestion = questions.find(q => q.id === currentQuestionId);

  if (!currentQuestion) return null;

  const totalPossible = TOTAL_EXPECTED;
  const progress = ((currentIndex + 1) / totalPossible) * 100;
  
  const globalSerialNumber = globalOffset + currentIndex + 1;

  const handleSelect = (value: number) => {
    setResponses(prev => ({ ...prev, [currentQuestionId]: value }));
  };

  const handleNext = () => {
    const isEndOfStandard = currentIndex === STANDARD_COUNT - 1;
    
    if (isEndOfStandard && questionPath.length === STANDARD_COUNT) {
      const vals = Object.values(responses) as number[];
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      
      const redFlags = Object.entries(responses).filter(([_, val]) => (val as number) <= 2);
      const highScores = Object.entries(responses).filter(([_, val]) => (val as number) >= 4);

      let mode: 'Leadership' | 'Support' | 'Operational' = 'Operational';
      let tag: 'HighEngagement' | 'LowEngagement' | 'Standard' = 'Standard';

      if (avg >= 3.8 && highScores.length >= 4) {
        mode = 'Leadership';
        tag = 'HighEngagement';
      } else if (redFlags.length >= 3 || avg <= 2.8) {
        mode = 'Support';
        tag = 'LowEngagement';
      }

      setAdaptiveMode(mode);
      setShowInsight(true);
      
      // Select 7 random questions from the adaptive pool
      const adaptivePool = questions
        .filter(q => q.adaptiveTag === tag && !questionPath.includes(q.id));
      const shuffledAdaptive = [...adaptivePool].sort(() => 0.5 - Math.random());
      const selectedAdaptive = shuffledAdaptive.slice(0, ADAPTIVE_COUNT).map(q => q.id);
      
      setQuestionPath([...questionPath, ...selectedAdaptive]);
      setTimeout(() => {
        setShowInsight(false);
        setCurrentIndex(prev => prev + 1);
      }, 2500);
    } else if (currentIndex < questionPath.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(responses);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const isSelected = responses[currentQuestionId] !== undefined;
  const labels = language === 'hi' 
    ? ['बिल्कुल असहमत', 'असहमत', 'तटस्थ', 'सहमत', 'बिल्कुल सहमत']
    : ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

  const emojis = ['😠', '🙁', '😐', '🙂', '🤩'];

  if (showInsight) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center relative transition-colors">
          <Activity className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-8 h-8 text-amber-500 animate-bounce" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'hi' ? 'आपकी आवाज़ सुनी गई!' : 'Your Voice Matters!'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
            {adaptiveMode === 'Leadership' 
              ? (language === 'hi' ? 'उच्च मनोबल - नेतृत्व पथ' : 'High Morale - Leadership Path Detected')
              : adaptiveMode === 'Support'
              ? (language === 'hi' ? 'सुधार क्षेत्र - सहायता पथ' : 'Priority Support - Action Path Detected')
              : (language === 'hi' ? 'स्थिर प्रदर्शन - मानक पथ' : 'Steady Performance - Standard Path')}
          </p>
          <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium">
            {language === 'hi' 
              ? 'हम आपके जवाबों के आधार पर अगले सवालों को समायोजित कर रहे हैं...' 
              : 'Expanding the session with 7 tailored questions for deeper analysis...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[11px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span>{language === 'hi' ? 'चरण 1: जुड़ाव' : 'PHASE 1: ENGAGEMENT'}</span>
            {adaptiveMode && <span className="text-indigo-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Targeted</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors">
              <Hash className="w-3 h-3" />
              Serial #{globalSerialNumber}
            </span>
            <span className="tabular-nums bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md transition-colors">{currentIndex + 1} / {totalPossible}</span>
          </div>
        </div>
        <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner transition-colors">
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-full shadow-lg ${
              adaptiveMode === 'Leadership' ? 'bg-orange-500' : adaptiveMode === 'Support' ? 'bg-rose-500' : 'bg-blue-600'
            }`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 min-h-[480px] flex flex-col relative overflow-hidden group transition-all">
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-bl-[6rem] -mr-16 -mt-16 opacity-10 transition-colors duration-1000 ${
          adaptiveMode === 'Leadership' ? 'bg-orange-500' : adaptiveMode === 'Support' ? 'bg-rose-500' : 'bg-blue-500'
        }`} />
        
        <div className="flex-1 space-y-8 relative z-10">
          <div className="space-y-4">
            <span className={`inline-block px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest border transition-all ${
              adaptiveMode === 'Leadership' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-900/30' :
              adaptiveMode === 'Support' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' :
              'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
            }`}>
              {currentQuestion.dimension} Analysis
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-[1.15] tracking-tight transition-colors">
              {language === 'hi' ? currentQuestion.textHi : currentQuestion.textEn}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {labels.map((label, idx) => {
              const value = idx + 1;
              const active = responses[currentQuestionId] === value;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(value)}
                  className={`flex items-center gap-6 p-5 rounded-3xl border-2 transition-all text-left group/btn ${
                    active 
                    ? 'bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-700 shadow-2xl transform scale-[1.02]' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                  }`}
                >
                  <span className={`text-4xl transition-all duration-300 ${active ? 'scale-110' : 'grayscale group-hover/btn:grayscale-0 opacity-40 group-hover/btn:opacity-100'}`}>
                    {emojis[idx]}
                  </span>
                  <div className="flex-1">
                    <p className={`font-black text-sm uppercase tracking-widest ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-50 dark:border-slate-800 relative z-10 transition-all">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all text-[11px] uppercase tracking-[0.2em] ${
              currentIndex === 0 ? 'opacity-0' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            {language === 'hi' ? 'पीछे' : 'Previous'}
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isSelected}
            className={`flex items-center gap-3 px-12 py-5 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] transition-all shadow-2xl ${
              isSelected 
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-200 transform active:scale-95' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
          >
            {language === 'hi' ? 'अगला' : 'Continue'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EngagementScreen;
