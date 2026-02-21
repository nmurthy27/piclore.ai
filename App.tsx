import React, { useState } from 'react';
import { LoginStep } from './components/LoginStep';
import { InputStep } from './components/InputStep';
import { ProcessingStep } from './components/ProcessingStep';
import { EditorStep } from './components/EditorStep';
import { LeadGeneratorTool } from './components/LeadGeneratorTool';
import { getPhoneSpecs, generateWallpaper } from './services/gemini';
import { PhoneSpecs, ImageSource, AppStep, SearchQuery, User } from './types';

type ActiveTool = 'wallpaper' | 'leads';

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(10);
  const [activeTool, setActiveTool] = useState<ActiveTool>('wallpaper');
  
  const [specs, setSpecs] = useState<PhoneSpecs | null>(null);
  const [image, setImage] = useState<ImageSource | null>(null);
  const [query, setQuery] = useState<SearchQuery | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  
  // Subscription State
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // History state: stores up to 10 items
  const [history, setHistory] = useState<ImageSource[]>([]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setCredits(10); // Start with 10 free credits
    setStep(AppStep.INPUT);
  };

  const addToHistory = (newImg: ImageSource) => {
    setHistory(prev => {
      // Avoid duplicates at the top of the stack
      if (prev.length > 0 && prev[0].data === newImg.data) return prev;
      
      const newHistory = [newImg, ...prev];
      return newHistory.slice(0, 10);
    });
  };

  const handleStart = async (celeb: string, phone: string, style: string, context: string) => {
    setQuery({ celeb, phone, style, context });
    setStep(AppStep.PROCESSING);

    try {
      // 1. Get Phone Specs
      setStatusMsg(`Analyzing ${phone} screen specs...`);
      const phoneSpecs = await getPhoneSpecs(phone);
      setSpecs(phoneSpecs);

      // 2. Generate Image
      setStatusMsg(`Generating ${celeb} artwork...`);
      await generateNewImage(celeb, style, context);

    } catch (err) {
      console.error(err);
      setStatusMsg("Something went wrong. Please try again.");
      setTimeout(() => setStep(AppStep.INPUT), 2000);
    }
  };

  const generateNewImage = async (celebQuery: string, style: string, context: string) => {
    // Generate AI Image
    const base64Image = await generateWallpaper(celebQuery, style, context);
    
    if (base64Image) {
      const newImg: ImageSource = { type: 'ai', data: base64Image };
      setImage(newImg);
      addToHistory(newImg);
      setStep(AppStep.EDITOR);
    } else {
      setStatusMsg("Failed to generate image. Please try a different topic.");
      setTimeout(() => setStep(AppStep.INPUT), 2000);
    }
  };

  const handleRegenerate = async () => {
    if (!query) return;
    setStep(AppStep.PROCESSING);
    setStatusMsg(`Creating a new variation of ${query.celeb}...`);
    await generateNewImage(query.celeb, query.style, query.context);
  };

  const handleUrlChange = (url: string) => {
    const newImg: ImageSource = { type: 'url', data: url };
    setImage(newImg);
    addToHistory(newImg);
  };

  const handleSelectFromHistory = (historyImg: ImageSource) => {
    setImage(historyImg);
  };

  const handleBack = () => {
    setStep(AppStep.INPUT);
    setSpecs(null);
    setImage(null);
    setQuery(null);
    // Note: We keep history even when going back to input
  };

  const handleDownloadConsumeCredit = () => {
    // Only decrement if not subscribed
    if (!isSubscribed) {
      setCredits(prev => Math.max(0, prev - 1));
    }
  };

  const isLoggedIn = user !== null;
  const showToolNav =
    isLoggedIn &&
    step !== AppStep.PROCESSING &&
    step !== AppStep.EDITOR;

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black">

      {/* Tool navigation bar — visible after login, outside of editor/processing */}
      {showToolNav && (
        <div className="flex justify-center pt-4 px-4">
          <div className="flex items-center gap-1 bg-slate-800/70 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setActiveTool('wallpaper')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTool === 'wallpaper'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              Wallpaper Generator
            </button>
            <button
              onClick={() => setActiveTool('leads')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTool === 'leads'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              Lead Generator
            </button>
          </div>
        </div>
      )}

      <div className={`flex ${showToolNav && activeTool === 'leads' ? 'justify-start' : 'items-center justify-center'} min-h-[calc(100vh-64px)]`}>

        {step === AppStep.LOGIN && (
          <LoginStep onLogin={handleLogin} />
        )}

        {step === AppStep.INPUT && activeTool === 'wallpaper' && (
          <InputStep
            onNext={handleStart}
            isProcessing={false}
            user={user}
            credits={credits}
            isSubscribed={isSubscribed}
          />
        )}

        {step === AppStep.INPUT && activeTool === 'leads' && (
          <LeadGeneratorTool userCountry={user?.country} />
        )}

        {step === AppStep.PROCESSING && (
          <ProcessingStep status={statusMsg} />
        )}

        {step === AppStep.EDITOR && specs && image && (
          <EditorStep
            image={image}
            specs={specs}
            history={history}
            isSubscribed={isSubscribed}
            user={user}
            credits={credits}
            onSubscribe={() => setIsSubscribed(true)}
            onBack={handleBack}
            onRegenerate={handleRegenerate}
            onUrlChange={handleUrlChange}
            onSelectFromHistory={handleSelectFromHistory}
            onDownloadConsumeCredit={handleDownloadConsumeCredit}
          />
        )}

      </div>
    </div>
  );
}