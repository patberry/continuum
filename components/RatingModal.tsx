'use client';

import { useState } from 'react';

interface RatingModalProps {
  isOpen: boolean;
  promptId: string;
  promptPreview: string;
  onClose: () => void;
  onLater: () => void;
  onRated: (rating: number) => void;
  isNewSession?: boolean;
}

export default function RatingModal({ 
  isOpen, 
  promptId, 
  promptPreview, 
  onClose, 
  onLater,
  onRated,
  isNewSession = false 
}: RatingModalProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (selectedRating === null) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId,
          rating: selectedRating,
          notes: feedbackNotes || null
        })
      });

      if (response.ok) {
        onRated(selectedRating);
        setSelectedRating(null);
        setFeedbackNotes('');
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratings = [
    { value: 1, label: 'Failed', emoji: '❌' },
    { value: 2, label: 'Poor', emoji: '😕' },
    { value: 3, label: 'Okay', emoji: '😐' },
    { value: 4, label: 'Good', emoji: '👍' },
    { value: 5, label: 'Perfect', emoji: '🎯' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-[#00FF87] rounded-lg p-8 max-w-lg w-full mx-4 shadow-2xl shadow-[#00FF87]/20">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🧠</div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {isNewSession ? 'Rate Your Last Prompt' : 'How Did It Turn Out?'}
          </h2>
          <p className="text-gray-400 text-sm">
            Your rating trains the AI to make better recommendations for your brand.
          </p>
        </div>

        {/* Prompt Preview */}
        <div className="bg-black/50 border border-gray-700 rounded p-3 mb-6 max-h-24 overflow-hidden">
          <p className="text-gray-300 text-sm line-clamp-3">
            {promptPreview.substring(0, 150)}...
          </p>
        </div>

        {/* ML Emphasis Box */}
        <div className="bg-[#00FF87]/10 border border-[#00FF87]/30 rounded p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <p className="text-[#00FF87] text-sm font-semibold mb-1">Machine Learning Active</p>
              <p className="text-gray-400 text-xs">
                Each rating improves platform recommendations and prompt patterns for this brand. 
                Your feedback directly shapes future suggestions.
              </p>
            </div>
          </div>
        </div>

        {/* Rating Buttons */}
        <div className="flex justify-center gap-2 mb-6">
          {ratings.map((rating) => (
            <button
              key={rating.value}
              onClick={() => setSelectedRating(rating.value)}
              className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                selectedRating === rating.value
                  ? 'bg-[#00FF87] text-black scale-110'
                  : 'bg-gray-800 text-white hover:bg-gray-700 hover:scale-105'
              }`}
            >
              <span className="text-2xl mb-1">{rating.emoji}</span>
              <span className="text-xs font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {rating.label}
              </span>
            </button>
          ))}
        </div>

        {/* Optional Notes */}
        {selectedRating !== null && (
          <div className="mb-6">
            <textarea
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              placeholder="Optional: What worked or didn't work?"
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none text-sm"
              rows={2}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {selectedRating !== null ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-[#00FF87] text-black py-3 rounded font-bold hover:bg-[#00DD75] transition-colors disabled:opacity-50"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT RATING'}
            </button>
          ) : (
            <div className="flex-1" />
          )}
          
          <button
            onClick={onLater}
            className="px-6 py-3 rounded font-bold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            LATER
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-3 rounded font-bold bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            DISMISS
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-xs mt-4">
          Ratings are stored per-brand and never shared with other users.
        </p>
      </div>
    </div>
  );
}
