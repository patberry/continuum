'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import FeedbackPrompt from './FeedbackPrompt';

interface UnratedPrompt {
  prompt_id: string;
  user_input: string;
  prompt_text: string;
  platform: string;
  created_at: string;
  brand_profiles?: {
    brand_name: string;
  };
}

// Reversed order: bad (left) to good (right)
const FEEDBACK_OPTIONS = [
  { value: 'terrible', label: '💀', title: 'Terrible - Unusable' },
  { value: 'bad', label: '👎', title: 'Bad - Major issues' },
  { value: 'okay', label: '😐', title: 'Okay - Usable with edits' },
  { value: 'good', label: '👍', title: 'Good - Minor tweaks needed' },
  { value: 'great', label: '🔥', title: 'Great - Worked perfectly' },
];

// Routes where sidebar should NOT appear
const PUBLIC_ROUTES = ['/', '/about', '/sign-in', '/sign-up', '/terms', '/privacy', '/security', '/contact'];

// Auto-collapse delay in milliseconds
const AUTO_COLLAPSE_DELAY = 30000;

export default function FeedbackSidebar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [unratedPrompts, setUnratedPrompts] = useState<UnratedPrompt[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingPromptId, setRatingPromptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal state for detailed feedback
  const [showModal, setShowModal] = useState(false);
  const [modalPrompt, setModalPrompt] = useState<UnratedPrompt | null>(null);
  
  // Auto-collapse timer
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/sign-');
  const shouldRender = isLoaded && isSignedIn && !isPublicRoute;

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, []);

  // Auto-expand when prompts load, then collapse after delay
  useEffect(() => {
    if (unratedPrompts.length > 0 && !hasAutoExpanded && !isLoading) {
      setIsExpanded(true);
      setHasAutoExpanded(true);
      
      // Set timer to auto-collapse
      collapseTimerRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, AUTO_COLLAPSE_DELAY);
    }
  }, [unratedPrompts, hasAutoExpanded, isLoading]);

  // Reset auto-expand flag when navigating to new page
  useEffect(() => {
    setHasAutoExpanded(false);
  }, [pathname]);

  // Cancel auto-collapse if user interacts
  const handleUserInteraction = () => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!shouldRender) return;
    
    fetchUnratedPrompts();
    const interval = setInterval(fetchUnratedPrompts, 60000);
    
    const handleFeedbackSubmitted = () => {
      fetchUnratedPrompts();
    };
    window.addEventListener('feedbackSubmitted', handleFeedbackSubmitted);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('feedbackSubmitted', handleFeedbackSubmitted);
    };
  }, [shouldRender]);

  const fetchUnratedPrompts = async () => {
    try {
      const response = await fetch('/api/feedback?limit=10');
      if (response.ok) {
        const data = await response.json();
        setUnratedPrompts(data.prompts || []);
      }
    } catch (error) {
      console.error('Error fetching unrated prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitFeedback = async (promptId: string, feedback: string) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, feedback }),
      });

      if (response.ok) {
        setUnratedPrompts(prev => prev.filter(p => p.prompt_id !== promptId));
        setRatingPromptId(null);
        window.dispatchEvent(new CustomEvent('feedbackSubmitted'));
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalSubmit = async (rating: string, notes: string) => {
    if (!modalPrompt) return;
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promptId: modalPrompt.prompt_id, 
          feedback: rating,
          notes 
        }),
      });

      if (response.ok) {
        setUnratedPrompts(prev => prev.filter(p => p.prompt_id !== modalPrompt.prompt_id));
        window.dispatchEvent(new CustomEvent('feedbackSubmitted'));
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
    
    setShowModal(false);
    setModalPrompt(null);
  };

  const openDetailedFeedback = (prompt: UnratedPrompt) => {
    setModalPrompt(prompt);
    setShowModal(true);
    setRatingPromptId(null);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const toggleExpanded = () => {
    handleUserInteraction();
    setIsExpanded(!isExpanded);
  };

  // Don't render if not authenticated, on public route, or no prompts to rate
  if (!shouldRender || isLoading) {
    return null;
  }

  const count = unratedPrompts.length;

  // Completely hidden when count = 0
  if (count === 0) {
    return null;
  }

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleExpanded}
        />
      )}

      {/* Sidebar Panel */}
      {isExpanded ? (
        <div 
          className="fixed left-4 top-24 w-80 bg-gray-900 border border-gray-700 rounded-lg z-50 shadow-2xl shadow-black/50 max-h-[70vh] flex flex-col"
          onClick={handleUserInteraction}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 rounded-t-lg transition-colors"
            onClick={toggleExpanded}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-white font-bold text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  FEEDBACK
                </p>
                <p className="text-gray-400 text-xs">
                  {count} prompt{count !== 1 ? 's' : ''} to rate
                </p>
              </div>
            </div>
            <span className="text-gray-500 hover:text-white transition-colors">✕</span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {unratedPrompts.map((prompt) => (
              <div 
                key={prompt.prompt_id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors"
              >
                <div className="mb-2">
                  <p className="text-white text-sm font-medium truncate">
                    {prompt.user_input || 'Untitled prompt'}
                  </p>
                  <p className="text-gray-500 text-xs flex items-center gap-2 mt-1">
                    <span className="uppercase">{prompt.platform}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(prompt.created_at)}</span>
                  </p>
                </div>

                {ratingPromptId === prompt.prompt_id ? (
                  <div className="space-y-2">
                    {/* Rating buttons - bad to good (left to right) */}
                    <div className="flex justify-between px-2">
                      {FEEDBACK_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => submitFeedback(prompt.prompt_id, option.value)}
                          disabled={submitting}
                          className="text-xl hover:scale-125 transition-transform disabled:opacity-50"
                          title={option.title}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {/* Add Notes link */}
                    <button
                      onClick={() => openDetailedFeedback(prompt)}
                      className="text-[#00FF87] text-xs hover:underline w-full text-center"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      + ADD NOTES
                    </button>
                    <button
                      onClick={() => setRatingPromptId(null)}
                      className="text-gray-500 text-xs hover:text-gray-400 w-full text-center"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRatingPromptId(prompt.prompt_id)}
                    className="w-full py-2 text-xs text-[#00FF87] border border-[#00FF87]/30 rounded hover:bg-[#00FF87]/10 transition-colors"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    RATE THIS PROMPT
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-700">
            <Link 
              href="/feedback"
              className="block text-center py-2 text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
              onClick={() => setIsExpanded(false)}
            >
              VIEW ALL HISTORY →
            </Link>
          </div>
        </div>
      ) : (
        /* Collapsed Badge */
        <div 
          className="fixed left-4 top-24 z-50 cursor-pointer group"
          onClick={toggleExpanded}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex items-center gap-2 hover:border-[#00FF87] hover:bg-gray-800 transition-all shadow-lg">
            <span className="text-xl">📊</span>
            <span 
              className="bg-[#00FF87] text-black text-xs font-bold px-2 py-0.5 rounded"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {count}
            </span>
          </div>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {count} prompt{count !== 1 ? 's' : ''} to rate
          </div>
        </div>
      )}

      {/* Detailed Feedback Modal */}
      {showModal && modalPrompt && (
        <FeedbackPrompt
          promptId={modalPrompt.prompt_id}
          promptPreview={modalPrompt.prompt_text || modalPrompt.user_input}
          platform={modalPrompt.platform}
          onSubmit={handleModalSubmit}
          onLater={() => {
            setShowModal(false);
            setModalPrompt(null);
          }}
          onDismiss={() => {
            setShowModal(false);
            setModalPrompt(null);
          }}
        />
      )}
    </>
  );
}
