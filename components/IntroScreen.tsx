
import React from 'react';
import { Language } from '../types';
// Fixed: Added missing 'Activity' icon import
import { Languages, Play, AlertCircle, ShieldCheck, History, Activity } from 'lucide-react';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onStart: () => void;
}

const IntroScreen: React.FC<Props> = ({ language, onLanguageChange, onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-12 py-12">
      <div className="space-y-4">
        <h2 className="text-4xl font-extrabold text-blue-900 dark:text-blue-400 leading-tight">
          {language === 'hi' ? 'जुड़ाव सर्वेक्षण' : 'Engagement Survey'}
        </h2>
        <p className="text-lg text-gray-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
          {language === 'hi' 
            ? 'आपका स्वागत है। इस सर्वेक्षण का उद्देश्य आपके कार्य अनुभव को समझना और कार्यस्थल को बेहतर बनाना है।' 
            : 'Welcome. The purpose of this survey is to understand your work experience and make the workplace better.'}
        </p>
      </div>

      {/* Single Attempt Policy Banner */}
      <div className="max-w-xl w-full bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800/30 p-6 rounded-[2rem] flex items-center gap-5 text-left animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-amber-900 dark:text-amber-400 font-black uppercase text-[10px] tracking-widest mb-1">
            {language === 'hi' ? 'एकल प्रयास नीति' : 'Single Attempt Policy'}
          </h4>
          <p className="text-amber-800 dark:text-amber-400/80 text-sm font-bold leading-tight">
            {language === 'hi' 
              ? 'आप इस मूल्यांकन का केवल एक बार प्रयास कर सकते हैं। जमा करने के बाद, आपका खाता बंद कर दिया जाएगा।' 
              : 'You can attempt this assessment only once. After submission, your account will be locked.'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-md space-y-8 transition-all">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.3em] px-2">
            <Languages className="w-4 h-4" />
            {language === 'hi' ? 'अपनी भाषा चुनें' : 'Select your language'}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onLanguageChange('hi')}
              className={`py-4 px-6 rounded-2xl font-black border-2 transition-all ${
                language === 'hi' 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-600 dark:text-blue-400 shadow-inner' 
                : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:border-blue-200 hover:text-blue-400'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`py-4 px-6 rounded-2xl font-black border-2 transition-all ${
                language === 'en' 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-600 dark:text-blue-400 shadow-inner' 
                : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:border-blue-200 hover:text-blue-400'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full bg-blue-600 text-white py-5 px-8 rounded-2xl font-black text-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-all shadow-xl shadow-blue-200 dark:shadow-none flex items-center justify-center gap-3 group transform active:scale-95"
        >
          {language === 'hi' ? 'शुरू करें' : 'Get Started'}
          <Play className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        {[
          { icon: <History className="w-6 h-6 text-indigo-500" />, title: language === 'hi' ? '15 सवाल प्रति चरण' : '15 Steps per Phase', desc: language === 'hi' ? 'कुल 45 रैंडम सवाल' : '45 Unique Scenarios Total' },
          { icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />, title: language === 'hi' ? 'सुरक्षित' : 'Confidential', desc: language === 'hi' ? 'ID के साथ केवल एक प्रयास' : 'Locked with P.No Verification' },
          { icon: <Activity className="w-6 h-6 text-blue-500" />, title: language === 'hi' ? 'अनुकूली (Adaptive)' : 'Tailored Engine', desc: language === 'hi' ? 'जवाबों के आधार पर बदलाव' : 'Scales to your expertise' }
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-lg transition-all hover:-translate-y-2">
            <div className="mb-4 bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center">{item.icon}</div>
            <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-tight">{item.title}</h3>
            <p className="text-xs font-medium text-slate-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntroScreen;
