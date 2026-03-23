/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  Upload, 
  Camera, 
  CameraOff,
  Leaf, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Sprout, 
  ChevronRight,
  RefreshCw,
  Info,
  Droplets,
  Bug,
  Sun,
  Thermometer,
  History,
  LayoutDashboard,
  Calendar,
  Trash2,
  Globe,
  Languages,
  Volume2,
  Play,
  Pause,
  Volume1,
  VolumeX,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { analyzeLeafImage, translateResult, generateSpeech } from './services/aiService';
import { AnalysisResult } from './types';
import { addWavHeader } from './lib/audio';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'pt', name: 'Português' },
];

// Memoized Result Display Component for performance
const ResultDisplay = React.memo(({ 
  result, 
  isSpeaking, 
  isGeneratingAudio,
  onSpeak, 
  reset 
}: { 
  result: AnalysisResult; 
  isSpeaking: boolean; 
  isGeneratingAudio: boolean;
  onSpeak: (text?: string) => void;
  reset: () => void;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border border-black/5 rounded-[40px] shadow-2xl shadow-black/5 overflow-hidden"
    >
      {/* Result Header */}
      <div className={cn(
        "p-8 text-white flex flex-col gap-1",
        result.isHealthy ? "bg-[#2D5A27]" : "bg-[#A63D40]"
      )}>
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Diagnosis Result</span>
            <h2 className="text-3xl font-bold mt-1">{result.diseaseName}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">
                {result.cropType}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                result.riskLevel === 'Critical' ? "bg-red-500 text-white" : 
                result.riskLevel === 'High' ? "bg-orange-500 text-white" :
                "bg-white/20 text-white"
              )}>
                {result.riskLevel} Risk
              </span>
            </div>
          </div>
          {result.isHealthy ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={() => onSpeak()}
            disabled={isSpeaking || isGeneratingAudio}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
              (isSpeaking || isGeneratingAudio)
                ? "bg-white/10 text-white/40 cursor-not-allowed" 
                : "bg-white/20 text-white hover:bg-white/30"
            )}
          >
            {isGeneratingAudio ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Generating...
              </>
            ) : isSpeaking ? (
              <>
                <Volume2 size={14} className="animate-pulse text-green-400" />
                Speaking...
              </>
            ) : (
              <>
                <Volume2 size={14} />
                Listen to Diagnosis
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#FDFDFB] p-3 rounded-2xl border border-black/5">
            <span className="text-[10px] uppercase font-bold text-black/40 block mb-1">Confidence</span>
            <div className="flex items-end gap-1">
              <span className="text-xl font-bold">{(result.confidence * 100).toFixed(0)}</span>
              <span className="text-xs font-medium text-black/40 mb-1">%</span>
            </div>
          </div>
          <div className="bg-[#FDFDFB] p-3 rounded-2xl border border-black/5">
            <span className="text-[10px] uppercase font-bold text-black/40 block mb-1">Infection Area</span>
            <div className="flex items-end gap-1">
              <span className="text-xl font-bold">{result.severity}</span>
              <span className="text-xs font-medium text-black/40 mb-1">%</span>
            </div>
            <div className="mt-2 h-1 bg-black/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${result.severity}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={cn(
                  "h-full",
                  result.severity > 60 ? "bg-red-500" : 
                  result.severity > 30 ? "bg-orange-500" : 
                  "bg-[#2D5A27]"
                )}
              />
            </div>
          </div>
          <div className="bg-[#FDFDFB] p-3 rounded-2xl border border-black/5">
            <span className="text-[10px] uppercase font-bold text-black/40 block mb-1">Urgency</span>
            <div className="flex items-end gap-1">
              <span className="text-sm font-bold truncate">{result.actionUrgency}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Info size={16} className="text-[#2D5A27]" />
              About this condition
            </h4>
            <button 
              onClick={() => onSpeak(result.description)}
              disabled={isSpeaking || isGeneratingAudio}
              className="p-1.5 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition-colors disabled:opacity-30"
              title="Listen to description"
            >
              {isGeneratingAudio ? <RefreshCw size={14} className="animate-spin" /> : <Volume2 size={14} />}
            </button>
          </div>
          <p className="text-black/70 leading-relaxed italic text-sm">
            "{result.description}"
          </p>
        </div>

        {/* Environmental Factors */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Sun size={16} className="text-orange-500" />
            Environmental Factors
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.environmentalFactors.map((factor, i) => (
              <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-full border border-orange-100">
                {factor}
              </span>
            ))}
          </div>
        </div>

        {/* Visual Markers */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider">Pathogen Markers</h4>
          <div className="flex flex-wrap gap-2">
            {result.visualMarkers.map((marker, i) => (
              <span key={i} className="px-3 py-1 bg-[#F5F9F4] text-[#2D5A27] text-[10px] font-bold rounded-full border border-[#2D5A27]/10">
                {marker}
              </span>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-6 pt-4 border-t border-black/5">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold flex items-center gap-2 text-[#2D5A27]">
                <Droplets size={20} />
                Treatment Plan
              </h4>
              <button 
                onClick={() => onSpeak(`Treatment plan: ${result.treatment.join(', ')}`)}
                disabled={isSpeaking || isGeneratingAudio}
                className="p-1.5 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition-colors disabled:opacity-30"
                title="Listen to treatment plan"
              >
                {isGeneratingAudio ? <RefreshCw size={14} className="animate-spin" /> : <Volume2 size={14} />}
              </button>
            </div>
            <ul className="space-y-3">
              {result.treatment.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-black/70">
                  <span className="w-5 h-5 rounded-full bg-[#2D5A27]/10 text-[#2D5A27] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold flex items-center gap-2 text-[#A63D40]">
                <ShieldCheck size={20} />
                Prevention Strategy
              </h4>
              <button 
                onClick={() => onSpeak(`Prevention strategy: ${result.prevention.join(', ')}`)}
                disabled={isSpeaking || isGeneratingAudio}
                className="p-1.5 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition-colors disabled:opacity-30"
                title="Listen to prevention strategy"
              >
                {isGeneratingAudio ? <RefreshCw size={14} className="animate-spin" /> : <Volume2 size={14} />}
              </button>
            </div>
            <ul className="space-y-3">
              {result.prevention.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-black/70">
                  <ChevronRight size={16} className="text-[#A63D40] shrink-0 mt-0.5" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <button 
            onClick={() => onSpeak()}
            disabled={isSpeaking || isGeneratingAudio}
            className={cn(
              "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
              (isSpeaking || isGeneratingAudio)
                ? "bg-black/5 text-black/20 cursor-not-allowed" 
                : "bg-[#2D5A27]/10 text-[#2D5A27] hover:bg-[#2D5A27]/20"
            )}
          >
            {isGeneratingAudio ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : isSpeaking ? (
              <Volume2 size={18} className="animate-pulse text-green-600" />
            ) : (
              <Volume2 size={18} />
            )}
            {isGeneratingAudio ? "Generating..." : isSpeaking ? "Speaking..." : "Listen to Full Report"}
          </button>

          <button 
            onClick={reset}
            className="w-full py-4 border-2 border-black/5 rounded-2xl font-bold text-black/40 hover:bg-black/5 hover:text-black transition-all"
          >
            New Analysis
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default function App() {
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('All');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [translationCache, setTranslationCache] = useState<Record<string, AnalysisResult>>({});
  const [speechCache, setSpeechCache] = useState<Record<string, string>>({});
  const translationRequestRef = useRef<string | null>(null);
  const translationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>(() => {
    const saved = localStorage.getItem('agri_guard_history');
    return saved ? JSON.parse(saved) : [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser does not support camera access. Please try a different browser.");
      return;
    }

    setIsCameraOpen(true); // Show camera UI first
    setError(null);
    
    // Small delay to ensure UI is ready and to avoid potential race conditions
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Try with environment facing mode first (back camera)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      } catch (e) {
        // Fallback to any video source if environment fails
        console.warn("Environment camera failed, falling back to default:", e);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setError(null);
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setIsCameraOpen(false); // Close camera UI on failure
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setError("Camera permission was denied. Please enable camera access in your browser settings and try again.");
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError("No camera found on this device.");
      } else if (err instanceof Error && err.message.includes('dismissed')) {
        setError("Camera permission prompt was dismissed. Please click the camera icon again and allow access.");
      } else {
        setError("Failed to access camera. Please ensure permissions are granted and you are using a secure connection.");
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        setResult(null);
        setError(null);
        stopCamera();
      }
    }
  };

  const saveToHistory = useCallback((newResult: AnalysisResult) => {
    setHistory(prev => {
      const updated = [newResult, ...prev];
      localStorage.setItem('agri_guard_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteFromHistory = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('agri_guard_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const preGenerateSpeech = useCallback(async (res: AnalysisResult, langCode: string) => {
    const fullCacheKey = `full_${res.id}_${langCode}`;
    const descCacheKey = `custom_${res.id}_${langCode}_${res.description.slice(0, 20)}`;
    
    if (speechCache[fullCacheKey] && speechCache[descCacheKey]) return;

    const fullText = `
      ${res.cropType} diagnosis: ${res.diseaseName}. 
      ${res.description}. 
      Treatment: ${res.treatment.join('. ')}. 
      Prevention: ${res.prevention.join('. ')}.
    `.trim();

    try {
      // Pre-generate full diagnosis first
      if (!speechCache[fullCacheKey]) {
        const pcmBase64 = await generateSpeech(fullText);
        if (pcmBase64) {
          setSpeechCache(prev => ({ ...prev, [fullCacheKey]: pcmBase64 }));
        }
      }

      // Then pre-generate description
      if (!speechCache[descCacheKey]) {
        const pcmBase64 = await generateSpeech(res.description);
        if (pcmBase64) {
          setSpeechCache(prev => ({ ...prev, [descCacheKey]: pcmBase64 }));
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      if (!errorMessage.includes('429') && !errorMessage.includes('RESOURCE_EXHAUSTED')) {
        console.warn("Background speech generation failed", err);
      }
    }
  }, [speechCache]);

  const onAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeLeafImage(image, language.name);
      const fullResult: AnalysisResult = {
        ...data,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        imageUrl: image
      };
      setResult(fullResult);
      setTranslationCache(prev => ({ 
        ...prev, 
        [`${fullResult.id}_${language.code}`]: fullResult 
      }));
      saveToHistory(fullResult);

      preGenerateSpeech(fullResult, language.code);

      // Pre-translate to common languages in background for near real-time switching
      const commonLangs = LANGUAGES.filter(l => ['hi', 'ta', 'te', 'mr', 'gu', 'pa', 'es', 'fr'].includes(l.code) && l.code !== language.code);
      commonLangs.forEach(async (lang) => {
        try {
          const translated = await translateResult(fullResult, lang.name);
          const finalResult = { ...translated, id: fullResult.id, timestamp: fullResult.timestamp, imageUrl: fullResult.imageUrl };
          setTranslationCache(prev => ({ ...prev, [`${fullResult.id}_${lang.code}`]: finalResult }));
          
          // Note: We no longer pre-generate speech for all languages to save quota.
          // Speech will be generated on-demand or when the user switches language.
        } catch (err) {
          console.warn(`Background pre-translation failed for ${lang.name}`, err);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onTranslate = async (newLang: typeof LANGUAGES[0]) => {
    if (!result) {
      setLanguage(newLang);
      return;
    }

    if (newLang.code === language.code) return;

    const cacheKey = `${result.id}_${newLang.code}`;

    // Check cache first for near real-time switching
    if (translationCache[cacheKey]) {
      setLanguage(newLang);
      setResult(translationCache[cacheKey]);
      return;
    }

    // Debounce rapid language switching to avoid overwhelming the API
    if (translationDebounceRef.current) {
      clearTimeout(translationDebounceRef.current);
    }

    const prevLang = language;
    setLanguage(newLang);
    
    translationDebounceRef.current = setTimeout(async () => {
      setIsTranslating(true);
      setError(null);
      
      // Track this request to avoid race conditions
      const requestId = crypto.randomUUID();
      translationRequestRef.current = requestId;

      try {
        // Use a faster translation model if needed, but gemini-3-flash-preview is already fast
        const translated = await translateResult(result, newLang.name);
        
        // Only update if this is still the most recent request
        if (translationRequestRef.current === requestId) {
          const finalResult = { ...translated, id: result.id, timestamp: result.timestamp, imageUrl: result.imageUrl };
          setResult(finalResult);
          setTranslationCache(prev => ({ ...prev, [cacheKey]: finalResult }));
          
          // Pre-generate speech for the new translation immediately to reduce latency
          preGenerateSpeech(finalResult, newLang.code);
        }
      } catch (err) {
        if (translationRequestRef.current === requestId) {
          console.error("Translation failed", err);
          setError(`Failed to translate to ${newLang.name}. Reverting to ${prevLang.name}.`);
          setLanguage(prevLang);
        }
      } finally {
        if (translationRequestRef.current === requestId) {
          setIsTranslating(false);
        }
      }
    }, 300); // 300ms debounce
  };

  const onSpeak = useCallback(async (customText?: string | React.MouseEvent | React.FocusEvent) => {
    if (!result || isSpeaking) return;
    
    // Ensure customText is a string and not an event object
    const validatedText = typeof customText === 'string' ? customText : undefined;
    
    const textToSpeak = (validatedText || `
      ${result.cropType} diagnosis: ${result.diseaseName}. 
      ${result.description}. 
      Treatment: ${result.treatment.join('. ')}. 
      Prevention: ${result.prevention.join('. ')}.
    `).trim();

    // Use a more robust cache key that includes the text itself to handle custom snippets
    const cacheKey = validatedText 
      ? `custom_${result.id}_${language.code}_${textToSpeak.slice(0, 20)}`
      : `full_${result.id}_${language.code}`;

    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    setIsSpeaking(true);
    setIsPlaying(false);
    setProgress(0);

    try {
      let pcmBase64 = speechCache[cacheKey];
      
      if (!pcmBase64) {
        setIsGeneratingAudio(true);
        pcmBase64 = await generateSpeech(String(textToSpeak));
        setIsGeneratingAudio(false);
        if (pcmBase64) {
          setSpeechCache(prev => ({ ...prev, [cacheKey]: pcmBase64 }));
        }
      }

      if (pcmBase64) {
        const url = addWavHeader(pcmBase64);
        setAudioUrl(url);
        
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.volume = volume;

        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };

        audio.ontimeupdate = () => {
          setProgress(audio.currentTime);
        };

        audio.onended = () => {
          setIsPlaying(false);
          setIsSpeaking(false);
          setProgress(0);
        };

        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setIsSpeaking(false);
          setIsPlaying(false);
          setError("Failed to play audio. Please try again.");
        };

        await audio.play();
        setIsPlaying(true);
        setIsSpeaking(false);
      } else {
        setIsSpeaking(false);
      }
    } catch (err: any) {
      setIsSpeaking(false);
      setIsGeneratingAudio(false);
      
      const errorStr = JSON.stringify(err);
      const errorMessage = err?.message || String(err);
      
      if (
        errorMessage.includes('429') || 
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorStr.includes('429') ||
        errorStr.includes('RESOURCE_EXHAUSTED')
      ) {
        setError("Speech quota exceeded. This is a limit of the free Gemini API. Please wait a minute or try again later.");
      } else {
        console.error("Speech generation failed:", err);
        setError("Speech generation failed. Please try again.");
      }
    }
  }, [result, isSpeaking, language, speechCache, audioUrl, volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlaying(false);
    setIsSpeaking(false);
    setProgress(0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setProgress(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const reset = useCallback(() => {
    setImage(null);
    setResult(null);
    setError(null);
  }, []);

  const selectFromHistory = (item: AnalysisResult) => {
    setResult(item);
    setImage(item.imageUrl || null);
    setView('dashboard');
  };

  const uniqueCrops = useMemo(() => {
    const crops = history.map(item => item.cropType);
    return ['All', ...Array.from(new Set(crops))];
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (selectedCropFilter === 'All') return history;
    return history.filter(item => item.cropType === selectedCropFilter);
  }, [history, selectedCropFilter]);

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#1A1A1A] font-sans">
      {/* Navigation */}
      <nav className="border-b border-black/5 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#2D5A27] rounded-xl flex items-center justify-center text-white">
            <Leaf size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#2D5A27]">AgriGuard AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-black/60">
          <button 
            onClick={() => setView('dashboard')}
            className={cn("flex items-center gap-2 transition-colors", view === 'dashboard' ? "text-[#2D5A27]" : "hover:text-[#2D5A27]")}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setView('history')}
            className={cn("flex items-center gap-2 transition-colors", view === 'history' ? "text-[#2D5A27]" : "hover:text-[#2D5A27]")}
          >
            <History size={18} />
            Field History
          </button>
          
          <div className="relative group">
            <button 
              disabled={isTranslating}
              className="flex items-center gap-2 hover:text-[#2D5A27] transition-colors disabled:opacity-50"
            >
              {isTranslating ? (
                <RefreshCw size={18} className="animate-spin text-[#2D5A27]" />
              ) : (
                <Globe size={18} />
              )}
              {language.name}
            </button>
            <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-black/5 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onTranslate(lang)}
                  disabled={isTranslating}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between",
                    language.code === lang.code 
                      ? "text-[#2D5A27] font-bold bg-[#2D5A27]/5" 
                      : "text-black/60 hover:bg-black/5"
                  )}
                >
                  {lang.name}
                  {language.code === lang.code && <CheckCircle2 size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button className="bg-[#2D5A27] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#1E3D1A] transition-all shadow-lg shadow-green-900/10">
          Get Started
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {view === 'dashboard' ? (
          <>
            <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column: Upload & Preview */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-display">
                  Early Detection for <span className="text-[#2D5A27]">Healthier Crops.</span>
                </h1>
                <p className="text-lg text-black/60 max-w-md">
                  Upload a leaf photo to instantly identify diseases, estimate severity, and get professional treatment plans.
                </p>
              </div>

            <div className="relative group">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              
              {isCameraOpen ? (
                <div className="relative aspect-square rounded-3xl overflow-hidden bg-black shadow-2xl">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 px-8">
                    <button 
                      onClick={stopCamera}
                      className="w-14 h-14 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
                    >
                      <CameraOff size={24} />
                    </button>
                    <button 
                      onClick={captureImage}
                      className="w-14 h-14 bg-white text-[#2D5A27] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                    >
                      <Camera size={28} />
                    </button>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : !image ? (
                <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-3xl border-2 border-dashed border-black/10 bg-white hover:border-[#2D5A27]/50 hover:bg-[#F5F9F4] transition-all cursor-pointer flex flex-col items-center justify-center p-12 text-center group"
                  >
                    <div className="w-20 h-20 bg-[#F5F9F4] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Upload className="text-[#2D5A27]" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Upload Leaf Image</h3>
                    <p className="text-black/40 text-sm max-w-[240px]">
                      Drag and drop or click to browse. Supports JPG, PNG.
                    </p>
                  </div>
                  
                  <button 
                    onClick={startCamera}
                    className="w-full bg-white border border-black/10 py-4 rounded-2xl font-bold text-lg hover:bg-[#F5F9F4] transition-all flex items-center justify-center gap-3"
                  >
                    <Camera size={24} className="text-[#2D5A27]" />
                    Use Real-time Camera
                  </button>
                </div>
              ) : (
                <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                  <img 
                    src={image} 
                    alt="Leaf preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Grad-CAM Heatmap Overlay */}
                  {result && result.affectedRegions && (
                    <div className="absolute inset-0 pointer-events-none">
                      {result.affectedRegions.map((region, i) => {
                        const [ymin, xmin, ymax, xmax] = region.box_2d;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 0.6, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                            className="absolute border-2 border-red-500 bg-red-500/20 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                            style={{
                              top: `${ymin / 10}%`,
                              left: `${xmin / 10}%`,
                              width: `${(xmax - xmin) / 10}%`,
                              height: `${(ymax - ymin) / 10}%`,
                            }}
                          >
                            <span className="absolute -top-6 left-0 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">
                              {region.label}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <RefreshCw size={20} />
                    </button>
                    <button 
                      onClick={startCamera}
                      className="bg-white text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Camera size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {image && !result && !isAnalyzing && !isTranslating && (
              <button 
                onClick={onAnalyze}
                className="w-full bg-[#2D5A27] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#1E3D1A] transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-3"
              >
                <ShieldCheck size={24} />
                Start AI Analysis
              </button>
            )}

            {(isAnalyzing || isTranslating) && (
              <div className="w-full bg-white border border-black/5 p-8 rounded-3xl shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wider text-black/40">
                    {isAnalyzing ? "AI Scanner Active" : "Translating Results"}
                  </span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 bg-[#2D5A27] rounded-full"
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: isAnalyzing ? 1.5 : 0.8 }}
                      className="h-full bg-[#2D5A27]"
                    />
                  </div>
                  <p className="text-sm italic text-black/60 text-center">
                    {isAnalyzing 
                      ? '"Detecting cellular patterns and identifying pathogen markers..."'
                      : '"Localizing diagnostic insights for your region..."'}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:sticky lg:top-32">
            <AnimatePresence mode="wait">
              {result ? (
                <ResultDisplay 
                  result={result} 
                  isSpeaking={isSpeaking} 
                  isGeneratingAudio={isGeneratingAudio}
                  onSpeak={onSpeak} 
                  reset={reset} 
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6 opacity-40">
                  <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center">
                    <Sprout size={48} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Waiting for Scan</h3>
                    <p className="text-sm max-w-[280px]">
                      Upload an image and start analysis to see detailed crop health insights here.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-white border border-black/5 rounded-3xl space-y-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Sun size={24} />
            </div>
            <h3 className="font-bold text-lg">Environmental Context</h3>
            <p className="text-sm text-black/60">Our AI considers local weather and humidity to predict disease outbreaks before they happen.</p>
          </div>
          <div className="p-8 bg-white border border-black/5 rounded-3xl space-y-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
              <Bug size={24} />
            </div>
            <h3 className="font-bold text-lg">Pest Identification</h3>
            <p className="text-sm text-black/60">Beyond diseases, we detect early signs of pest infestation and provide organic control methods.</p>
          </div>
          <div className="p-8 bg-white border border-black/5 rounded-3xl space-y-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <Thermometer size={24} />
            </div>
            <h3 className="font-bold text-lg">Soil Health Monitoring</h3>
            <p className="text-sm text-black/60">Integrate with IoT sensors to get a complete 360° view of your farm's ecosystem.</p>
          </div>
        </section>
      </>
    ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
          >
            <div className="flex justify-between items-end">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-display">
                  Field <span className="text-[#2D5A27]">History.</span>
                </h1>
                <p className="text-lg text-black/60 max-w-md">
                  Track your crop health trends and review past diagnostic reports.
                </p>
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-black/40 block">Total Scans</span>
                  <span className="text-xl font-bold">{history.length}</span>
                </div>
                <div className="w-px h-8 bg-black/5" />
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-black/40 block">Healthy Rate</span>
                  <span className="text-xl font-bold">
                    {history.length > 0 
                      ? ((history.filter(h => h.isHealthy).length / history.length) * 100).toFixed(0) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {history.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {uniqueCrops.map(crop => (
                  <button
                    key={crop}
                    onClick={() => setSelectedCropFilter(crop)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      selectedCropFilter === crop 
                        ? "bg-[#2D5A27] text-white shadow-lg shadow-green-900/20" 
                        : "bg-white border border-black/5 text-black/60 hover:border-[#2D5A27]/30"
                    )}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            )}

            {history.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-white border border-dashed border-black/10 rounded-[40px]">
                <div className="w-20 h-20 bg-[#F5F9F4] rounded-full flex items-center justify-center text-[#2D5A27]">
                  <History size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">No history yet</h3>
                  <p className="text-black/40 max-w-xs">
                    Your diagnostic reports will appear here once you start scanning your crops.
                  </p>
                </div>
                <button 
                  onClick={() => setView('dashboard')}
                  className="bg-[#2D5A27] text-white px-6 py-3 rounded-full font-bold hover:bg-[#1E3D1A] transition-all"
                >
                  Start First Scan
                </button>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-white border border-dashed border-black/10 rounded-[40px]">
                <div className="w-20 h-20 bg-[#F5F9F4] rounded-full flex items-center justify-center text-[#2D5A27]">
                  <RefreshCw size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">No results for "{selectedCropFilter}"</h3>
                  <p className="text-black/40 max-w-xs">
                    Try selecting a different crop type or clear the filter to see all scans.
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedCropFilter('All')}
                  className="text-[#2D5A27] font-bold hover:underline"
                >
                  Clear Filter
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHistory.map((item) => (
                  <motion.div 
                    key={item.id}
                    layoutId={item.id}
                    className="bg-white border border-black/5 rounded-3xl overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
                    onClick={() => selectFromHistory(item)}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.diseaseName} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className={cn(
                        "absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg",
                        item.isHealthy ? "bg-[#2D5A27]" : "bg-[#A63D40]"
                      )}>
                        {item.isHealthy ? 'Healthy' : 'Diseased'}
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{item.diseaseName}</h3>
                          <span className="text-xs text-black/40 flex items-center gap-1 mt-1">
                            <Calendar size={12} />
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFromHistory(item.id);
                          }}
                          className="p-2 text-black/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 pt-4 border-t border-black/5">
                        <div className="flex-1">
                          <span className="text-[10px] uppercase font-bold text-black/40 block mb-1">Severity</span>
                          <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full",
                                item.severity > 60 ? "bg-red-500" : 
                                item.severity > 30 ? "bg-orange-500" : 
                                "bg-[#2D5A27]"
                              )}
                              style={{ width: `${item.severity}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-black/40 block mb-1">Confidence</span>
                          <span className="text-sm font-bold">{(item.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Audio Player Overlay */}
      <AnimatePresence>
        {(audioUrl || isSpeaking) && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-black/5 p-4 flex flex-col gap-3">
              {isSpeaking && !audioUrl ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black/5" />
                      <div className="space-y-2">
                        <div className="h-2 w-20 bg-black/5 rounded" />
                        <div className="h-3 w-32 bg-black/10 rounded" />
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-black/5" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-black/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-1.5 w-full bg-black/5 rounded-full" />
                      <div className="flex justify-between">
                        <div className="h-2 w-8 bg-black/5 rounded" />
                        <div className="h-2 w-8 bg-black/5 rounded" />
                      </div>
                    </div>
                    <div className="w-20 h-4 bg-black/5 rounded-full" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2D5A27]/10 flex items-center justify-center text-[#2D5A27]">
                        <Volume2 size={20} />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-black/40 uppercase tracking-widest">Now Playing</h5>
                        <p className="text-sm font-bold text-black truncate max-w-[180px]">Diagnosis Audio</p>
                      </div>
                    </div>
                    <button 
                      onClick={stopAudio}
                      className="p-2 hover:bg-black/5 rounded-full text-black/40 hover:text-black transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-[#2D5A27] text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-[#2D5A27]/20"
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                    </button>

                    <div className="flex-1 flex flex-col gap-1">
                      <input 
                        type="range"
                        min="0"
                        max={duration || 0}
                        step="0.1"
                        value={progress}
                        onChange={handleProgressChange}
                        className="w-full h-1.5 bg-black/5 rounded-full appearance-none cursor-pointer accent-[#2D5A27]"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-black/40">
                        <span>{Math.floor(progress / 60)}:{Math.floor(progress % 60).toString().padStart(2, '0')}</span>
                        <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 group relative">
                      <div className="p-2 text-black/40">
                        {volume === 0 ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-black/5 rounded-full appearance-none cursor-pointer accent-[#2D5A27]"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t border-black/5 mt-32 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2D5A27] rounded-lg flex items-center justify-center text-white">
              <Leaf size={18} />
            </div>
            <span className="font-bold tracking-tight text-[#2D5A27]">AgriGuard AI</span>
          </div>
          <p className="text-sm text-black/40">© 2026 AgriGuard Systems. Empowering sustainable farming with AI.</p>
          <div className="flex gap-6 text-sm font-medium text-black/40">
            <a href="#" className="hover:text-black">Privacy</a>
            <a href="#" className="hover:text-black">Terms</a>
            <a href="#" className="hover:text-black">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
