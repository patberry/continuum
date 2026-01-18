'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import FeedbackPrompt from '../components/FeedbackPrompt';

// Platform configuration with character limits
const PLATFORMS = [
  // Video Platforms
  { value: 'veo3', label: 'Google Veo 3', type: 'video', charLimit: 5000 },
  { value: 'sora', label: 'Sora 2 Pro', type: 'video', charLimit: 4000 },
  { value: 'kling', label: 'Kling O1', type: 'video', charLimit: 3500 },
  { value: 'minimax', label: 'MiniMax Hailuo', type: 'video', charLimit: 3000 },
  { value: 'runway', label: 'Runway Gen-3', type: 'video', charLimit: 3500 },
  { value: 'seedance', label: 'Seedance 1.0 Pro', type: 'video', charLimit: 3000 },
  { value: 'pika', label: 'Pika', type: 'video', charLimit: 2000 },
  
  // Image Platforms
  { value: 'midjourney', label: 'Midjourney', type: 'image', charLimit: 2000 },
  { value: 'grok', label: 'Grok', type: 'image', charLimit: 3000 },
  { value: 'flux', label: 'Flux', type: 'image', charLimit: 2500 },
];

const CLIP_DURATIONS = [
  { value: '3', label: '3 seconds (social cutdown)' },
  { value: '5', label: '5 seconds (bumper/teaser)' },
  { value: '7', label: '7 seconds (standard commercial shot)' },
  { value: '10', label: '10 seconds (extended shot)' },
  { value: '15', label: '15 seconds (hero sequence)' },
];

export default function GeneratePage() {
  // Core State
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('veo3');
  const [clipDuration, setClipDuration] = useState('7');
  const [shotDescription, setShotDescription] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [platformRecommendations, setPlatformRecommendations] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Feedback State
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pendingFeedbackPrompt, setPendingFeedbackPrompt] = useState<string>('');

  // Calculate platform recommendations based on shot description
  const calculatePlatformRecommendations = (description: string) => {
    if (!description || description.length < 10) return [];
    
    const desc = description.toLowerCase();
    const recommendations = [];
    
    // Motion-heavy (automotive, action)
    if (desc.includes('car') || desc.includes('vehicle') || desc.includes('driving') || 
        desc.includes('highway') || desc.includes('motion') || desc.includes('speed')) {
      recommendations.push({ 
        platform: 'veo3', 
        confidence: 87, 
        reason: 'Best for motion-heavy automotive shots' 
      });
      recommendations.push({ 
        platform: 'kling', 
        confidence: 82, 
        reason: 'Strong motion consistency' 
      });
      recommendations.push({ 
        platform: 'sora', 
        confidence: 65, 
        reason: 'Good cinematic lighting, struggles with complex motion' 
      });
    }
    // Architectural/product/interior
    else if (desc.includes('building') || desc.includes('architecture') || 
             desc.includes('interior') || desc.includes('product') || 
             desc.includes('kitchen') || desc.includes('room')) {
      recommendations.push({ 
        platform: 'kling', 
        confidence: 89, 
        reason: 'Excellent for architectural detail' 
      });
      recommendations.push({ 
        platform: 'veo3', 
        confidence: 84, 
        reason: 'Strong consistency' 
      });
      recommendations.push({ 
        platform: 'sora', 
        confidence: 78, 
        reason: 'Beautiful lighting' 
      });
    }
    // Cinematic/atmospheric
    else if (desc.includes('cinematic') || desc.includes('dramatic') || 
             desc.includes('sunset') || desc.includes('golden hour') ||
             desc.includes('atmosphere') || desc.includes('lighting')) {
      recommendations.push({ 
        platform: 'sora', 
        confidence: 91, 
        reason: 'Best cinematic lighting and atmosphere' 
      });
      recommendations.push({ 
        platform: 'veo3', 
        confidence: 79, 
        reason: 'Good consistency' 
      });
      recommendations.push({ 
        platform: 'kling', 
        confidence: 74, 
        reason: 'Solid all-around performance' 
      });
    }
    // Default recommendations
    else {
      recommendations.push({ 
        platform: 'veo3', 
        confidence: 85, 
        reason: 'Most versatile all-around platform' 
      });
      recommendations.push({ 
        platform: 'kling', 
        confidence: 80, 
        reason: 'Strong general performance' 
      });
      recommendations.push({ 
        platform: 'sora', 
        confidence: 72, 
        reason: 'Good for cinematic shots' 
      });
    }
    
    return recommendations.slice(0, 3);
  };

  // Update recommendations when description changes
  useEffect(() => {
    if (shotDescription && shotDescription.length > 10) {
      const recs = calculatePlatformRecommendations(shotDescription);
      setPlatformRecommendations(recs);
      // Auto-select top recommendation
      if (recs.length > 0) {
        setSelectedPlatform(recs[0].platform);
      }
    } else {
      setPlatformRecommendations([]);
    }
  }, [shotDescription]);

  // Load brands
  useEffect(() => {
    fetchBrands();
  }, []);

  // Load credits from API
  useEffect(() => {
    fetchCredits();
  }, []);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands');
      const data = await response.json();
      
      // Handle both response formats: { brands: [] } or []
      const brandsArray = data.brands || data;
      
      if (Array.isArray(brandsArray)) {
        setBrands(brandsArray);
        if (brandsArray.length > 0) {
          setSelectedBrand(brandsArray[0].brand_id);
        }
      } else {
        console.error('Brands API did not return an array:', data);
        setBrands([]);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      if (data.credits) {
        setCredits(data.credits.total);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedBrand || !shotDescription.trim()) {
      setError('Please select a brand and describe the shot');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccessMessage('');
    setShowFeedback(false);
    setCurrentPromptId(null);

    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrand,
          platform: selectedPlatform,
          clipDuration,
          shotDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      setGeneratedPrompt(data.prompt);
      setLastGeneratedPrompt(data.prompt);
      
      // Capture prompt ID for feedback
      if (data.promptId) {
        setCurrentPromptId(data.promptId);
        console.log('Prompt ID captured for feedback:', data.promptId);
      } else {
        console.warn('No promptId returned from API - feedback will not work');
      }
      
      setCredits(prev => prev !== null ? prev - 10 : prev);
      setSuccessMessage('Prompt generated! (10 tokens)');

    } catch (error: any) {
      console.error('Generation error:', error);
      setError(error.message || 'Failed to generate prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinePrompt = async () => {
    if (!lastGeneratedPrompt) {
      setError('No prompt to refine. Generate a prompt first.');
      return;
    }

    setIsRefining(true);
    setError('');
    setSuccessMessage('');
    setShowFeedback(false);

    try {
      const response = await fetch('/api/refine-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: lastGeneratedPrompt,
          brandId: selectedBrand,
          platform: selectedPlatform,
          userFeedback: shotDescription,
        }),
      });

      if (!response.ok) throw new Error('Refinement failed');

      const data = await response.json();
      setGeneratedPrompt(data.refinedPrompt);
      setLastGeneratedPrompt(data.refinedPrompt);
      
      // Capture new promptId if returned
      if (data.promptId) {
        setCurrentPromptId(data.promptId);
      }
      
      setCredits(prev => prev !== null ? prev - 2 : prev);
      setSuccessMessage('Prompt refined! (2 tokens)');

    } catch (error) {
      console.error('Refinement error:', error);
      setError('Failed to refine prompt');
    } finally {
      setIsRefining(false);
    }
  };

  // ============================================
  // COPY TO CLIPBOARD - TRIGGERS FEEDBACK UI
  // ============================================
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setSuccessMessage('Copied to clipboard!');
    setTimeout(() => setSuccessMessage(''), 2000);
    
    // Trigger feedback prompt after a short delay
    if (currentPromptId) {
      setPendingFeedbackPrompt(generatedPrompt);
      setTimeout(() => {
        setShowFeedback(true);
      }, 1500);
    }
  };

  // ============================================
  // FEEDBACK HANDLERS
  // ============================================
  const handleFeedbackSubmit = async (rating: string, notes: string) => {
    if (!currentPromptId) return;
    
    try {
      const response = await fetch('/api/prompt-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId: currentPromptId,
          rating,
          notes,
        }),
      });
      
      if (response.ok) {
        setSuccessMessage('Thanks! Your feedback helps improve future prompts.');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
    }
    
    setShowFeedback(false);
    setCurrentPromptId(null);
  };

  const handleFeedbackLater = () => {
    setShowFeedback(false);
  };

  const handleFeedbackDismiss = () => {
    setShowFeedback(false);
    setCurrentPromptId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeMultiplier = () => {
    if (sessionTime < 600) return '1x';
    if (sessionTime < 1200) return '1.5x';
    return '2x';
  };

  // Character limit warning
  const getCharacterWarning = () => {
    const currentPlatform = PLATFORMS.find(p => p.value === selectedPlatform);
    if (!currentPlatform) return null;

    const estimatedLength = shotDescription.length * 3; // Rough estimate of final prompt
    const limit = currentPlatform.charLimit;
    const percentage = (estimatedLength / limit) * 100;

    if (percentage > 100) {
      return {
        color: 'text-red-400',
        icon: '⚠️',
        message: `May exceed ${currentPlatform.label} limit (${limit} chars)`
      };
    } else if (percentage > 80) {
      return {
        color: 'text-yellow-400',
        icon: '⚠',
        message: `Approaching ${currentPlatform.label} limit (${limit} chars)`
      };
    }
    return null;
  };

  const charWarning = getCharacterWarning();

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 px-8 py-5 flex justify-between items-center z-50">
        <a href="/generate">
          <img 
            src="/continuum-logo.png" 
            alt="Continuum" 
            className="h-10 cursor-pointer hover:opacity-80 transition-opacity"
          />
        </a>
        <nav className="flex items-center gap-6">
          <a 
            href="/generate" 
            className="text-[#00FF87] font-semibold text-sm transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Generate
          </a>
          <a 
            href="/dashboard/brands" 
            className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Brands
          </a>
          <a 
            href="/guide" 
            className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Guide
          </a>
          <a 
            href="/about" 
            className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            About
          </a>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </header>

      {/* Main Content - with top padding for fixed header */}
      <div className="max-w-6xl mx-auto p-8 pt-24">

        {/* Credits & Timer */}
        <div className="bg-gray-900 border border-gray-700 rounded p-6 mb-8 flex justify-between items-center">
          <div className="flex items-center gap-3 group relative cursor-help">
            <span className="text-3xl">⚡</span>
            <span className="text-[#00FF87] text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {credits !== null ? credits : '...'}
            </span>
            
            {/* Tooltip on hover */}
            <div className="hidden group-hover:block absolute top-12 left-0 bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded text-sm whitespace-nowrap z-10 shadow-lg">
              {credits !== null ? `${credits} tokens available` : 'Loading...'}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Session Time: </span>
            <span className="text-white text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {formatTime(sessionTime)}
            </span>
            <span className="text-gray-500 text-sm ml-2">({getTimeMultiplier()})</span>
          </div>
        </div>

        {/* Main Form */}
        <div className="space-y-6">
          
          {/* Brand Selection */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Select Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none"
            >
              {brands.length === 0 ? (
                <option value="">Loading brands...</option>
              ) : (
                brands.map((brand: any) => (
                  <option key={brand.brand_id} value={brand.brand_id}>
                    🔒 {brand.brand_name}
                  </option>
                ))
              )}
            </select>
            {brands.length === 0 && (
              <p className="text-yellow-400 text-xs mt-2">
                No brands found. <a href="/dashboard/brands" className="underline">Create a brand first</a>
              </p>
            )}
          </div>

          {/* Shot Description */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              What shot do you need?
            </label>
            <textarea
              value={shotDescription}
              onChange={(e) => setShotDescription(e.target.value)}
              placeholder="S type vehicle passes many cars on Pacific Coast Highway"
              className="w-full bg-gray-800 text-white p-4 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none min-h-[120px]"
              rows={4}
            />
            
            {/* Character Count & Warning */}
            {shotDescription && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-400 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {shotDescription.length} characters
                </span>
                {charWarning && (
                  <span className={`${charWarning.color} text-xs font-bold`}>
                    {charWarning.icon} {charWarning.message}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Platform Recommendations */}
          {platformRecommendations.length > 0 && (
            <div className="bg-[#00FF87]/10 border border-[#00FF87] rounded p-4">
              <h3 className="text-white font-semibold mb-3 text-sm uppercase" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                🎯 Recommended Platforms
              </h3>
              <div className="space-y-2">
                {platformRecommendations.map((rec, idx) => (
                  <div 
                    key={rec.platform}
                    className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
                      selectedPlatform === rec.platform 
                        ? 'bg-[#00FF87]/20 border-2 border-[#00FF87]' 
                        : 'bg-white/5 hover:bg-white/10 border border-gray-700'
                    }`}
                    onClick={() => setSelectedPlatform(rec.platform)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">
                          {PLATFORMS.find(p => p.value === rec.platform)?.label}
                        </span>
                        <span className="text-[#00FF87] font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {rec.confidence}%
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">{rec.reason}</p>
                    </div>
                    {idx === 0 && (
                      <span className="text-xs bg-[#00FF87] text-black px-2 py-1 rounded font-bold ml-3">
                        TOP PICK
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-3 italic">
                Agent confidence based on shot type and brand history
              </p>
            </div>
          )}

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Target Platform
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none"
            >
              <optgroup label="Video Platforms">
                {PLATFORMS.filter(p => p.type === 'video').map(platform => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Image Platforms">
                {PLATFORMS.filter(p => p.type === 'image').map(platform => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Clip Duration */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Clip Duration
            </label>
            <select
              value={clipDuration}
              onChange={(e) => setClipDuration(e.target.value)}
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none"
            >
              {CLIP_DURATIONS.map(duration => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-[#00FF87]/20 border border-[#00FF87] text-[#00FF87] p-4 rounded">
              {successMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedBrand || !shotDescription.trim()}
              className={`flex-1 py-4 rounded font-bold text-lg transition-colors flex items-center justify-center gap-2 ${
                isGenerating || !selectedBrand || !shotDescription.trim()
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-[#00FF87] text-black hover:bg-[#00DD75]'
              }`}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {isGenerating && (
                <svg 
                  className="animate-spin h-5 w-5" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {isGenerating ? 'GENERATING...' : 'GENERATE PROMPT (10 tokens)'}
            </button>

            <button
              onClick={handleRefinePrompt}
              disabled={!lastGeneratedPrompt || isRefining}
              className={`px-6 py-4 rounded font-bold transition-colors flex items-center gap-2 ${
                !lastGeneratedPrompt || isRefining
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-600'
              }`}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {isRefining && (
                <svg 
                  className="animate-spin h-5 w-5" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {isRefining ? 'REFINING...' : 'REFINE PROMPT (2 tokens)'}
            </button>
          </div>

          {/* Generated Prompt Output */}
          {generatedPrompt && (
            <div className="bg-gray-900 border border-[#00FF87] rounded p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[#00FF87] font-bold text-sm uppercase" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Generated Prompt
                </h3>
                <button
                  onClick={copyToClipboard}
                  className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 border border-gray-600"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  📋 COPY
                </button>
              </div>
              <div className="bg-black p-4 rounded border border-gray-700">
                <p className="text-white leading-relaxed whitespace-pre-wrap">
                  {generatedPrompt}
                </p>
              </div>
              <div className="mt-4 bg-[#00FF87]/10 border border-[#00FF87]/30 p-3 rounded">
                <p className="text-[#00FF87] text-sm">
                  ✓ Agent learning activated. Copy prompt and rate results to make future prompts smarter.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Feedback Modal */}
      {showFeedback && currentPromptId && (
        <FeedbackPrompt
          promptId={currentPromptId}
          promptPreview={pendingFeedbackPrompt}
          platform={selectedPlatform}
          onSubmit={handleFeedbackSubmit}
          onLater={handleFeedbackLater}
          onDismiss={handleFeedbackDismiss}
        />
      )}
    </div>
  );
}
