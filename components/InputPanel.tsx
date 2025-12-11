import React, { useState } from 'react';
import { FormData, Currency } from '../types';
import { Button } from './Button';
import { validateLocation } from '../services/geminiService';
import { Building2, Wallet, MapPin, Sparkles, Palette, Check, AlertTriangle, Loader2 } from 'lucide-react';

interface InputPanelProps {
  form: FormData;
  onChange: (key: keyof FormData, value: any) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ form, onChange, onSubmit, isGenerating }) => {
  
  const currencies: Currency[] = ['USD', 'EUR', 'BAM', 'RSD', 'GBP'];
  const [isCheckingLoc, setIsCheckingLoc] = useState(false);
  const [locStatus, setLocStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const handleLocationBlur = async () => {
    if (!form.location || form.location.length < 2) return;
    
    setIsCheckingLoc(true);
    try {
      const result = await validateLocation(form.location);
      if (result.isValid) {
        onChange('location', result.normalizedName);
        setLocStatus('valid');
      } else {
        setLocStatus('invalid');
      }
    } catch (e) {
      console.error("Loc check failed", e);
    } finally {
      setIsCheckingLoc(false);
    }
  };

  return (
    <div className="w-full h-full bg-white border-r border-slate-200 p-6 overflow-y-auto custom-scrollbar flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">BrandForge Pro</h1>
        </div>
        <p className="text-slate-500 text-sm">Business Intelligence Suite</p>
      </div>

      <div className="space-y-6 flex-grow">
        {/* Core Concept */}
        <section className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Core Concept (Required)</label>
          <textarea
            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-24 transition-all"
            placeholder="Describe your business idea... (e.g. A vegan bakery focusing on gluten-free wedding cakes)"
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </section>

        {/* Financials */}
        <section className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-3 h-3" /> Location & Finances
          </label>
          
          <div>
            <label className="text-xs text-slate-500 mb-1 block font-medium">Business Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                className={`w-full bg-white border rounded-lg pl-9 pr-9 p-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors shadow-sm
                  ${locStatus === 'invalid' ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
                `}
                placeholder="e.g., Belgrade, Serbia"
                value={form.location}
                onChange={(e) => {
                  onChange('location', e.target.value);
                  setLocStatus('idle');
                }}
                onBlur={handleLocationBlur}
              />
              <div className="absolute right-3 top-2.5">
                {isCheckingLoc && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                {!isCheckingLoc && locStatus === 'valid' && <Check className="w-4 h-4 text-teal-500" />}
                {!isCheckingLoc && locStatus === 'invalid' && <AlertTriangle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            {locStatus === 'invalid' && (
              <p className="text-xs text-red-500 mt-1">Unknown location. Please enter a real city.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Total Budget</label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
                placeholder="10000"
                value={form.budget || ''}
                onChange={(e) => onChange('budget', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Currency</label>
              <select
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm cursor-pointer"
                value={form.currency}
                onChange={(e) => onChange('currency', e.target.value as Currency)}
              >
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Optional Details */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Optional Overrides
          </label>
          
          <input
            type="text"
            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
            placeholder="Existing Name (Optional)"
            value={form.existingName || ''}
            onChange={(e) => onChange('existingName', e.target.value)}
          />
          
          <input
            type="text"
            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
            placeholder="Existing Slogan (Optional)"
            value={form.existingSlogan || ''}
            onChange={(e) => onChange('existingSlogan', e.target.value)}
          />

          <div className="relative">
            <Palette className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
              placeholder="Preferred Colors (e.g. Gold, Black)"
              value={form.existingColors || ''}
              onChange={(e) => onChange('existingColors', e.target.value)}
            />
          </div>
        </section>
      </div>

      <div className="pt-6 mt-auto">
        <Button 
          onClick={onSubmit}
          isLoading={isGenerating}
          className="w-full shadow-lg shadow-blue-900/10"
          size="lg"
          disabled={!form.description || !form.location || !form.budget || locStatus === 'invalid'}
        >
          Generate Business Plan
        </Button>
        <p className="text-center text-xs text-slate-400 mt-3">
          AI-generated advice. Consult a professional before investing.
        </p>
      </div>
    </div>
  );
};