
import React from 'react';
import { Language } from '../types';
import { Network, ArrowRight, UserCheck, ShieldCheck, Zap, MessageSquare } from 'lucide-react';

interface Props {
  language: Language;
  onComplete: () => void;
}

const ScoringMappingScreen: React.FC<Props> = ({ language, onComplete }) => {
  const mappings = [
    {
      trait: 'Executor',
      icon: <Zap className="w-6 h-6 text-orange-500" />,
      color: 'bg-orange-50',
      border: 'border-orange-100',
      roleEn: 'High-Volume Production',
      roleHi: 'उच्च-मात्रा उत्पादन',
      descEn: 'Best for repetitive, high-speed packing and loading roles.',
      descHi: 'दोहरावदार, उच्च गति पैकिंग और लोडिंग भूमिकाओं के लिए सर्वश्रेष्ठ।'
    },
    {
      trait: 'Guardian',
      icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
      color: 'bg-blue-50',
      border: 'border-blue-100',
      roleEn: 'Quality & Maintenance',
      roleHi: 'गुणवत्ता और रखरखाव',
      descEn: 'Ideal for quality checks and precision machine operation.',
      descHi: 'गुणवत्ता जांच और सटीक मशीन संचालन के लिए आदर्श।'
    },
    {
      trait: 'Harmonizer',
      icon: <UserCheck className="w-6 h-6 text-green-500" />,
      color: 'bg-green-50',
      border: 'border-green-100',
      roleEn: 'Team Leads & Mentors',
      roleHi: 'टीम लीड और मेंटर',
      descEn: 'Suited for onboarding new TGWs and maintaining safety culture.',
      descHi: 'नए टीजीडब्ल्यू को शामिल करने और सुरक्षा संस्कृति बनाए रखने के लिए उपयुक्त।'
    },
    {
      trait: 'Informer',
      icon: <MessageSquare className="w-6 h-6 text-purple-500" />,
      color: 'bg-purple-50',
      border: 'border-purple-100',
      roleEn: 'Planning & Log Support',
      roleHi: 'योजना और लॉग समर्थन',
      descEn: 'Best for inventory management and supervisor communication.',
      descHi: 'इन्वेंट्री प्रबंधन और पर्यवेक्षक संचार के लिए सर्वश्रेष्ठ।'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 transition-colors">
          <Network className="w-3 h-3" />
          {language === 'hi' ? 'चरण 4: व्यवहार मानचित्रण' : 'PHASE 4: BEHAVIORAL MAPPING'}
        </div>
        <h2 className="text-3xl font-black text-slate-900 leading-tight transition-colors">
          {language === 'hi' ? 'हम आपकी प्रतिभा का उपयोग कैसे करते हैं' : 'How We Map Your Talent'}
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto font-medium text-sm transition-colors">
          {language === 'hi' 
            ? 'ITC आपकी प्राकृतिक शैली के आधार पर कार्य आवंटित करता है ताकि आप सफल हो सकें।' 
            : 'ITC allocates tasks based on your natural style so you can succeed.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {mappings.map((m, idx) => (
          <div key={idx} className={`${m.color} ${m.border} border p-6 rounded-3xl space-y-4 hover:shadow-lg transition-all`}>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-inherit transition-colors">
                {m.icon}
              </div>
              <h4 className="font-black text-slate-900 uppercase tracking-tighter transition-colors">{m.trait}</h4>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-800 transition-colors">
                {language === 'hi' ? m.roleHi : m.roleEn}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed transition-colors">
                {language === 'hi' ? m.descHi : m.descEn}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 flex justify-center">
        <button 
          onClick={onComplete}
          className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95"
        >
          {language === 'hi' ? 'अगले चरण पर जाएँ' : 'Move to Implementation Phase'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ScoringMappingScreen;
