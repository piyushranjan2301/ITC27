
import React from 'react';
import { Language } from '../types';
import { Sparkles, ArrowRight, Target, Award, Rocket } from 'lucide-react';

interface Props {
  language: Language;
  onComplete: () => void;
}

const GrowthScreen: React.FC<Props> = ({ language, onComplete }) => {
  const cards = [
    {
      icon: <Target className="w-8 h-8 text-indigo-500" />,
      titleHi: 'कौशल विकास',
      titleEn: 'Skill Enhancement',
      descHi: 'नई तकनीकों को सीखने और अपनी कार्यक्षमता बढ़ाने के लिए विशेष पाठ्यक्रम।',
      descEn: 'Specialized courses to learn new technologies and increase your efficiency.'
    },
    {
      icon: <Award className="w-8 h-8 text-amber-500" />,
      titleHi: 'प्रमाणन',
      titleEn: 'Certifications',
      descHi: 'अपनी विशेषज्ञता साबित करने के लिए उद्योग-मान्यता प्राप्त प्रमाण पत्र प्राप्त करें।',
      descEn: 'Get industry-recognized certificates to prove your expertise.'
    },
    {
      icon: <Rocket className="w-8 h-8 text-blue-500" />,
      titleHi: 'कैरियर पथ',
      titleEn: 'Career Roadmap',
      descHi: 'एक ऑपरेटर से एक पर्यवेक्षक या विशेषज्ञ बनने तक का आपका मार्ग।',
      descEn: 'Your path from an operator to a supervisor or specialist.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100 transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
          {language === 'hi' ? 'चरण 5: भविष्य का पथ' : 'PHASE 5: FUTURE PATHWAY'}
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight transition-colors">
          {language === 'hi' ? 'आपकी विकास यात्रा' : 'Your Growth Journey'}
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto font-medium transition-colors">
          {language === 'hi' 
            ? 'आपके प्रदर्शन के आधार पर, यहाँ कुछ मार्ग दिए गए हैं जो आपको ITC में आगे बढ़ने में मदद कर सकते हैं।' 
            : 'Based on your performance, here are some pathways that can help you grow within ITC.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6 hover:translate-y-[-8px] transition-all duration-300">
            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-100 transition-colors">
              {card.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 transition-colors">
                {language === 'hi' ? card.titleHi : card.titleEn}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium transition-colors">
                {language === 'hi' ? card.descHi : card.descEn}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl transition-all">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full -mr-32 -mt-32 opacity-20 blur-3xl transition-colors"></div>
        <div className="space-y-3 relative z-10 text-center md:text-left">
          <h3 className="text-2xl font-bold">
            {language === 'hi' ? 'मूल्यांकन पूर्ण करने के लिए तैयार?' : 'Ready to see your final profile?'}
          </h3>
          <p className="text-blue-200 font-medium transition-colors">
            {language === 'hi' ? 'अपना व्यक्तिगत रिपोर्ट कार्ड देखने के लिए जारी रखें।' : 'Continue to view your personalized report card.'}
          </p>
        </div>
        <button 
          onClick={onComplete}
          className="group flex items-center gap-3 bg-white text-blue-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-xl active:scale-95"
        >
          {language === 'hi' ? 'निष्कर्ष देखें' : 'View Results'}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default GrowthScreen;
