'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';

interface UnratedPrompt {
  prompt_id: string;
  user_input: string;
  prompt_text: string;
  platform: string;
  created_at: string;
  brand_id: string;
  brand_profiles?: { brand_name: string; };
}

const FEEDBACK_OPTIONS = [
  { value: 'great', label: '🔥 Great', description: 'Worked perfectly' },
  { value: 'good', label: '👍 Good', description: 'Minor tweaks needed' },
  { value: 'okay', label: '😐 Okay', description: 'Usable with edits' },
  { value: 'bad', label: '👎 Bad', description: 'Major issues' },
  { value: 'terrible', label: '💀 Terrible', description: 'Unusable' },
];

const ISSUE_OPTIONS = [
  { value: 'motion', label: 'Motion Issues', description: 'Jittery, frozen, or wrong movement' },
  { value: 'lighting', label: 'Lighting Issues', description: 'Wrong mood, exposure, or color' },
  { value: 'consistency', label: 'Consistency Issues', description: 'Elements changed between frames' },
  { value: 'composition', label: 'Composition Issues', description: 'Wrong framing, angle, or layout' },
  { value: 'subject', label: 'Subject Issues', description: 'Wrong object, person, or vehicle' },
  { value: 'technical', label: 'Technical Artifacts', description: 'Glitches, distortions, AI weirdness' },
];

export default function FeedbackPage() {
  const [prompts, setPrompts] = useState<UnratedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => { fetchPrompts(); }, []);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/feedback?limit=50');
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts || []);
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (promptId: string) => {
    if (!selectedFeedback) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId,
          feedback: selectedFeedback,
          notes: notes || undefined,
          issues: selectedIssues.length > 0 ? selectedIssues : undefined,
        }),
      });
      if (response.ok) {
        setPrompts(prev => prev.filter(p => p.prompt_id !== promptId));
        setExpandedPrompt(null);
        setSelectedFeedback(null);
        setSelectedIssues([]);
        setNotes('');
        setSuccessMessage('Feedback recorded! Your brand is getting smarter.');
        setTimeout(() => setSuccessMessage(''), 3000);
        // Notify sidebar to refresh
        window.dispatchEvent(new CustomEvent('feedbackSubmitted'));
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleIssue = (issue: string) => {
    setSelectedIssues(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppLayout currentPage="feedback">
      <div className="max-w-4xl mx-auto p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#00FF87] mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>RATE YOUR RENDERS</h1>
          <p className="text-gray-400">Help Continuum learn by rating how your prompts performed. Your feedback improves future suggestions.</p>
        </div>

        {successMessage && <div className="mb-6 bg-[#00FF87]/20 border border-[#00FF87] text-[#00FF87] p-4 rounded">✓ {successMessage}</div>}

        {/* Stats Bar */}
        <div className="mb-8 bg-gray-900 border border-gray-800 p-4 rounded flex items-center justify-between">
          <div>
            <span className="text-gray-400">Prompts awaiting feedback:</span>
            <span className="ml-2 text-[#00FF87] font-bold text-xl" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{prompts.length}</span>
          </div>
          <p className="text-gray-500 text-sm">Rate prompts after rendering them in your target platform</p>
        </div>

        {/* Prompts List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading prompts...</div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">✨</span>
            <h2 className="text-xl font-bold text-white mb-2">All caught up!</h2>
            <p className="text-gray-400">No prompts awaiting feedback. Generate some prompts and render them, then come back to rate.</p>
            <a href="/generate" className="inline-block mt-6 bg-[#00FF87] text-black font-bold px-6 py-3 rounded hover:bg-[#00DD75] transition-colors" style={{ fontFamily: 'JetBrains Mono, monospace' }}>GO GENERATE</a>
          </div>
        ) : (
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div key={prompt.prompt_id} className={'bg-gray-900 border rounded transition-colors ' + (expandedPrompt === prompt.prompt_id ? 'border-[#00FF87]' : 'border-gray-800 hover:border-gray-700')}>
                {/* Collapsed View */}
                <div className="p-4 cursor-pointer" onClick={() => setExpandedPrompt(expandedPrompt === prompt.prompt_id ? null : prompt.prompt_id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">{prompt.user_input || 'Untitled prompt'}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="uppercase bg-gray-800 px-2 py-0.5 rounded text-xs">{prompt.platform}</span>
                        <span>{formatDate(prompt.created_at)}</span>
                        {prompt.brand_profiles?.brand_name && <span className="text-[#00FF87]">🔒 {prompt.brand_profiles.brand_name}</span>}
                      </div>
                    </div>
                    <span className="text-gray-500 text-xl">{expandedPrompt === prompt.prompt_id ? '▼' : '▶'}</span>
                  </div>
                </div>

                {/* Expanded View */}
                {expandedPrompt === prompt.prompt_id && (
                  <div className="border-t border-gray-800 p-4 space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Generated Prompt</label>
                      <div className="bg-black p-3 rounded border border-gray-700 max-h-32 overflow-y-auto">
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{prompt.prompt_text}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>How did it turn out?</label>
                      <div className="grid grid-cols-5 gap-2">
                        {FEEDBACK_OPTIONS.map((option) => (
                          <button key={option.value} onClick={() => setSelectedFeedback(option.value)} className={'p-3 rounded border transition-all text-center ' + (selectedFeedback === option.value ? 'border-[#00FF87] bg-[#00FF87]/20' : 'border-gray-700 hover:border-gray-600 bg-gray-800')}>
                            <span className="text-2xl block mb-1">{option.label.split(' ')[0]}</span>
                            <span className="text-xs text-gray-400">{option.label.split(' ')[1]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedFeedback && !['great', 'good'].includes(selectedFeedback) && (
                      <div>
                        <label className="block text-xs text-gray-500 uppercase mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>What went wrong? (optional)</label>
                        <div className="grid grid-cols-3 gap-2">
                          {ISSUE_OPTIONS.map((issue) => (
                            <button key={issue.value} onClick={() => toggleIssue(issue.value)} className={'p-2 rounded border text-left transition-all ' + (selectedIssues.includes(issue.value) ? 'border-[#00FF87] bg-[#00FF87]/10' : 'border-gray-700 hover:border-gray-600 bg-gray-800')}>
                              <span className="text-sm text-white block">{issue.label}</span>
                              <span className="text-xs text-gray-500">{issue.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Notes (optional)</label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional details..." className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none text-sm" rows={2} />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => handleSubmit(prompt.prompt_id)} disabled={!selectedFeedback || submitting} className={'flex-1 py-3 rounded font-bold transition-colors ' + (!selectedFeedback || submitting ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-[#00FF87] text-black hover:bg-[#00DD75]')} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {submitting ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}
                      </button>
                      <button onClick={() => { setExpandedPrompt(null); setSelectedFeedback(null); setSelectedIssues([]); setNotes(''); }} className="px-6 py-3 rounded font-bold bg-gray-800 text-white hover:bg-gray-700 border border-gray-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>CANCEL</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
