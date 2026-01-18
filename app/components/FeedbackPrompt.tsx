'use client';

import { useState } from 'react';

interface FeedbackPromptProps {
  promptId: string;
  promptPreview: string;
  platform: string;
  onSubmit: (rating: string, notes: string) => Promise<void>;
  onLater: () => void;
  onDismiss: () => void;
}

const RATINGS = [
  { value: 'failed', label: 'Failed', emoji: '✕', color: 'text-red-400', bgHover: 'hover:bg-red-500/20', bgActive: 'bg-red-500/30 border-red-400' },
  { value: 'poor', label: 'Poor', emoji: '😟', color: 'text-orange-400', bgHover: 'hover:bg-orange-500/20', bgActive: 'bg-orange-500/30 border-orange-400' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: 'text-yellow-400', bgHover: 'hover:bg-yellow-500/20', bgActive: 'bg-yellow-500/30 border-yellow-400' },
  { value: 'good', label: 'Good', emoji: '👍', color: 'text-lime-400', bgHover: 'hover:bg-lime-500/20', bgActive: 'bg-lime-500/30 border-lime-400' },
  { value: 'perfect', label: 'Perfect', emoji: '🎯', color: 'text-[#00FF87]', bgHover: 'hover:bg-[#00FF87]/20', bgActive: 'bg-[#00FF87]/30 border-[#00FF87]' },
];

export default function FeedbackPrompt({
  promptId,
  promptPreview,
  platform,
  onSubmit,
  onLater,
  onDismiss,
}: FeedbackPromptProps) {
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRating) return;
    setIsSubmitting(true);
    try {
      await onSubmit(selectedRating, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Truncate preview to ~150 chars
  const truncatedPreview = promptPreview.length > 150 
    ? promptPreview.substring(0, 150) + '...' 
    : promptPreview;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🧠</div>
          <h2 
            className="text-xl font-bold text-white mb-2"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Rate Your Last Prompt
          </h2>
          <p className="text-gray-400 text-sm">
            Your rating trains the AI to make better recommendations for your brand.
          </p>
        </div>

        {/* Prompt Preview */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <p className="text-gray-300 text-sm leading-relaxed">
            {truncatedPreview}
          </p>
        </div>

        {/* Machine Learning Active Banner */}
        <div className="bg-[#00FF87]/10 border border-[#00FF87]/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="text-[#00FF87] font-semibold text-sm mb-1">
                Machine Learning Active
              </h3>
              <p className="text-gray-400 text-xs">
                Each rating improves platform recommendations and prompt patterns for this brand. 
                Your feedback directly shapes future suggestions.
              </p>
            </div>
          </div>
        </div>

        {/* Rating Buttons */}
        <div className="flex justify-center gap-2 mb-4">
          {RATINGS.map((rating) => (
            <button
              key={rating.value}
              onClick={() => setSelectedRating(rating.value)}
              className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                selectedRating === rating.value
                  ? `${rating.bgActive} border-2`
                  : `border-gray-700 ${rating.bgHover}`
              }`}
            >
              <span className={`text-2xl mb-1 ${rating.color}`}>
                {rating.emoji}
              </span>
              <span 
                className={`text-xs font-medium ${
                  selectedRating === rating.value ? rating.color : 'text-gray-400'
                }`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {rating.label}
              </span>
            </button>
          ))}
        </div>

        {/* Notes Text Area */}
        <div className="mb-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What worked well? What could be improved? (optional)"
            className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-[#00FF87] focus:outline-none text-sm resize-none"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleSubmit}
            disabled={!selectedRating || isSubmitting}
            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${
              selectedRating && !isSubmitting
                ? 'bg-[#00FF87] text-black hover:bg-[#00DD75]'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT RATING'}
          </button>
          <button
            onClick={onLater}
            className="px-6 py-3 rounded-lg font-bold text-sm bg-gray-800 text-white hover:bg-gray-700 border border-gray-600 transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            LATER
          </button>
          <button
            onClick={onDismiss}
            className="px-6 py-3 rounded-lg font-bold text-sm text-gray-500 hover:text-gray-300 transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            DISMISS
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-gray-600 text-xs">
          Ratings are stored per-brand and never shared with other users.
        </p>
      </div>
    </div>
  );
}
