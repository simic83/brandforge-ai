
import React, { useState, useEffect } from 'react';
import { ProductIdea, GeneratedImage } from '../types';
import { generateImage } from '../services/geminiService';
import { Button } from './Button';
import { ImagePlus, Loader2, RefreshCw, Tag } from 'lucide-react';

interface ProductCardProps {
  product: ProductIdea;
  logoStyle: string;
  companyName: string;
  image: GeneratedImage | null;
  onImageGenerated: (img: GeneratedImage) => void;
  logoImage: GeneratedImage | null;
  currency: string;
  businessType: 'Service' | 'Product';
  location: string;
  imageQuotaReached: boolean;
  onImageQuotaExceeded: (message: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, logoStyle, companyName, image, onImageGenerated, logoImage, currency, businessType, location, imageQuotaReached, onImageQuotaExceeded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (loading || imageQuotaReached) return;
    setLoading(true);
    setError(false);
    try {
      let prompt = "";
      
      if (businessType === 'Service') {
        // Evolving Logo Logic: Transform the base logo into a representation of the service
        prompt = `
          A highly detailed, 3D rendered evolution of the provided logo. 
          The logo is transforming into a representation of "${product.name}". 
          Concept: ${product.visualPrompt}.
          Style: Cyberpunk, glassmorphism, intricate 8k texture, glowing edges, cinematic lighting. 
          The shape should resemble the original logo but be significantly more complex and premium.
        `.trim();
      } else {
        // Standard Product Logic
        prompt = `
          High-quality commercial photography of ${product.name}: ${product.visualPrompt}. 
          Cinematic lighting, 8k resolution, photorealistic, commercial style.
          Incorporate the provided logo naturally into the scene (e.g. on the product packaging or label).
        `.trim();
      }
      
      // If we have a logo, pass it as a reference image to the service
      const res = await generateImage(
          prompt, 
          "1:1", 
          logoImage ? logoImage.base64 : undefined
      );
      
      onImageGenerated(res);
    } catch (e) {
      console.error(e);
      setError(true);
      if ((e as any)?.code === "IMAGE_QUOTA_EXCEEDED") {
        const msg = (e as any)?.message || "Image quota exceeded for this API key. Enable billing or wait for reset.";
        setErrorMessage(msg);
        onImageQuotaExceeded(msg);
      } else {
        setErrorMessage("Generation failed. Please retry.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!image && !loading && !error && !imageQuotaReached) {
        handleGenerate();
    }
  }, [product, image, imageQuotaReached]);

  const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          maximumFractionDigits: 0
      }).format(price);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 relative">
      <div className="aspect-square bg-slate-50 relative group border-b border-slate-100">
        {image ? (
          <img 
            src={`data:${image.mimeType};base64,${image.base64}`} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
             {loading ? (
               <>
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <span className="text-xs font-medium text-blue-600 px-4 text-center">
                    {logoImage 
                      ? (businessType === 'Service' ? "Evolving Logo..." : "Applying Brand...") 
                      : "Rendering..."}
                </span>
               </>
             ) : (
               <>
                 {error ? (
                   <div className="text-center px-4">
                     <p className="text-red-500 text-xs mb-2">{errorMessage || "Generation failed"}</p>
                     <Button onClick={handleGenerate} size="sm" variant="ghost" icon={<RefreshCw className="w-3 h-3"/>}>Retry</Button>
                   </div>
                 ) : (
                    <ImagePlus className="w-10 h-10 opacity-20" />
                 )}
               </>
             )}
          </div>
        )}
        
        {/* Dynamic Location-Aware Price Tag */}
        <div 
            className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-bold text-slate-900 shadow-md flex items-center border border-slate-100 cursor-help transition-transform hover:scale-105 z-10"
            title={`Estimated ${businessType === 'Service' ? 'membership/service' : 'retail'} price for the ${location} market.`}
        >
            <Tag className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            {formatPrice(product.price)}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{product.name}</h3>
        <p className="text-slate-600 text-sm mb-4 flex-grow leading-relaxed">{product.description}</p>
        {image && (
           <Button onClick={handleGenerate} isLoading={loading} variant="ghost" className="self-start text-xs px-2 py-1 h-auto mt-2 text-slate-500 hover:text-blue-600">
            Regenerate
           </Button>
        )}
      </div>
    </div>
  );
};
