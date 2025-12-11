import React, { useRef, useEffect, useState } from 'react';
import { PhoneSpecs, ImageSource, User } from '../types';
import { Download, ZoomIn, ZoomOut, AlertTriangle, RefreshCw, Upload, History, Share2, Facebook, Twitter, Instagram, MessageCircle, Crown, X, Check, Coins } from 'lucide-react';

interface EditorStepProps {
  image: ImageSource;
  specs: PhoneSpecs;
  history: ImageSource[];
  isSubscribed: boolean;
  user: User | null;
  credits: number;
  onSubscribe: () => void;
  onBack: () => void;
  onRegenerate: () => void;
  onUrlChange: (url: string) => void;
  onSelectFromHistory: (img: ImageSource) => void;
  onDownloadConsumeCredit: () => void;
}

export const EditorStep: React.FC<EditorStepProps> = ({ 
  image, 
  specs, 
  history,
  isSubscribed,
  user,
  credits,
  onSubscribe,
  onBack, 
  onRegenerate, 
  onUrlChange,
  onSelectFromHistory,
  onDownloadConsumeCredit
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Calculate aspect ratio
  const aspectRatio = specs.width / specs.height;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.data;
    
    img.onload = () => {
      setImgElement(img);
      setError(null);
      setPosition({ x: 0, y: 0 });
    };

    img.onerror = () => {
      setError("Could not load image. If using a URL, the server might block access.");
    };
  }, [image.data]);

  // Drawing logic
  useEffect(() => {
    if (!canvasRef.current || !imgElement || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // The canvas represents the PHONE SCREEN dimensions
    const MAX_DIM = 1200; 
    let drawWidth = specs.width;
    let drawHeight = specs.height;

    if (drawWidth > MAX_DIM || drawHeight > MAX_DIM) {
      const ratio = drawWidth / drawHeight;
      if (drawWidth > drawHeight) {
        drawWidth = MAX_DIM;
        drawHeight = MAX_DIM / ratio;
      } else {
        drawHeight = MAX_DIM;
        drawWidth = MAX_DIM * ratio;
      }
    }

    canvas.width = drawWidth;
    canvas.height = drawHeight;

    // Draw background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate how to draw the image based on scale and position
    // Initial "Cover" scale
    const scaleX = canvas.width / imgElement.width;
    const scaleY = canvas.height / imgElement.height;
    const baseScale = Math.max(scaleX, scaleY);
    
    const currentScale = baseScale * scale;

    const imgDrawWidth = imgElement.width * currentScale;
    const imgDrawHeight = imgElement.height * currentScale;

    // Center point
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Position offsets
    const drawX = centerX - (imgDrawWidth / 2) + position.x;
    const drawY = centerY - (imgDrawHeight / 2) + position.y;

    ctx.drawImage(imgElement, drawX, drawY, imgDrawWidth, imgDrawHeight);

    // --- WATERMARK LOGIC ---
    if (!isSubscribed) {
      ctx.save();
      // Use a smaller font size relative to canvas width (3.5%)
      const fontSize = Math.max(14, canvas.width * 0.035); 
      ctx.font = `500 ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 4;
      
      // Position at the bottom center with padding
      const paddingBottom = canvas.height * 0.05; 

      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText("Piclore AI", canvas.width / 2, canvas.height - paddingBottom);
      ctx.restore();
    }

  }, [imgElement, specs, scale, position, isSubscribed]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    // Credit Check Logic
    if (!isSubscribed && credits <= 0) {
      setShowSubscriptionModal(true);
      return;
    }

    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `piclore-${specs.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      
      // Consume credit after successful download initiation
      onDownloadConsumeCredit();
    } catch (e) {
      setError("Cannot download this image due to security restrictions (CORS). Please take a screenshot.");
    }
  };

  const handleSocialShare = async (platform: 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'native') => {
    if (!canvasRef.current) return;
    setIsSharing(true);

    try {
      // Create a blob for sharing
      const blob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error("Could not generate image");

      const file = new File([blob], `piclore-art.png`, { type: 'image/png' });
      const shareData: ShareData = {
        files: [file],
        title: 'Piclore AI',
        text: `Check out this custom wallpaper I created for my ${specs.name}!`
      };

      // Native File Share (Mobile/Supported Browsers)
      // Used for "Share" button, Instagram (only way), and generic share
      if (platform === 'native' || platform === 'instagram') {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share(shareData);
        } else {
          // Fallback for desktop/unsupported
          if (platform === 'instagram') {
            setError("To share to Instagram, please download the image and post it manually.");
          } else {
            handleDownload(); // Fallback to download
          }
        }
      }
      // Link/Text Based Sharing
      else {
         const text = encodeURIComponent(`Check out this custom wallpaper I created for my ${specs.name}! #PicloreAI`);
         const url = encodeURIComponent(window.location.href);
         
         if (platform === 'whatsapp') {
            // WhatsApp can handle text share easily
            window.open(`https://wa.me/?text=${text}`, '_blank');
         } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
         } else if (platform === 'facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
         }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError("Sharing failed. Try downloading instead.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput) {
      onUrlChange(urlInput);
      setShowUrlInput(false);
      setUrlInput('');
    }
  };

  const handlePayment = () => {
    // Simulating Payment Process
    setTimeout(() => {
        onSubscribe();
        setShowSubscriptionModal(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full max-w-7xl mx-auto p-4 gap-6 items-start">
      
      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button 
                onClick={() => setShowSubscriptionModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
                <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                    <Crown className="w-6 h-6 text-white" />
                </div>
                {credits <= 0 ? (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-2">Out of Free Credits</h3>
                    <p className="text-slate-400">Upgrade to Pro to continue downloading without limits.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h3>
                    <p className="text-slate-400">Remove watermarks and unlock full quality downloads.</p>
                  </>
                )}
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-slate-200">
                    <div className="bg-green-500/20 p-1 rounded-full"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>No Watermarks</span>
                </div>
                <div className="flex items-center gap-3 text-slate-200">
                    <div className="bg-green-500/20 p-1 rounded-full"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>Unlimited Downloads</span>
                </div>
                <div className="flex items-center gap-3 text-slate-200">
                    <div className="bg-green-500/20 p-1 rounded-full"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>Commercial usage rights</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-purple-500 bg-purple-500/10 rounded-xl p-4 text-center cursor-pointer hover:bg-purple-500/20 transition-colors">
                    <div className="text-sm text-purple-300 font-semibold mb-1">Monthly</div>
                    <div className="text-2xl font-bold text-white">$5</div>
                    <div className="text-xs text-slate-400">/mo</div>
                </div>
                <div className="border border-slate-700 bg-slate-800 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-700 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-[10px] text-black font-bold px-2 py-0.5 rounded-bl-lg">SAVE 17%</div>
                    <div className="text-sm text-slate-300 font-semibold mb-1">Yearly</div>
                    <div className="text-2xl font-bold text-white">$50</div>
                    <div className="text-xs text-slate-400">/yr</div>
                </div>
            </div>

            <button 
                onClick={handlePayment}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/40 transition-all active:scale-[0.98]"
            >
                Subscribe Now
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-4">
                Secure payment via Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      )}

      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-6 order-2 lg:order-1 shrink-0">
        
        {/* User Info Compact */}
        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-500 font-bold">Account</span>
              <span className="text-xs text-white font-semibold truncate max-w-[120px]">{user?.name}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${isSubscribed ? 'bg-orange-500/20 text-orange-200' : 'bg-slate-700 text-white'}`}>
                {isSubscribed ? <Crown className="w-3 h-3" /> : <Coins className="w-3 h-3 text-yellow-400" />}
                <span className="text-xs font-bold">{isSubscribed ? 'PRO' : `${credits} Left`}</span>
            </div>
        </div>
        
        {/* Adjust Panel */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm shadow-xl">
          <h2 className="text-xl font-bold text-white mb-1">Adjust Wallpaper</h2>
          <p className="text-sm text-slate-400 mb-6">{specs.name} • {specs.width}x{specs.height}</p>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2 block">Zoom</label>
              <div className="flex items-center gap-4">
                <ZoomOut className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <ZoomIn className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {!isSubscribed && (
                <div onClick={() => setShowSubscriptionModal(true)} className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-orange-500/60 transition-colors group">
                    <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-bold text-orange-200">Remove Watermark</span>
                    </div>
                    <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded group-hover:bg-orange-400 transition-colors">
                        $5/mo
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-slate-700 space-y-3">
               <button onClick={handleDownload} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20">
                 <Download className="w-5 h-5" />
                 Download
                 {!isSubscribed && <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded ml-1">-1 Credit</span>}
               </button>

               {/* Social Share Grid */}
               <div className="grid grid-cols-5 gap-2">
                 <button onClick={() => handleSocialShare('native')} title="Share Image" className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg flex items-center justify-center transition-colors">
                    <Share2 className="w-5 h-5" />
                 </button>
                 <button onClick={() => handleSocialShare('whatsapp')} title="WhatsApp" className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] p-2 rounded-lg flex items-center justify-center transition-colors border border-[#25D366]/50">
                    <MessageCircle className="w-5 h-5" />
                 </button>
                 <button onClick={() => handleSocialShare('instagram')} title="Instagram" className="bg-[#E1306C]/20 hover:bg-[#E1306C]/30 text-[#E1306C] p-2 rounded-lg flex items-center justify-center transition-colors border border-[#E1306C]/50">
                    <Instagram className="w-5 h-5" />
                 </button>
                 <button onClick={() => handleSocialShare('facebook')} title="Facebook" className="bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] p-2 rounded-lg flex items-center justify-center transition-colors border border-[#1877F2]/50">
                    <Facebook className="w-5 h-5" />
                 </button>
                 <button onClick={() => handleSocialShare('twitter')} title="X / Twitter" className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg flex items-center justify-center transition-colors border border-white/30">
                    <Twitter className="w-5 h-5" />
                 </button>
               </div>

               <p className="text-[10px] text-slate-500 text-center leading-tight pt-2">
                 Disclaimer: Image generated by AI or provided by user. All rights belong to respective owners. Personal use only.
               </p>
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm space-y-3 shadow-xl">
          <button onClick={onRegenerate} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Regenerate AI Image
          </button>
          
          {!showUrlInput ? (
            <button onClick={() => setShowUrlInput(true)} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Upload className="w-4 h-4" />
              Paste Image URL
            </button>
          ) : (
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <input 
                type="url" 
                placeholder="https://..." 
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                autoFocus
              />
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-3 rounded-lg text-xs font-bold transition-colors">Go</button>
            </form>
          )}

           <button onClick={onBack} className="w-full text-slate-400 hover:text-white py-2 text-sm transition-colors">
            Start Over
          </button>
        </div>

        {/* History Panel */}
        {history.length > 0 && (
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm shadow-xl">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <History className="w-3 h-3" /> Recent History
             </h3>
             <div className="grid grid-cols-4 gap-2">
                {history.map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => onSelectFromHistory(item)}
                    className={`relative aspect-square rounded-lg overflow-hidden transition-all group ${image.data === item.data ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-800' : 'opacity-70 hover:opacity-100 hover:ring-2 hover:ring-slate-500'}`}
                  >
                    <img src={item.data} alt={`History ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
             </div>
          </div>
        )}

        {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col items-center justify-center order-1 lg:order-2 w-full min-h-[50vh]">
        <div 
          className="relative rounded-[2rem] overflow-hidden border-[8px] border-slate-800 shadow-2xl bg-black max-h-[85vh]"
          style={{ aspectRatio: `${aspectRatio}` }}
          ref={containerRef}
        >
          {/* Instructions Overlay */}
          <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none opacity-50">
             <span className="bg-black/50 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-md">
               Drag to pan • Pinch to zoom
             </span>
          </div>

          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-move touch-none block"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
      </div>

    </div>
  );
};