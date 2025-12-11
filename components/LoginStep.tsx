import React, { useState } from 'react';
import { User } from '../types';
import { Sparkles, Globe, Mail, User as UserIcon, ArrowRight } from 'lucide-react';

interface LoginStepProps {
  onLogin: (user: User) => void;
}

export const LoginStep: React.FC<LoginStepProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && country) {
      onLogin({ name, email, country });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 mb-6 shadow-2xl shadow-purple-500/20 ring-4 ring-white/5">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
          Piclore <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">AI</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Join now and get <span className="text-white font-bold">10 Free Downloads</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl">
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-purple-300 uppercase tracking-wider ml-1">Full Name</label>
          <div className="relative group">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-purple-400 transition-colors" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-purple-300 uppercase tracking-wider ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-purple-400 transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-purple-300 uppercase tracking-wider ml-1">Country</label>
          <div className="relative group">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-purple-400 transition-colors" />
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. USA, Japan"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 mt-4"
        >
          Claim 10 Free Credits
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
      
      <p className="mt-8 text-center text-xs text-slate-600">
        By continuing, you agree to our Terms of Service.
      </p>
    </div>
  );
};