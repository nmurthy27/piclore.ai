import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Wand2, Camera, Clapperboard, Coins, User as UserIcon, Smartphone } from 'lucide-react';
import { User } from '../types';

interface InputStepProps {
  onNext: (celeb: string, phone: string, style: string, context: string) => void;
  isProcessing: boolean;
  user: User | null;
  credits: number;
  isSubscribed: boolean;
}

export const InputStep: React.FC<InputStepProps> = ({ onNext, isProcessing, user, credits, isSubscribed }) => {
  const [celeb, setCeleb] = useState('');
  const [style, setStyle] = useState('Default');
  const [context, setContext] = useState('');
  const [detectedLabel, setDetectedLabel] = useState('Detecting device...');

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) setDetectedLabel('iPhone detected');
    else if (/iPad/i.test(ua)) setDetectedLabel('iPad detected');
    else if (/Android/i.test(ua)) setDetectedLabel('Android Device detected');
    else setDetectedLabel('Standard Mode (iPhone 15 Pro Layout)');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (celeb.trim()) {
      // If mobile, pass the full UA string for Gemini to parse. 
      // If desktop/other, pass a high-quality default.
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const phoneIdentifier = isMobile ? navigator.userAgent : "iPhone 15 Pro";
      
      onNext(celeb, phoneIdentifier, style, context);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 animate-fade-in relative">
      
      {/* User Badge */}
      <div className="absolute -top-12 left-0 right-0 flex justify-between items-center px-2 mb-4">
        <div className="flex items-center gap-2 text-slate-300 text-sm">
           <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
             <UserIcon className="w-4 h-4" />
           </div>
           <span className="font-medium">{user?.name || 'Guest'}</span>
        </div>
        <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${isSubscribed ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-orange-500/50 text-orange-200' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>
           {isSubscribed ? (
             <span className="font-bold">PRO UNLIMITED</span>
           ) : (
             <>
               <Coins className="w-4 h-4 text-yellow-400" />
               <span className="font-bold text-white">{credits}</span>
               <span className="text-xs opacity-70">Credits Left</span>
             </>
           )}
        </div>
      </div>

      <div className="text-center mb-8 pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 mb-6 shadow-lg shadow-purple-500/30">
          <Wand2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
          Piclore <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">AI</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Create pixel-perfect wallpapers automatically optimized for your screen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Celebrity Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-purple-300 ml-1">Celebrity or Topic</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-purple-400 transition-colors" />
            <input
              type="text"
              value={celeb}
              onChange={(e) => setCeleb(e.target.value)}
              placeholder="e.g. Taylor Swift, Cyberpunk City"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-xl"
              required
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
             <label className="text-xs font-medium text-slate-400 ml-1 flex items-center gap-1">
               <Camera className="w-3 h-3" /> Image Style
             </label>
             <div className="relative">
               <select 
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
               >
                 <option value="Default">Auto (AI Choice)</option>
                 <option value="Professional Studio">Professional Studio</option>
                 <option value="Candid Shot">Candid / Street</option>
                 <option value="Movie Still">Movie Still</option>
                 <option value="Red Carpet">Red Carpet</option>
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
               </div>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 ml-1 flex items-center gap-1">
              <Clapperboard className="w-3 h-3" /> Context (Optional)
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Iron Man 2"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Device Indicator (ReadOnly) */}
        <div className="pt-2 flex items-center justify-center gap-2 text-slate-500 text-sm">
           <Smartphone className="w-4 h-4" />
           <span>Optimizing for: <span className="text-slate-300 font-medium">{detectedLabel}</span></span>
        </div>

        <button
          type="submit"
          disabled={!celeb || isProcessing}
          className="w-full bg-white text-slate-900 font-bold text-lg py-4 rounded-xl hover:bg-purple-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isProcessing ? 'Analyzing...' : 'Generate'}
          {!isProcessing && <ArrowRight className="w-5 h-5" /> }
        </button>
      </form>
      
      <div className="mt-8 text-center text-xs text-slate-500">
        <p>Powered by Google Gemini 2.5 Flash</p>
      </div>
    </div>
  );
};