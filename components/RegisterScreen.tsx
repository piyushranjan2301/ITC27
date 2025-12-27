
import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Key, 
  Briefcase, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Hash,
  Building2,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { registerUser } from '../db';
import ITCLogo from './ITCLogo';

interface Props {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

const RegisterScreen: React.FC<Props> = ({ onSuccess, onBackToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; sub?: string } | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [form, setForm] = useState({
    password: '',
    fullName: '',
    pNo: '',
    department: '',
    designation: '',
    role: 'worker',
    phoneNumber: '',
    location: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    
    if (form.fullName.trim().length < 3) errors.fullName = "नाम दर्ज करें (Enter Name)";
    if (!/^\d{1,8}$/.test(form.pNo)) errors.pNo = "P.No दर्ज करें (Enter P.No)";
    if (form.password.length < 4) errors.password = "पिन 4+ अंकों का होना चाहिए (Pin must be 4+ digits)";
    if (!/^\d{10}$/.test(form.phoneNumber)) errors.phoneNumber = "10 अंकों का नंबर दर्ज करें (Enter 10-digit Number)";
    if (!form.location) errors.location = "फैक्ट्री चुनें (Select Factory)";
    if (!form.department) errors.department = "विभाग चुनें (Select Department)";
    if (!form.designation) errors.designation = "पद चुनें (Select Designation)";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await registerUser(form);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => onSuccess(), 1500);
      } else {
        setError({ 
          message: 'Registry Error', 
          sub: result.error || 'This P.NO might already be registered.' 
        });
      }
    } catch (err) {
      setError({ 
        message: 'System Offline', 
        sub: 'Please check your connection.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    if (field === 'pNo') value = value.replace(/\D/g, '');
    setForm(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const resetForm = () => {
    setForm({
      password: '',
      fullName: '',
      pNo: '',
      department: '',
      designation: '',
      role: 'worker',
      phoneNumber: '',
      location: ''
    });
    setValidationErrors({});
    setError(null);
  };

  const DEPARTMENTS = ["PMD", "SMD", "Engineering", "Ambulance", "Canteen", "CTO", "HR", "Supply Chain"];
  const DESIGNATIONS = ["General worker", "Machine man", "Operator", "Technical operator", "Technician", "Fitter", "Electrician", "Clerk", "Supervisor", "Forklift Operator"];

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in zoom-in-95">
        <div className="w-24 h-24 bg-blue-900 rounded-[2rem] flex items-center justify-center shadow-2xl">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">सफल पंजीकरण!</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">ID: {form.pNo}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border-l-[12px] border-blue-900 relative overflow-hidden transition-all ${error ? 'border-rose-500' : ''}`}>
        
        <div className="relative z-10 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ITCLogo className="w-16 h-16" variant="color" />
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">नया पंजीकरण (New Register)</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Operational Registry</p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={resetForm}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-600 transition-all font-black uppercase text-[10px] tracking-widest border border-slate-100 dark:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" /> सब साफ़ करें (Clear Form)
          </button>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex flex-col gap-1 text-rose-800 dark:text-rose-400">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error.message}</span>
            </div>
            {error.sub && <p className="text-[9px] font-bold opacity-70 pl-7">{error.sub}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Hash className="w-3.5 h-3.5 text-blue-900" /> P.NO (8 Digits)
              </label>
              <input 
                className={`w-full px-6 py-5 rounded-2xl border-2 ${validationErrors.pNo ? 'border-rose-300 bg-rose-50' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800'} focus:bg-white dark:focus:bg-slate-700 focus:border-blue-900 dark:text-white font-black transition-all outline-none`}
                placeholder="Ex: 12345678"
                value={form.pNo}
                onChange={(e) => updateForm('pNo', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <User className="w-3.5 h-3.5 text-blue-900" /> पूरा नाम (Full Name)
              </label>
              <input 
                className={`w-full px-6 py-5 rounded-2xl border-2 ${validationErrors.fullName ? 'border-rose-300 bg-rose-50' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800'} focus:bg-white dark:focus:bg-slate-700 focus:border-blue-900 dark:text-white font-black transition-all outline-none`}
                placeholder="Employee Name"
                value={form.fullName}
                onChange={(e) => updateForm('fullName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Building2 className="w-3.5 h-3.5 text-blue-900" /> विभाग (Department)
              </label>
              <select 
                className={`w-full px-6 py-5 rounded-2xl border-2 ${validationErrors.department ? 'border-rose-300 bg-rose-50' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800'} focus:bg-white dark:focus:bg-slate-700 focus:border-blue-900 dark:text-white font-black outline-none cursor-pointer`}
                value={form.department}
                onChange={(e) => updateForm('department', e.target.value)}
              >
                <option value="">-- चुनें (Select Dept) --</option>
                {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-blue-900" /> पद (Designation)
                </div>
                {form.designation && (
                  <button 
                    type="button" 
                    onClick={() => updateForm('designation', '')}
                    className="text-[9px] font-black text-rose-500 hover:text-rose-700 flex items-center gap-1 group/clear"
                  >
                    <XCircle className="w-3 h-3 group-hover:scale-110 transition-transform" /> साफ़ करें (Clear Selection)
                  </button>
                )}
              </label>
              <select 
                className={`w-full px-6 py-5 rounded-2xl border-2 ${validationErrors.designation ? 'border-rose-300 bg-rose-50' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800'} focus:bg-white dark:focus:bg-slate-700 focus:border-blue-900 dark:text-white font-black outline-none cursor-pointer`}
                value={form.designation}
                onChange={(e) => updateForm('designation', e.target.value)}
              >
                <option value="">-- चुनें (Select Job) --</option>
                {DESIGNATIONS.map(des => <option key={des} value={des}>{des}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Phone className="w-3.5 h-3.5 text-blue-900" /> मोबाइल (Mobile)
              </label>
              <input 
                type="tel"
                className={`w-full px-6 py-5 rounded-2xl border-2 ${validationErrors.phoneNumber ? 'border-rose-300 bg-rose-50' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800'} focus:bg-white dark:focus:bg-slate-700 focus:border-blue-900 dark:text-white font-black outline-none`}
                placeholder="10-digit number"
                value={form.phoneNumber}
                onChange={(e) => updateForm('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <MapPin className="w-3.5 h-3.5 text-blue-900" /> फैक्ट्री (Location)
              </label>
              <select 
                className={`w-full px-6 py-5 rounded-2xl border-2 ${validationErrors.location ? 'border-rose-300 bg-rose-50' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800'} focus:bg-white dark:focus:bg-slate-700 focus:border-blue-900 dark:text-white font-black outline-none cursor-pointer`}
                value={form.location}
                onChange={(e) => updateForm('location', e.target.value)}
              >
                <option value="">-- चुनें (Select Factory) --</option>
                <option value="Munger">Munger</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Saharanpur">Saharanpur</option>
                <option value="Pune">Pune</option>
                <option value="Chennai">Chennai</option>
                <option value="Kapurthala">Kapurthala</option>
              </select>
            </div>
          </div>

          <div className="border-t-2 border-slate-50 dark:border-slate-800 pt-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="w-full md:max-w-xs space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Key className="w-3.5 h-3.5 text-blue-900" /> सुरक्षा कोड (Pin)
              </label>
              <input 
                type="password"
                className={`w-full px-6 py-5 rounded-2xl border-2 ${validationErrors.password ? 'border-rose-300 bg-rose-50' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800'} focus:bg-white dark:focus:bg-slate-700 focus:border-blue-900 dark:text-white font-black outline-none tracking-widest`}
                placeholder="••••"
                value={form.password}
                onChange={(e) => updateForm('password', e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-auto px-12 py-6 rounded-[2.5rem] font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 ${
                  loading 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-900 text-white hover:bg-slate-900'
                }`}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>रजिस्टर करें (Submit) <ArrowRight className="w-5 h-5" /></>}
              </button>
              <button 
                type="button"
                onClick={onBackToLogin}
                className="w-full sm:w-auto px-10 py-6 rounded-[2.5rem] font-black text-[10px] text-slate-400 uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                पीछे जाएँ (Back)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterScreen;
