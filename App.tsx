
import React, { useState } from 'react';
import { BrandIdentity, GeneratedImage, FormData } from './types';
import { generateBrandIdentity, generateImage } from './services/geminiService';
import { InputPanel } from './components/InputPanel';
import { LogoDisplay } from './components/LogoDisplay';
import { ProductCard } from './components/ProductCard';
import { BudgetBreakdown } from './components/BudgetBreakdown';
import { CubeLoader } from './components/CubeLoader';
import { Sparkles, Box, PieChart, Briefcase } from 'lucide-react';

const App: React.FC = () => {
  const [form, setForm] = useState<FormData>({
    description: '',
    location: '',
    budget: 1000,
    currency: 'USD',
    existingName: '',
    existingSlogan: '',
    existingColors: ''
  });

  const [isThinking, setIsThinking] = useState(false);
  const [brandData, setBrandData] = useState<BrandIdentity | null>(null);
  const [logoImage, setLogoImage] = useState<GeneratedImage | null>(null);
  const [isLogoGenerating, setIsLogoGenerating] = useState(false);
  
  // State to persist product images across tab switches
  const [productImages, setProductImages] = useState<Record<number, GeneratedImage>>({});
  
  const [activeTab, setActiveTab] = useState<'identity' | 'budget' | 'products'>('identity');

  const handleFormChange = (key: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!form.description || !form.location) return;

    setIsThinking(true);
    setBrandData(null);
    setLogoImage(null);
    setProductImages({}); // Reset product images on new plan generation

    try {
      const data = await generateBrandIdentity(form);
      setBrandData(data);
      
      // If user entered a messy location, auto-update it in the form
      if (data.normalizedLocation && data.normalizedLocation !== form.location) {
        setForm(prev => ({ ...prev, location: data.normalizedLocation }));
      }

      generateBrandLogo(data);
    } catch (error) {
      console.error("Failed to generate brand identity:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };

  const generateBrandLogo = async (data: BrandIdentity) => {
    setIsLogoGenerating(true);
    try {
      const prompt = `A professional logo for "${data.companyName}". Style: ${data.logoStyle}. Minimalist, vector art, white background.`;
      const img = await generateImage(prompt, "1:1");
      setLogoImage(img);
    } catch (err) {
      console.error("Logo generation failed", err);
    } finally {
      setIsLogoGenerating(false);
    }
  };

  const handleProductImageGenerated = (index: number, img: GeneratedImage) => {
    setProductImages(prev => ({
        ...prev,
        [index]: img
    }));
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar Input */}
      <div className="w-80 md:w-96 flex-shrink-0 h-full z-20 shadow-xl border-r border-slate-200">
        <InputPanel 
          form={form} 
          onChange={handleFormChange} 
          onSubmit={handleGenerate}
          isGenerating={isThinking}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto bg-slate-50 relative">
        
        {!brandData && !isThinking && (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center text-slate-500">
            <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-lg">
                <Briefcase className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Start Your Journey</h2>
            <p className="max-w-md text-slate-500">Enter your business details in the sidebar. Our AI will generate a professional brand identity, logo, and financial plan tailored to your location.</p>
          </div>
        )}

        {isThinking && (
             <div className="h-full flex flex-col items-center justify-center p-10">
                <CubeLoader />
                <h2 className="text-xl font-semibold text-slate-800 mt-8 animate-pulse">Building Strategy...</h2>
                <p className="text-slate-500 mt-2 text-sm">Analyzing real-time market data for {form.location}</p>
             </div>
        )}

        {brandData && (
          <div className="max-w-6xl mx-auto p-8 sm:p-12 animate-fade-in pb-20">
            
            {/* Header Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">{brandData.companyName}</h1>
                        <p className="text-xl text-blue-600 font-medium italic">"{brandData.slogan}"</p>
                        <p className="mt-4 text-slate-600 max-w-3xl leading-relaxed">{brandData.description}</p>
                    </div>
                    {/* Palette */}
                    <div className="flex gap-3 shrink-0">
                        {brandData.colorPalette.map((color, i) => (
                        <div key={i} className="flex flex-col items-center group">
                             <div className="w-12 h-12 rounded-full shadow-md border-2 border-white" style={{ backgroundColor: color }}></div>
                             <span className="text-[10px] text-slate-400 mt-1 opacity-0 group-hover:opacity-100 font-mono uppercase">{color}</span>
                        </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 pb-1 sticky top-0 bg-slate-50/95 backdrop-blur z-10 pt-2">
                <button 
                    onClick={() => setActiveTab('identity')}
                    className={`px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'identity' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                >
                    <Sparkles className="w-4 h-4" /> Identity & Logo
                </button>
                <button 
                    onClick={() => setActiveTab('budget')}
                    className={`px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'budget' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                >
                    <PieChart className="w-4 h-4" /> Financial Plan
                </button>
                <button 
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'products' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                >
                    <Box className="w-4 h-4" /> Services & Products
                </button>
            </div>

            {/* Content Views */}
            <div className="space-y-6">
                
                {activeTab === 'identity' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-800">Logo Design</h3>
                            <LogoDisplay 
                                image={logoImage}
                                isGenerating={isLogoGenerating}
                                onGenerate={() => brandData && generateBrandLogo(brandData)}
                                companyName={brandData.companyName}
                            />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Brand Strategy</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Visual Direction</div>
                                    <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{brandData.logoStyle}</p>
                                </div>
                                <div className="h-px bg-slate-100"></div>
                                <div>
                                     <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Market Positioning</div>
                                     <p className="text-slate-700 text-sm leading-relaxed">
                                        Tailored for the <span className="text-blue-700 font-semibold">{brandData.normalizedLocation || form.location}</span> market. 
                                        The brand uses a primary palette of <span className="font-medium text-slate-900">{brandData.colorPalette[0]}</span> to establish authority and trust with local clientele.
                                     </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'budget' && (
                    <div className="animate-fade-in">
                         <BudgetBreakdown plan={brandData.budgetPlan} userBudget={form.budget} />
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {brandData.products.map((product, index) => (
                            <ProductCard 
                                key={index}
                                product={product} 
                                logoStyle={brandData.logoStyle}
                                companyName={brandData.companyName}
                                image={productImages[index] || null}
                                onImageGenerated={(img) => handleProductImageGenerated(index, img)}
                                logoImage={logoImage}
                                currency={brandData.budgetPlan.currency}
                                businessType={brandData.businessType}
                                location={brandData.normalizedLocation || form.location}
                            />
                        ))}
                    </div>
                )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default App;
