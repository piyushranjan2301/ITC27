
import React from 'react';
import { Language } from '../types';
import { Flag, CheckCircle, Circle, ArrowRight, ShieldAlert, Users } from 'lucide-react';

interface Props {
  language: Language;
  onComplete: () => void;
}

const InstitutionalizationScreen: React.FC<Props> = ({ language, onComplete }) => {
  const steps = [
    {
      titleEn: 'Torchbearer Training',
      titleHi: 'टॉर्चबियरर प्रशिक्षण',
      status: 'Completed',
      descEn: 'ITI Apprentices trained to lead data capture across shifts.',
      descHi: 'डेटा कैप्चर का नेतृत्व करने के लिए आईटीआई प्रशिक्षुओं को प्रशिक्षित किया गया।'
    },
    {
      titleEn: 'Shift Pilot Rollout',
      titleHi: 'शिफ्ट पायलट रोलआउट',
      status: 'Current',
      descEn: 'Testing automated manpower allocation in Munger unit.',
      descHi: 'मुंगेर यूनिट में स्वचालित जनशक्ति आवंटन का परीक्षण।'
    },
    {
      titleEn: 'Factory Integration',
      titleHi: 'फैक्ट्री एकीकरण',
      status: 'Pending',
      descEn: 'Full deployment across all five ITC factory clusters.',
      descHi: 'सभी पांच आईटीसी फैक्ट्री क्लस्टरों में पूर्ण तैनाती।'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 transition-colors">
          <Flag className="w-3 h-3" />
          {language === 'hi' ? 'चरण 5: संस्थागतकरण' : 'PHASE 5: INSTITUTIONALIZATION'}
        </div>
        <h2 className="text-3xl font-black text-slate-900 transition-colors">
          {language === 'hi' ? 'हम इसे कैसे लागू करते हैं' : 'Our Implementation Roadmap'}
        </h2>
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {steps.map((step, idx) => (
          <div key={idx} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 group-[.is-active]:bg-indigo-500 text-slate-500 group-[.is-active]:text-indigo-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-all duration-500">
              {step.status === 'Completed' ? <CheckCircle className="w-5 h-5" /> : step.status === 'Current' ? <Circle className="w-5 h-5 animate-pulse" /> : <Circle className="w-5 h-5 opacity-30" />}
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <div className="font-black text-slate-900">{language === 'hi' ? step.titleHi : step.titleEn}</div>
                <time className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${step.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{step.status}</time>
              </div>
              <div className="text-slate-500 text-xs font-medium">{language === 'hi' ? step.descHi : step.descEn}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-start gap-4 transition-colors">
          <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-red-900">{language === 'hi' ? 'जोखिम न्यूनीकरण' : 'Risk Mitigation'}</h4>
            <p className="text-xs text-red-700 leading-relaxed transition-colors">
              {language === 'hi' 
                ? 'हम डेटा सुरक्षा सुनिश्चित करते हैं और पारदर्शिता बनाए रखने के लिए टॉर्चबियरर्स का उपयोग करते हैं।' 
                : 'We ensure data security and use Torchbearers to maintain transparency and optics sensitivity.'}
            </p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4 transition-colors">
          <Users className="w-8 h-8 text-blue-500 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-blue-900">{language === 'hi' ? 'पुल रणनीति' : 'Pull Strategy'}</h4>
            <p className="text-xs text-blue-700 leading-relaxed transition-colors">
              {language === 'hi' 
                ? 'यह अनिवार्य नहीं है - टीजीडब्ल्यू स्वयं सक्रिय भाग लेते हैं।' 
                : 'Not a mandate - TGWs participate voluntarily through our gamified pull strategy.'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button 
          onClick={onComplete}
          className="group flex items-center gap-3 bg-blue-900 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl hover:bg-blue-800 transition-all active:scale-95"
        >
          {language === 'hi' ? 'निष्कर्ष और सारांश' : 'Final Summary & Rewards'}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default InstitutionalizationScreen;
