import React, { useState } from 'react';
import { LoginStep } from './components/LoginStep';
import { InputStep } from './components/InputStep';
import { ProcessingStep } from './components/ProcessingStep';
import { EditorStep } from './components/EditorStep';
import { getPhoneSpecs, generateWallpaper } from './services/gemini';
import { PhoneSpecs, ImageSource, AppStep, SearchQuery, User } from './types';

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(10);
  
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

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex items-center justify-center">
      
      {step === AppStep.LOGIN && (
        <LoginStep onLogin={handleLogin} />
      )}

      {step === AppStep.INPUT && (
        <InputStep 
          onNext={handleStart} 
          isProcessing={false} 
          user={user}
          credits={credits}
          isSubscribed={isSubscribed}
        />
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
  );
}