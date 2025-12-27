'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

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

export default function GeneratePage() {
  const { user } = useUser();
  
  // State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [userInput, setUserInput] = useState('');
  const [duration, setDuration] = useState<number>(7);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  	platform: 'veo3',
 	duration: duration
	})
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await res.json();
      setGeneratedPrompt(data.prompt.text);
      
      // Refresh credit balance
      fetchCreditBalance();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
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

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            CONTINUUM
          </h1>
          <p className="text-gray-400">Gen AI Brand Intelligence</p>
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-900 border border-gray-800 p-4 mb-8 rounded">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-400 text-sm">Credits Available:</span>
              <span className="ml-2 text-2xl font-bold" style={{ color: '#00FF87' }}>
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
                <span className="ml-2 text-xl font-mono">
                  {formatTime(sessionTime)}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({getTimeMultiplier()}x)
                </span>
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

        {/* Output */}
        {generatedPrompt && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-300">
                Generated Prompt ({duration}s clip)
              </label>
              <button
                onClick={copyToClipboard}
                className="text-sm text-[#00FF87] hover:text-[#00DD75]"
              >
                Copy to Clipboard
              </button>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono">
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
