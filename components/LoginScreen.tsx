
import React, { useState } from 'react';
import { LoginInfo } from '../types';
import { LogIn, User, MapPin, Phone } from 'lucide-react';

interface Props {
  onLogin: (info: LoginInfo) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [empName, setEmpName] = useState('');
  const [phone, setPhone] = useState('');
  const [loc, setLoc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (empName && phone && loc) {
      /* Fixed: added missing properties pNo, department, and designation to satisfy LoginInfo interface */
      onLogin({
        employeeName: empName,
        pNo: '',
        department: '',
        designation: '',
        role: 'worker', // Default for this screen
        phoneNumber: phone,
        location: loc,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Worker Portal</h2>
          <p className="text-gray-500 font-medium">Please verify your details to access the assessment hub</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold placeholder:font-normal"
                placeholder="John Doe"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </label>
              <input 
                required
                type="tel"
                pattern="[0-9]{10}"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold placeholder:font-normal"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Location
              </label>
              <select 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold"
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
              >
                <option value="" className="font-normal">Select Factory</option>
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

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-800 transition-all shadow-xl shadow-blue-100 active:scale-[0.98] transform flex items-center justify-center gap-3"
            >
              Access Assessment Hub
              <LogIn className="w-5 h-5" />
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-gray-50 flex items-center gap-3 text-gray-400">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <p className="text-[10px] font-black uppercase tracking-widest">Secure Server Connection Active</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
