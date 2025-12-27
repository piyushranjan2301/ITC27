
import React, { useState } from 'react';
import { Language } from '../types';
import { MessageSquare, ChevronDown, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  language: Language;
  onComplete: (feedback: string) => void;
}

const FEEDBACK_OPTIONS = [
  { en: "Excellent work environment", hi: "काम का माहौल बहुत अच्छा है" },
  { en: "Need better tools and machinery", hi: "बेहतर उपकरणों और मशीनरी की जरूरत है" },
  { en: "Very happy with the team support", hi: "टीम के सहयोग से बहुत खुश हूँ" },
  { en: "Safety standards need improvement", hi: "सुरक्षा मानकों में सुधार की आवश्यकता है" },
  { en: "Canteen and facilities are good", hi: "कैंटीन और सुविधाएं अच्छी हैं" },
  { en: "Need more training programs", hi: "अधिक प्रशिक्षण कार्यक्रमों की आवश्यकता है" },
  { en: "Fair treatment by supervisors", hi: "सुपरवाइजर द्वारा निष्पक्ष व्यवहार" },
  { en: "Work-life balance is satisfactory", hi: "कार्य-जीवन संतुलन संतोषजनक है" }
];

const FeedbackScreen: React.FC<Props> = ({ language, onComplete }) => {
  const [selected, setSelected] = useState('');

  const handleSubmit = () => {
    if (selected) onComplete(selected);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800 transition-colors">
          <MessageSquare className="w-4 h-4" />
          {language === 'hi' ? 'आपकी प्रतिक्रिया' : 'Your Feedback'}
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
          {language === 'hi' ? 'अपना सुझाव चुनें' : 'Select Your Feedback'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          {language === 'hi' 
            ? 'नीचे दिए गए विकल्पों में से अपनी पसंद चुनें।' 
            : 'Choose the most relevant option from the list below.'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            {language === 'hi' ? 'विकल्प चुनें (Select Option)' : 'Feedback Category'}
          </label>
          <div className="relative group">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-5 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="">-- {language === 'hi' ? 'यहाँ चुनें' : 'Select here'} --</option>
              {FEEDBACK_OPTIONS.map((opt, idx) => (
                <option key={idx} value={opt.en}>
                  {language === 'hi' ? opt.hi : opt.en}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
          </div>
        </div>

        {selected && (
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
            <div className="bg-emerald-500 p-2 rounded-lg text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-emerald-800 dark:text-emerald-400 font-bold">
              {language === 'hi' ? 'सही विकल्प चुना गया!' : 'Selection Confirmed!'}
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selected}
          className={`w-full py-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95 ${
            selected 
              ? 'bg-blue-900 text-white hover:bg-blue-800' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
          }`}
        >
          {language === 'hi' ? 'प्रतिक्रिया जमा करें' : 'Submit Feedback'}
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">Anonymous Submission System</p>
      </div>
    </div>
  );
};

export default FeedbackScreen;
