
import React, { useState, useEffect } from 'react';
import { ForcedChoiceQuestion, Language } from '../types';
import { ChevronRight, ChevronLeft, Target, Hash } from 'lucide-react';

interface Props {
  language: Language;
  questions: ForcedChoiceQuestion[];
  onComplete: (responses: Record<string, 'A' | 'B'>) => void;
  globalOffset: number;
  phase1Count: number;
}

const BehavioralScreen: React.FC<Props> = ({ language, questions, onComplete, globalOffset, phase1Count }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, 'A' | 'B'>>({});
  const [questionPath, setQuestionPath] = useState<string[]>([]);

  useEffect(() => {
    if (questionPath.length === 0) {
      // Shuffle the questions for randomization
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      setQuestionPath(shuffled.map(q => q.id));
    }
  }, [questions]);

  if (questionPath.length === 0) return null;

  const currentQuestionId = questionPath[currentIndex];
  const currentQuestion = questions.find(q => q.id === currentQuestionId);

  if (!currentQuestion) return null;

  const progress = ((currentIndex + 1) / questionPath.length) * 100;
  
  const globalSerialNumber = globalOffset + phase1Count + currentIndex + 1;

  const handleSelect = (value: 'A' | 'B') => {
    setResponses(prev => ({ ...prev, [currentQuestionId]: value }));
  };

  const handleNext = () => {
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

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest transition-all">
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            {language === 'hi' ? 'चरण 2: व्यवहार' : 'PHASE 2: BEHAVIOR'}
          </span>
          <div className="flex items-center gap-3">
            <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors">
              <Hash className="w-3 h-3" />
              Serial #{globalSerialNumber}
            </span>
            <span>{currentIndex + 1} / {questionPath.length}</span>
          </div>
        </div>
        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden transition-all">
          <div 
            className="h-full bg-indigo-600 transition-all duration-700 ease-out rounded-full" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-all">
        <div className="space-y-10">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full inline-block transition-all">
              {language === 'hi' ? 'प्राकृतिक शैली चुनें' : 'Choose your natural style'}
            </p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white leading-snug transition-all">
              {language === 'hi' ? currentQuestion.scenarioHi : currentQuestion.scenarioEn}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(['A', 'B'] as const).map((key) => {
              const option = currentQuestion.options[key];
              const active = responses[currentQuestionId] === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-all group ${
                    active 
                    ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 dark:shadow-none' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${
                      active ? 'bg-white text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-600'
                    }`}>
                      {key}
                    </span>
                    <p className={`text-md font-bold ${active ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                      {language === 'hi' ? option.textHi : option.textEn}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-100 dark:border-slate-800 transition-all">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`px-6 py-3 font-bold transition-all ${
              currentIndex === 0 ? 'opacity-0' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'hi' ? 'पीछे' : 'Previous'}
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isSelected}
            className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black transition-all shadow-lg ${
              isSelected 
              ? 'bg-indigo-900 dark:bg-indigo-700 text-white hover:bg-indigo-800 dark:hover:bg-indigo-600' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
            }`}
          >
            {language === 'hi' ? 'अगला' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BehavioralScreen;
