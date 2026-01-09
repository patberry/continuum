// components/BrandGuidelinesEditor.tsx
'use client';

import { useState, useEffect } from 'react';

interface Color {
  hex: string;
  name: string;
  usage: string;
}

interface Typography {
  primary: string;
  secondary: string;
  rules: string;
}

interface BrandGuidelines {
  primary_colors: Color[];
  typography: Typography;
  visual_rules: string;
  tone_keywords: string[];
  industry: string;
  guidelines_document_url: string;
}

interface Props {
  brandId: string;
  brandName: string;
  onClose: () => void;
  onSaved: () => void;
}

const INDUSTRY_OPTIONS = [
  'Automotive',
  'Technology',
  'Luxury',
  'Food & Beverage',
  'Fashion',
  'Healthcare',
  'Finance',
  'Real Estate',
  'Entertainment',
  'Sports',
  'Travel',
  'Retail',
  'B2B / Enterprise',
  'Other',
];

const TONE_SUGGESTIONS = [
  'Premium', 'Innovative', 'Trustworthy', 'Bold', 'Playful',
  'Professional', 'Friendly', 'Sophisticated', 'Technical', 'Warm',
  'Minimalist', 'Dynamic', 'Elegant', 'Modern', 'Classic',
];

export default function BrandGuidelinesEditor({ brandId, brandName, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [colors, setColors] = useState<Color[]>([]);
  const [typography, setTypography] = useState<Typography>({
    primary: '',
    secondary: '',
    rules: '',
  });
  const [visualRules, setVisualRules] = useState('');
  const [toneKeywords, setToneKeywords] = useState<string[]>([]);
  const [industry, setIndustry] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [newToneKeyword, setNewToneKeyword] = useState('');

  // Load existing guidelines
  useEffect(() => {
    fetchGuidelines();
  }, [brandId]);

  const fetchGuidelines = async () => {
    try {
      const response = await fetch(`/api/brands/${brandId}/guidelines`);
      if (response.ok) {
        const data = await response.json();
        const brand = data.brand;
        
        if (brand.primary_colors) setColors(brand.primary_colors);
        if (brand.typography) setTypography(brand.typography);
        if (brand.visual_rules) setVisualRules(brand.visual_rules);
        if (brand.tone_keywords) setToneKeywords(brand.tone_keywords);
        if (brand.industry) setIndustry(brand.industry);
        if (brand.guidelines_document_url) setDocumentUrl(brand.guidelines_document_url);
      }
    } catch (err) {
      console.error('Error fetching guidelines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/brands/${brandId}/guidelines`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_colors: colors,
          typography,
          visual_rules: visualRules,
          tone_keywords: toneKeywords,
          industry,
          guidelines_document_url: documentUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess('Guidelines saved! Your prompts will now use this brand intelligence.');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to save guidelines');
    } finally {
      setSaving(false);
    }
  };

  // Color management
  const addColor = () => {
    setColors([...colors, { hex: '#000000', name: '', usage: '' }]);
  };

  const updateColor = (index: number, field: keyof Color, value: string) => {
    const updated = [...colors];
    updated[index][field] = value;
    setColors(updated);
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  // Tone keyword management
  const addToneKeyword = (keyword: string) => {
    const trimmed = keyword.trim().toLowerCase();
    if (trimmed && !toneKeywords.includes(trimmed)) {
      setToneKeywords([...toneKeywords, trimmed]);
    }
    setNewToneKeyword('');
  };

  const removeToneKeyword = (keyword: string) => {
    setToneKeywords(toneKeywords.filter(k => k !== keyword));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded p-8 max-w-2xl w-full mx-4">
          <p className="text-gray-400 text-center">Loading guidelines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-gray-900 border border-gray-700 rounded p-6 max-w-2xl w-full mx-4 my-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#00FF87]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              BRAND GUIDELINES
            </h2>
            <p className="text-gray-400 text-sm mt-1">🔒 {brandName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-500 text-red-400 p-3 rounded text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-[#00FF87]/20 border border-[#00FF87] text-[#00FF87] p-3 rounded text-sm">
            {success}
          </div>
        )}

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          
          {/* Industry */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none"
            >
              <option value="">Select industry...</option>
              {INDUSTRY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Brand Colors
            </label>
            <div className="space-y-2">
              {colors.map((color, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => updateColor(index, 'hex', e.target.value)}
                    className="w-12 h-10 rounded border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color.hex}
                    onChange={(e) => updateColor(index, 'hex', e.target.value)}
                    placeholder="#00FF87"
                    className="w-24 bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none text-sm font-mono"
                  />
                  <input
                    type="text"
                    value={color.name}
                    onChange={(e) => updateColor(index, 'name', e.target.value)}
                    placeholder="Color name"
                    className="flex-1 bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={color.usage}
                    onChange={(e) => updateColor(index, 'usage', e.target.value)}
                    placeholder="Usage (primary, accent...)"
                    className="flex-1 bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none text-sm"
                  />
                  <button
                    onClick={() => removeColor(index)}
                    className="text-red-400 hover:text-red-300 px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={addColor}
                className="text-[#00FF87] text-sm hover:underline"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                + Add Color
              </button>
            </div>
          </div>

          {/* Typography */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Typography
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={typography.primary}
                onChange={(e) => setTypography({ ...typography, primary: e.target.value })}
                placeholder="Primary font (e.g., Helvetica Neue)"
                className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none"
              />
              <input
                type="text"
                value={typography.secondary}
                onChange={(e) => setTypography({ ...typography, secondary: e.target.value })}
                placeholder="Secondary font (optional)"
                className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none"
              />
              <input
                type="text"
                value={typography.rules}
                onChange={(e) => setTypography({ ...typography, rules: e.target.value })}
                placeholder="Typography rules (e.g., Headers bold 700, body regular)"
                className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none"
              />
            </div>
          </div>

          {/* Tone Keywords */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Brand Tone & Voice
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {toneKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="bg-[#00FF87]/20 text-[#00FF87] px-3 py-1 rounded text-sm flex items-center gap-2"
                >
                  {keyword}
                  <button
                    onClick={() => removeToneKeyword(keyword)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newToneKeyword}
                onChange={(e) => setNewToneKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addToneKeyword(newToneKeyword)}
                placeholder="Add keyword..."
                className="flex-1 bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none text-sm"
              />
              <button
                onClick={() => addToneKeyword(newToneKeyword)}
                className="px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 hover:border-[#00FF87] text-sm"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-gray-500 text-xs">Suggestions:</span>
              {TONE_SUGGESTIONS.filter(s => !toneKeywords.includes(s.toLowerCase())).slice(0, 6).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => addToneKeyword(suggestion)}
                  className="text-gray-500 text-xs hover:text-[#00FF87] hover:underline"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Rules */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Visual Rules & Restrictions
            </label>
            <textarea
              value={visualRules}
              onChange={(e) => setVisualRules(e.target.value)}
              placeholder="e.g., Always show product on white background. Never use Dutch angles. Maintain 30% negative space..."
              rows={4}
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none"
            />
          </div>

          {/* Document URL */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Brand Guidelines Document URL (Optional)
            </label>
            <input
              type="url"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none"
            />
            <p className="text-gray-500 text-xs mt-1">
              Link to your full brand guidelines PDF or page for reference
            </p>
          </div>

        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded font-bold bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 py-3 rounded font-bold transition-colors ${
              saving
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-[#00FF87] text-black hover:bg-[#00DD75]'
            }`}
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {saving ? 'SAVING...' : 'SAVE GUIDELINES'}
          </button>
        </div>

        {/* Learning indicator */}
        <div className="mt-4 bg-[#00FF87]/10 border border-[#00FF87]/30 p-3 rounded">
          <p className="text-[#00FF87] text-xs">
            🧠 These guidelines will be applied to all future prompts for this brand.
            The more detail you provide, the smarter your prompts become.
          </p>
        </div>

      </div>
    </div>
  );
}
