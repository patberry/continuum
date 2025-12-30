'use client';

import { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';

interface Brand {
  brand_id: string;
  brand_name: string;
  brand_description: string | null;
}

interface Session {
  id: string;
  brand_id: string;
  created_at: string;
}

interface PlatformPrediction {
  recommendedPlatform: string;
  confidence: number;
  rationale: string;
  alternatives: { platform: string; confidence: number; note: string }[];
  warnings: string[];
  factors?: {
    shotTypeMatch: number;
    durationFit: number;
    cameraRequirement: number;
    platformStrength: number;
  };
}

interface PredictionDisplayProps {
  prediction: PlatformPrediction;
  selectedPlatform: string;
}

function PredictionDisplay({ prediction, selectedPlatform }: PredictionDisplayProps) {
  const isUsingRecommended = selectedPlatform.toLowerCase() === prediction.recommendedPlatform.toLowerCase();
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#00FF87'; // Green - high confidence
    if (confidence >= 60) return '#FFD700'; // Yellow - moderate
    return '#FF6B6B'; // Red - low confidence
  };
  
  return (
    <div className="bg-black/50 border border-[#00FF87]/30 p-6 rounded mb-6">
      <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        Platform Recommendation
      </h3>
      
      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-2xl font-bold" style={{ color: getConfidenceColor(prediction.confidence), fontFamily: 'JetBrains Mono, monospace' }}>
            {prediction.confidence}%
          </span>
          <span className="text-lg">
            Recommended: <strong className="text-[#00FF87]">{prediction.recommendedPlatform.toUpperCase()}</strong>
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-500"
            style={{ 
              width: `${prediction.confidence}%`,
              backgroundColor: getConfidenceColor(prediction.confidence)
            }}
          />
        </div>
      </div>
      
      {/* Rationale */}
      <p className="text-gray-300 mb-4">{prediction.rationale}</p>
      
      {/* Alternatives */}
      {prediction.alternatives && prediction.alternatives.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Alternatives:</p>
          {prediction.alternatives.map((alt, i) => (
            <div key={i} className="text-sm text-gray-400 ml-4">
              • {alt.platform} ({alt.confidence}%) - {alt.note}
            </div>
          ))}
        </div>
      )}
      
      {/* Warnings */}
      {prediction.warnings && prediction.warnings.length > 0 && (
        <div className="border-t border-gray-700 pt-4 mt-4">
          {prediction.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 text-yellow-500 text-sm">
              <span>⚠️</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Platform mismatch warning */}
      {!isUsingRecommended && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
          <p className="text-yellow-500 text-sm">
            You selected <strong>{selectedPlatform}</strong>. 
            Consider switching to <strong>{prediction.recommendedPlatform}</strong> for higher success probability.
          </p>
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  const { user } = useUser();
  
  // State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('veo3');
  const [userInput, setUserInput] = useState('');
  const [duration, setDuration] = useState<number>(7);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [prediction, setPrediction] = useState<PlatformPrediction | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load brands on mount
  useEffect(() => {
    if (user) {
      console.log('User loaded, fetching data...');
      fetchBrands();
      fetchCreditBalance();
    }
  }, [user]);

  // Session timer
  useEffect(() => {
    if (session) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(session.created_at).getTime()) / 1000);
        setSessionTime(elapsed);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [session]);

  const fetchBrands = async () => {
    try {
      console.log('Fetching brands...');
      const res = await fetch('/api/brands');
      console.log('Brands response:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Brands data:', data);
        setBrands(data.brands || []);
      }
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const fetchCreditBalance = async () => {
    try {
      console.log('Fetching credit balance...');
      const res = await fetch('/api/credits/balance');
      console.log('Credits response:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Credits data:', data);
        setCreditBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  };

  const addTestCredits = async () => {
    try {
      const res = await fetch('/api/credits/add-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50 })
      });
      
      if (res.ok) {
        await fetchCreditBalance();
        alert('Added 50 test credits!');
      }
    } catch (err) {
      console.error('Failed to add test credits:', err);
    }
  };

  const createSession = async () => {
    if (!selectedBrand) return null;
    
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: selectedBrand })
      });
      
      if (res.ok) {
        const data = await res.json();
        return data.session;
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    }
    return null;
  };

  const handleGenerate = async () => {
    if (!selectedBrand || !userInput.trim()) {
      setError('Please select a brand and describe your shot');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Create session if first generation
      let activeSession = session;
      if (!activeSession) {
        activeSession = await createSession();
        if (activeSession) {
          setSession(activeSession);
        } else {
          throw new Error('Failed to create session');
        }
      }

      // Generate prompt
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrand,
          sessionId: activeSession.id,
          userInput: userInput,
          platform: selectedPlatform,
          duration: duration
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await res.json();
      setGeneratedPrompt(data.prompt.text);
      
      // Set prediction if available
      if (data.prediction) {
        setPrediction(data.prediction);
      }
      
      // Refresh credit balance
      fetchCreditBalance();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCreditCost = () => {
    if (!session) return 10;
    return 2;
  };

  const getTimeMultiplier = () => {
    if (!session) return 1;
    const minutes = sessionTime / 60;
    if (minutes < 10) return 1;
    if (minutes < 20) return 1.5;
    return 2;
  };

  const getTotalCost = () => {
    return Math.floor(getCreditCost() * getTimeMultiplier());
  };

  const getTimerWarning = () => {
    if (!session) return null;
    const minutes = sessionTime / 60;
    if (minutes >= 20) return '⚠️ 2x multiplier active';
    if (minutes >= 10) return '⚠️ 1.5x multiplier active';
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with UserButton */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF87' }}>
              CONTINUUM
            </h1>
            <p className="text-white">GenAI Brand Intelligence</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-900 border border-gray-800 p-4 mb-8 rounded">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-400 text-sm">Credits Available:</span>
              <span className="ml-2 text-2xl font-bold" style={{ color: '#00FF87', fontFamily: 'JetBrains Mono, monospace' }}>
                {creditBalance ?? '...'}
              </span>
              <button
                onClick={addTestCredits}
                className="ml-4 text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded hover:bg-gray-700"
              >
                +50 Test Credits
              </button>
            </div>
            {session && (
              <div>
                <span className="text-gray-400 text-sm">Session Time:</span>
                <span className="ml-2 text-xl" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {formatTime(sessionTime)}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({getTimeMultiplier()}x)
                </span>
                {getTimerWarning() && (
                  <span className="ml-2 text-xs text-yellow-500">
                    {getTimerWarning()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Brand Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Select Brand
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-[#00FF87] focus:outline-none"
          >
            <option value="">Choose a brand...</option>
            {brands.map((brand) => (
              <option key={brand.brand_id} value={brand.brand_id}>
                🔒 {brand.brand_name}
              </option>
            ))}
          </select>
          {brands.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No brands found. Create a brand first.
            </p>
          )}
        </div>

        {/* Platform Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Target Platform
          </label>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-[#00FF87] focus:outline-none"
          >
            <option value="veo3">Google Veo 3</option>
            <option value="sora">OpenAI Sora</option>
            <option value="kling">Kling AI</option>
            <option value="minimax">MiniMax Hailuo</option>
            <option value="runway">Runway Gen-3</option>
            <option value="pika">Pika</option>
            <option value="luma">Luma Dream Machine</option>
          </select>
        </div>

        {/* Duration Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Clip Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-[#00FF87] focus:outline-none"
          >
            <option value={3}>3 seconds (quick reveal/cutaway)</option>
            <option value={7}>7 seconds (standard commercial shot)</option>
            <option value={10}>10 seconds (medium sequence)</option>
            <option value={15}>15 seconds (long establishing shot)</option>
          </select>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            What shot do you need?
          </label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe the shot you want to create..."
            className="w-full bg-gray-900 border border-gray-700 rounded p-4 text-white h-32 focus:border-[#00FF87] focus:outline-none resize-none"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedBrand || !userInput.trim()}
          className="w-full bg-[#00FF87] text-black font-bold py-4 rounded hover:bg-[#00DD75] disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {isGenerating ? (
            'GENERATING...'
          ) : (
            `GENERATE PROMPT (${getTotalCost()} credits)`
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-900 border border-red-700 text-red-200 p-4 rounded">
            {error}
          </div>
        )}

        {/* Prediction Display */}
        {generatedPrompt && prediction && (
          <div className="mt-8">
            <PredictionDisplay 
              prediction={prediction} 
              selectedPlatform={selectedPlatform}
            />
          </div>
        )}

        {/* Output */}
        {generatedPrompt && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-300">
                Generated Prompt ({duration}s clip)
              </label>
              <button
                onClick={copyToClipboard}
                className="text-sm px-4 py-2 rounded transition-colors"
                style={{
                  backgroundColor: copied ? '#00FF87' : 'transparent',
                  color: copied ? '#000' : '#00FF87',
                  border: `1px solid #00FF87`
                }}
              >
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-200" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {generatedPrompt}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setUserInput('')}
                className="flex-1 bg-gray-800 border border-gray-700 text-white py-3 rounded hover:bg-gray-700"
              >
                Refine Prompt
              </button>
              <button
                onClick={() => {
                  setGeneratedPrompt('');
                  setUserInput('');
                  setSession(null);
                  setSessionTime(0);
                  setPrediction(null);
                }}
                className="flex-1 bg-gray-800 border border-gray-700 text-white py-3 rounded hover:bg-gray-700"
              >
                Start New Session
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
