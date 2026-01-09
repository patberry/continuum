'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

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

const FEEDBACK_OPTIONS = [
  { value: 'great', label: '🔥', title: 'Great - Worked perfectly' },
  { value: 'good', label: '👍', title: 'Good - Minor tweaks needed' },
  { value: 'okay', label: '😐', title: 'Okay - Usable with edits' },
  { value: 'bad', label: '👎', title: 'Bad - Major issues' },
  { value: 'terrible', label: '💀', title: 'Terrible - Unusable' },
];

// Routes where sidebar should NOT appear
const PUBLIC_ROUTES = ['/', '/about', '/sign-in', '/sign-up', '/terms', '/privacy', '/security', '/contact'];

export default function FeedbackSidebar() {
  // ALL HOOKS MUST BE AT TOP - before any conditional returns
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [unratedPrompts, setUnratedPrompts] = useState<UnratedPrompt[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingPromptId, setRatingPromptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Check if should render
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/sign-');
  const shouldRender = isLoaded && isSignedIn && !isPublicRoute;

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

  // Don't render on public routes or when not signed in
  if (!shouldRender) {
    return null;
  }

  const count = unratedPrompts.length;

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-700 z-40 transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-16'
        }`}
      >
        {/* Toggle Button / Count Display */}
        <div 
          className="h-20 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors border-b border-gray-700"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse' : `${count} prompts to rate`}
        >
          {isExpanded ? (
            <div className="flex items-center gap-3 px-4 w-full">
              <span className="text-2xl">📊</span>
              <div className="flex-1">
                <p className="text-white font-bold text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  FEEDBACK
                </p>
                <p className="text-gray-400 text-xs">
                  {count} to rate
                </p>
              </div>
              <span className="text-gray-500">✕</span>
            </div>
          ) : (
            <div className="relative">
              <span className="text-2xl">📊</span>
              {count > 0 && (
                <span 
                  className="absolute -top-2 -right-2 bg-[#00FF87] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="h-[calc(100%-5rem)] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading...
              </div>
            ) : count === 0 ? (
              <div className="p-4 text-center">
                <span className="text-4xl mb-2 block">✨</span>
                <p className="text-gray-400 text-sm">All caught up!</p>
                <p className="text-gray-600 text-xs mt-1">No prompts awaiting feedback</p>
                <Link 
                  href="/feedback"
                  className="block mt-4 text-[#00FF87] text-xs hover:underline"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  onClick={() => setIsExpanded(false)}
                >
                  VIEW HISTORY →
                </Link>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {unratedPrompts.map((prompt) => (
                  <div 
                    key={prompt.prompt_id}
                    className="bg-gray-800 border border-gray-700 rounded p-3 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {prompt.user_input || 'Untitled prompt'}
                        </p>
                        <p className="text-gray-500 text-xs flex items-center gap-2 mt-1">
                          <span className="uppercase">{prompt.platform}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(prompt.created_at)}</span>
                        </p>
                      </div>
                    </div>

                    {ratingPromptId === prompt.prompt_id ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
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

                <Link 
                  href="/feedback"
                  className="block text-center py-3 text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  onClick={() => setIsExpanded(false)}
                >
                  VIEW ALL →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Collapsed: Quick indicators OR empty state */}
        {!isExpanded && (
          <div className="p-2 space-y-2">
            {count > 0 ? (
              <>
                {unratedPrompts.slice(0, 3).map((prompt) => (
                  <div 
                    key={prompt.prompt_id}
                    className="w-12 h-12 bg-gray-800 border border-gray-700 rounded flex items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-[#00FF87] transition-colors"
                    onClick={() => setIsExpanded(true)}
                    title={prompt.user_input || 'Click to rate'}
                  >
                    <span className="text-[#00FF87] text-xs uppercase font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {prompt.platform?.substring(0, 3)}
                    </span>
                  </div>
                ))}
                {count > 3 && (
                  <div 
                    className="w-12 h-8 flex items-center justify-center text-gray-500 text-xs cursor-pointer hover:text-[#00FF87] border border-gray-700 rounded"
                    onClick={() => setIsExpanded(true)}
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    +{count - 3}
                  </div>
                )}
              </>
            ) : (
              <div 
                className="w-12 h-12 bg-gray-800 border border-gray-700 rounded flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setIsExpanded(true)}
                title="All caught up! Click to view"
              >
                <span className="text-[#00FF87] text-lg">✓</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
