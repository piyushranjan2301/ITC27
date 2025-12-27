
import React, { useState, useEffect } from 'react';
import { SJTQuestion, Language } from '../types';
import { ChevronRight, ChevronLeft, ShieldAlert, TrendingUp, Award, Zap, BrainCircuit, Hash } from 'lucide-react';

interface Props {
  language: Language;
  questions: SJTQuestion[];
  onComplete: (responses: Record<string, 'A' | 'B' | 'C' | 'D'>) => void;
  globalOffset: number;
  phase12Count: number;
}

const SJTScreen: React.FC<Props> = ({ language, questions, onComplete, globalOffset, phase12Count }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [questionPath, setQuestionPath] = useState<string[]>([]);
  const [depthScore, setDepthScore] = useState(0); 

  const TARGET_QUESTION_COUNT = 15;

  useEffect(() => {
    if (questionPath.length === 0) {
      // Pick 10 random Basic questions to start
      const basicPool = questions.filter(q => q.complexity === 'Basic');
      const shuffledBasics = [...basicPool].sort(() => 0.5 - Math.random());
      const initialBasics = shuffledBasics.slice(0, 10).map(q => q.id);
      setQuestionPath(initialBasics);
    }
  }, [questions]);

  if (questionPath.length === 0) return null;

  const currentQuestionId = questionPath[currentIndex];
  const currentQuestion = questions.find(q => q.id === currentQuestionId);

  if (!currentQuestion) return null;

  const progress = ((currentIndex + 1) / TARGET_QUESTION_COUNT) * 100;
  
  const globalSerialNumber = globalOffset + phase12Count + currentIndex + 1;

  const handleSelect = (value: 'A' | 'B' | 'C' | 'D') => {
    setResponses(prev => ({ ...prev, [currentQuestionId]: value }));
  };

  const handleNext = () => {
    const alignment = currentQuestion.options[responses[currentQuestionId]].alignment;
    const isStrongChoice = alignment === 'High Initiative' || alignment === 'Strategic';
    const isWeakChoice = alignment === 'Risk-Averse';
    
    const newDepth = Math.max(0, depthScore + (isStrongChoice ? 1 : isWeakChoice ? -1 : 0));
    setDepthScore(newDepth);

    if (questionPath.length < TARGET_QUESTION_COUNT) {
      const currentIds = new Set(questionPath);
      let nextQId = '';

      if (newDepth >= 2) {
        // Higher performance: inject random Advanced scenario
        const advancedPool = questions.filter(q => q.complexity === 'Advanced' && !currentIds.has(q.id));
        if (advancedPool.length > 0) {
          nextQId = advancedPool[Math.floor(Math.random() * advancedPool.length)].id;
        }
      } 
      
      if (!nextQId) {
        // Normal path: inject random Basic scenario
        const basicPool = questions.filter(q => q.complexity === 'Basic' && !currentIds.has(q.id));
        if (basicPool.length > 0) {
          nextQId = basicPool[Math.floor(Math.random() * basicPool.length)].id;
        }
      }

      if (nextQId) {
        const newPath = [...questionPath];
        newPath.splice(currentIndex + 1, 0, nextQId);
        setQuestionPath(newPath);
      }
    }

    if (currentIndex < questionPath.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(responses);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const isSelected = responses[currentQuestionId] !== undefined;
  const currentComplexity = currentQuestion.complexity;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex justify-between items-center text-[10px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest transition-colors">
            <span className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-amber-600" />
              {language === 'hi' ? 'चरण 3: सिमुलेशन' : 'PHASE 3: 15-STEP SIMULATION'}
            </span>
            <div className="flex items-center gap-3">
              <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors">
                <Hash className="w-3 h-3" />
                Serial #{globalSerialNumber}
              </span>
              <span className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full transition-colors">{currentIndex + 1} / {TARGET_QUESTION_COUNT}</span>
            </div>
          </div>
          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-white/50 dark:border-slate-700 transition-colors">
            <div 
              className={`h-full transition-all duration-1000 ease-out rounded-full shadow-lg ${
                currentComplexity === 'Advanced' ? 'bg-indigo-600' : 'bg-amber-500'
              }`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-50 dark:border-slate-800 relative overflow-hidden group transition-all">
        <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-500 ${
          currentComplexity === 'Advanced' ? 'bg-indigo-600' : 'bg-amber-500'
        }`} />
        
        <div className="space-y-10">
          <div className={`${currentComplexity === 'Advanced' ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30' : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'} p-8 rounded-[2.5rem] border-2 relative transition-all duration-500`}>
            <div className={`absolute -top-4 left-10 px-4 py-1.5 text-white text-[10px] font-black uppercase rounded-xl shadow-lg transform -rotate-1 transition-colors ${
              currentComplexity === 'Advanced' ? 'bg-indigo-600' : 'bg-amber-500'
            }`}>
              {currentComplexity === 'Advanced' ? 'Strategic Insight' : 'Operational Focus'}
            </div>
            <h3 className={`text-2xl font-black leading-snug italic tracking-tight transition-colors ${
              currentComplexity === 'Advanced' ? 'text-indigo-950 dark:text-indigo-200' : 'text-amber-950 dark:text-amber-200'
            }`}>
              "{language === 'hi' ? currentQuestion.scenarioHi : currentQuestion.scenarioEn}"
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {(['A', 'B', 'C', 'D'] as const).map((key) => {
              const option = currentQuestion.options[key];
              const active = responses[currentQuestionId] === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  className={`flex items-start gap-5 p-6 rounded-[2rem] border-2 text-left transition-all duration-300 relative group/opt ${
                    active 
                    ? (currentComplexity === 'Advanced' ? 'bg-indigo-900 border-indigo-900' : 'bg-amber-900 border-amber-900') + ' shadow-2xl scale-[1.01] transform' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`mt-0.5 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-xl text-xs font-black transition-all ${
                    active ? 'bg-white text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {key}
                  </span>
                  <p className={`font-bold text-[15px] leading-tight flex-1 ${active ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    {language === 'hi' ? option.textHi : option.textEn}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-50 dark:border-slate-800 transition-colors">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all ${
              currentIndex === 0 ? 'opacity-0 cursor-default' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            {language === 'hi' ? 'पीछे' : 'Back'}
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isSelected}
            className={`flex items-center gap-4 px-14 py-5 rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.25em] transition-all shadow-2xl ${
              isSelected 
              ? (currentComplexity === 'Advanced' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-amber-600 hover:bg-amber-500') + ' text-white transform active:scale-95' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
          >
            {language === 'hi' ? 'जारी रखें' : 'Continue'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SJTScreen;
