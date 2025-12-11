import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingStepProps {
  status: string;
}

export const ProcessingStep: React.FC<ProcessingStepProps> = ({ status }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-lg mx-auto p-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
        <Loader2 className="w-16 h-16 text-purple-400 animate-spin relative z-10" />
      </div>
      <h2 className="mt-8 text-2xl font-bold text-white">{status}</h2>
      <p className="mt-2 text-slate-400">
        Our AI is crafting the perfect image for your screen.
      </p>
    </div>
  );
};