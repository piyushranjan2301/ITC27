
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Loader2, BrainCircuit, Sparkles, MessageSquare, Terminal, X, Minimize2, Maximize2, Table, List, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  assessmentData: any[];
  userData: any[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AdminChatbot: React.FC<Props> = ({ assessmentData, userData }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Welcome to the ITC Intelligence Command Center. How can I assist your leadership strategy today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API_KEY_MISSING");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Richer Data Context for the AI
      const deptStats: Record<string, { total: number, count: number, engagement: number }> = {};
      const locStats: Record<string, { total: number, count: number, engagement: number }> = {};
      const catStats: Record<string, number> = {};
      
      assessmentData.forEach(item => {
        const d = item.loginInfo?.department || 'Unknown';
        const l = item.loginInfo?.location || 'Unknown';
        const c = item.category || 'Unknown';
        
        if (!deptStats[d]) deptStats[d] = { total: 0, count: 0, engagement: 0 };
        deptStats[d].total += item.totalPoints || 0;
        deptStats[d].engagement += item.engagementScore || 0;
        deptStats[d].count += 1;

        if (!locStats[l]) locStats[l] = { total: 0, count: 0, engagement: 0 };
        locStats[l].total += item.totalPoints || 0;
        locStats[l].engagement += item.engagementScore || 0;
        locStats[l].count += 1;
        
        catStats[c] = (catStats[c] || 0) + 1;
      });

      const dataSummary = {
        meta: {
          totalUsers: userData.length,
          totalAssessments: assessmentData.length,
          timestamp: new Date().toISOString(),
        },
        averages: {
          engagement: assessmentData.length > 0 
            ? (assessmentData.reduce((acc, curr) => acc + (curr.engagementScore || 0), 0) / assessmentData.length).toFixed(2) 
            : '0',
          points: assessmentData.length > 0
            ? (assessmentData.reduce((acc, curr) => acc + (curr.totalPoints || 0), 0) / assessmentData.length).toFixed(0)
            : '0'
        },
        departments: Object.entries(deptStats).map(([name, s]) => ({
          name,
          avgPoints: (s.total / s.count).toFixed(0),
          avgEngagement: (s.engagement / s.count).toFixed(2),
          count: s.count
        })),
        locations: Object.entries(locStats).map(([name, s]) => ({
          name,
          avgPoints: (s.total / s.count).toFixed(0),
          avgEngagement: (s.engagement / s.count).toFixed(2),
          count: s.count
        })),
        categories: catStats,
        recentActivity: assessmentData.slice(0, 5).map(a => ({
          name: a.loginInfo?.employeeName,
          dept: a.loginInfo?.department,
          loc: a.loginInfo?.location,
          category: a.category,
          score: a.engagementScore
        }))
      };

      const systemInstruction = `
        You are the "ITC Intelligence Command Center" - a high-level executive AI analyst for ITC Factory Operations.
        
        YOUR DATA SOURCE:
        ${JSON.stringify(dataSummary)}
        
        OPERATIONAL GUIDELINES:
        1. ACCURACY: Base all answers strictly on the provided data. If asked about something not in the data, state that clearly.
        2. STRUCTURE: Always provide answers in a highly structured, scannable format.
           - Use Markdown Tables for data comparisons (e.g., department performance).
           - Use Bold Headers for different sections of your analysis.
           - Use Bulleted Lists for recommendations or key findings.
        3. TONE: Professional, authoritative, and strategic. You are speaking to Plant Heads and HR Directors.
        4. INSIGHT: Don't just list numbers. Explain what they MEAN for factory morale and productivity.
        5. PRIVACY: Never reveal specific P.NOs or sensitive personal data unless explicitly relevant to a query about a specific record already in your context.
        
        FORMATTING RULE:
        - If the user asks for a summary, provide a "Executive Summary" table.
        - If the user asks for comparisons, use a "Comparative Analysis" table.
        - Always end with a "Strategic Recommendation" section.
      `;

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemInstruction,
        },
        history: messages.length > 1 ? messages.slice(1).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })) : []
      });

      const result = await chat.sendMessage({ message: userMessage });
      const aiText = result.text || "I was unable to generate a response. Please check the data context.";
      
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (err: any) {
      console.error("Chatbot Deployment Error:", err);
      let errorMsg = "The intelligence system is currently unreachable.";
      
      if (err.message === "API_KEY_MISSING") {
        errorMsg = "API Configuration Error: The system could not find a valid API key for this deployment.";
      } else if (err.message?.includes("429")) {
        errorMsg = "System Overloaded: Too many requests. Please wait a moment.";
      } else {
        errorMsg = "Connection Error: Failed to reach the ITC AI Vault. Ensure your network permits API traffic.";
      }
      
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 transition-colors">
      <div className="bg-slate-900 p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
            <BrainCircuit className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">AI Command Center</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Sync: ONLINE</p>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50 dark:bg-slate-950/20">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`p-6 rounded-[2rem] text-sm shadow-sm border ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-700 rounded-tl-none'
            }`}>
              <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3 p-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
            </div>
            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Processing Data...</span>
          </div>
        )}
      </div>

      <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={handleSend} className="relative">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about factory engagement or leadership strategy..."
            className="w-full pl-8 pr-20 py-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 outline-none transition-all font-bold dark:text-white"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading} 
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-indigo-600 text-white disabled:bg-slate-200 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 transition-all hover:bg-indigo-700 shadow-lg disabled:shadow-none active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminChatbot;
