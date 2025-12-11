
import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { Button } from './Button';
import { Download, Sparkles } from 'lucide-react';

interface LogoDisplayProps {
  image: GeneratedImage | null;
  isGenerating: boolean;
  onGenerate: () => void;
  companyName: string;
}

export const LogoDisplay: React.FC<LogoDisplayProps> = ({ image, isGenerating, onGenerate, companyName }) => {
  
  const [progressMsg, setProgressMsg] = useState("Initializing creative studio...");

  // Cycle through creative phases while generating
  useEffect(() => {
    if (!isGenerating) return;
    
    const phases = [
        "Analyzing brand essence...",
        "Sketching initial concepts...",
        "Applying color palette...",
        "Vectorizing details...",
        "Finalizing render..."
    ];
    let i = 0;
    setProgressMsg(phases[0]);

    const interval = setInterval(() => {
        i = (i + 1) % phases.length;
        setProgressMsg(phases[i]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center h-full relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
          backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
      }}></div>

      {!image && !isGenerating && (
        <div className="text-center p-8 relative z-10">
          <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center border border-slate-200">
            <Sparkles className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Logo Yet</h3>
          <p className="text-slate-500 mb-6 text-sm">Generate a unique, professional logo for your brand using Imagen 4.</p>
          <Button onClick={onGenerate} variant="primary">Generate Logo</Button>
        </div>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center relative z-10 animate-fade-in">
          <div className="w-32 h-32 rounded-xl bg-slate-50 mb-6 border-2 border-slate-100 flex items-center justify-center relative overflow-hidden">
             {/* Simple internal pulse for the logo placeholder itself */}
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-[shimmer_1.5s_infinite] translate-x-[-100%]"></div>
             <Sparkles className="w-10 h-10 text-blue-200 animate-pulse" />
          </div>
          <p className="text-blue-600 font-bold text-lg animate-pulse">{progressMsg}</p>
          <p className="text-slate-400 text-xs mt-2">This takes a few seconds</p>
          <style>{`
            @keyframes shimmer {
                100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      )}

      {image && (
        <div className="w-full flex flex-col gap-6 animate-fade-in relative z-10 items-center">
          <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border border-slate-100 shadow-lg flex items-center justify-center group-hover:border-blue-200 transition-colors max-w-[400px]">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
               <img 
                src={`data:${image.mimeType};base64,${image.base64}`} 
                alt="Generated Logo" 
                className="w-full h-full object-contain p-4"
              />
          </div>

          <div className="flex flex-wrap gap-3 justify-center w-full">
            <Button 
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = `data:${image.mimeType};base64,${image.base64}`;
                link.download = `${companyName.replace(/\s+/g, '_')}_logo.png`;
                link.click();
              }}
              icon={<Download className="w-4 h-4"/>}
            >
              Download PNG
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
