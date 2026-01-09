import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Platform configuration
const VALID_PLATFORMS = [
  'veo3', 'sora', 'kling', 'minimax', 'runway', 'seedance', 'pika', 'freepik',
  'midjourney', 'grok', 'flux'
];

const VIDEO_PLATFORMS = ['veo3', 'sora', 'kling', 'minimax', 'runway', 'seedance', 'pika', 'freepik'];

const PLATFORM_LIMITS: Record<string, number> = {
  'veo3': 5000,
  'sora': 4000,
  'kling': 3500,
  'minimax': 3000,
  'runway': 3500,
  'seedance': 3000,
  'pika': 2000,
  'freepik': 2500,
  'midjourney': 2000,
  'grok': 3000,
  'flux': 2500,
};

// Credit costs
const NEW_SESSION_CREDITS = 10;
const ITERATION_CREDITS = 2;

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      brandId, 
      platform, 
      clipDuration, 
      shotDescription,
      sessionId 
    } = await request.json();

    // Validation
    if (!brandId || !platform || !shotDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: brandId, platform, shotDescription' },
        { status: 400 }
      );
    }

    const platformLower = platform.toLowerCase();
    if (!VALID_PLATFORMS.includes(platformLower)) {
      return NextResponse.json(
        { error: `Invalid platform. Supported: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      );
    }

    const isVideo = VIDEO_PLATFORMS.includes(platformLower);

    // ============================================
    // 1. FETCH BRAND PROFILE (including guidelines)
    // ============================================
    const { data: brand, error: brandError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('brand_id', brandId)
      .eq('user_id', userId)
      .single();

    if (brandError || !brand) {
      console.error('Brand fetch error:', brandError);
      return NextResponse.json(
        { error: 'Brand not found or access denied' },
        { status: 404 }
      );
    }

    // ============================================
    // 2. FETCH PROMPT HISTORY FOR THIS BRAND
    // ============================================
    const { data: promptHistory } = await supabase
      .from('prompts')
      .select('user_input, prompt_text, platform, user_feedback, shot_type, clip_duration, created_at')
      .eq('brand_id', brandId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // ============================================
    // 3. FETCH STORED BRAND INTELLIGENCE
    // ============================================
    const { data: storedIntelligence } = await supabase
      .from('brand_intelligence')
      .select('intelligence_type, learned_value, confidence_score, occurrences')
      .eq('brand_id', brandId)
      .gte('confidence_score', 0.5)
      .order('confidence_score', { ascending: false });

    // ============================================
    // 4. ANALYZE PATTERNS FROM HISTORY
    // ============================================
    const patterns = analyzePatterns(promptHistory || []);

    // ============================================
    // 5. HANDLE SESSION
    // ============================================
    let currentSessionId = sessionId;
    let isNewSession = !sessionId;
    let creditsToCharge = isNewSession ? NEW_SESSION_CREDITS : ITERATION_CREDITS;

    if (isNewSession) {
      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          brand_id: brandId,
          session_start: new Date().toISOString(),
          status: 'active',
          total_credits_used: 0
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      currentSessionId = newSession.session_id;
    }

    // ============================================
    // 6. CHECK CREDIT BALANCE
    // ============================================
    const { data: creditBalance } = await supabase
      .from('credit_balances')
      .select('monthly_credits, topup_credits')
      .eq('user_id', userId)
      .single();

    const availableCredits = (creditBalance?.monthly_credits || 0) + (creditBalance?.topup_credits || 0);
    if (availableCredits < creditsToCharge) {
      return NextResponse.json(
        { error: 'Insufficient credits', availableCredits, required: creditsToCharge },
        { status: 402 }
      );
    }

    // ============================================
    // 7. BUILD SYSTEM PROMPT WITH FULL CONTEXT
    // ============================================
    const systemPrompt = buildSystemPrompt({
      platform: platformLower,
      isVideo,
      clipDuration,
      brand,
      promptHistory: promptHistory || [],
      storedIntelligence: storedIntelligence || [],
      patterns
    });

    // ============================================
    // 8. BUILD USER MESSAGE
    // ============================================
    const userMessage = buildUserMessage({
      brand,
      shotDescription,
      platform: platformLower,
      clipDuration,
      isVideo,
      patterns
    });

    // ============================================
    // 9. CALL CLAUDE API
    // ============================================
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        messages: [{ role: 'user', content: userMessage }],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error('Claude API failed');
    }

    const data = await response.json();
    let generatedPrompt = data.content[0].text;

    // ============================================
    // 10. PARSE RESPONSE (extract suggestions)
    // ============================================
    const { prompt: cleanPrompt, suggestions, appliedPatterns } = parseClaudeResponse(generatedPrompt);
    generatedPrompt = cleanPrompt;

    // ============================================
    // 11. ENFORCE CHARACTER LIMITS
    // ============================================
    const limit = PLATFORM_LIMITS[platformLower];
    const warnings: string[] = [];

    if (limit && generatedPrompt.length > limit) {
      const truncated = generatedPrompt.substring(0, limit);
      const lastPeriod = truncated.lastIndexOf('.');
      generatedPrompt = lastPeriod > 0 ? truncated.substring(0, lastPeriod + 1) : truncated;
      warnings.push(`Prompt truncated to ${limit} characters for ${platform}`);
    }

    // ============================================
    // 12. STORE PROMPT IN DATABASE
    // ============================================
    const { data: savedPrompt, error: promptSaveError } = await supabase
      .from('prompts')
      .insert({
        session_id: currentSessionId,
        brand_id: brandId,
        user_id: userId,
        prompt_text: generatedPrompt,
        user_input: shotDescription,
        platform: platformLower,
        output_type: isVideo ? 'video' : 'image',
        clip_duration: isVideo ? (parseInt(clipDuration) || null) : null,
        credits_used: creditsToCharge,
        metadata: {
          patterns_applied: appliedPatterns,
          suggestions: suggestions,
          guidelines_used: !!brand.guidelines_source
        }
      })
      .select()
      .single();

    if (promptSaveError) {
      console.error('Failed to save prompt:', promptSaveError);
    }

    // ============================================
    // 13. UPDATE BRAND INTELLIGENCE
    // ============================================
    await updateBrandIntelligence(brandId, patterns, shotDescription, platformLower);

    // ============================================
    // 14. DEDUCT CREDITS
    // ============================================
    await deductCredits(userId, creditsToCharge, currentSessionId, savedPrompt?.prompt_id);

    // ============================================
    // 15. UPDATE SESSION CREDITS
    // ============================================
    await supabase
      .from('sessions')
      .update({ 
        total_credits_used: supabase.rpc('increment', { x: creditsToCharge })
      })
      .eq('session_id', currentSessionId);

    // ============================================
    // 16. RETURN RESPONSE
    // ============================================
    return NextResponse.json({
      prompt: generatedPrompt,
      promptId: savedPrompt?.prompt_id,
      sessionId: currentSessionId,
      creditsCharged: creditsToCharge,
      creditsRemaining: availableCredits - creditsToCharge,
      warnings,
      suggestions,
      patternsApplied: appliedPatterns,
      patternsDetected: patterns.detected,
      isNewSession,
      guidelinesUsed: brand.guidelines_source || null
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}


// ============================================
// PATTERN ANALYSIS
// ============================================
interface PatternResult {
  detected: string[];
  fps: { value: string; frequency: number } | null;
  cameraMovement: { value: string; frequency: number } | null;
  preferredPlatform: { value: string; frequency: number } | null;
  shotTypes: { value: string; frequency: number }[];
  highRatedPhrases: string[];
}

function analyzePatterns(history: any[]): PatternResult {
  const result: PatternResult = {
    detected: [],
    fps: null,
    cameraMovement: null,
    preferredPlatform: null,
    shotTypes: [],
    highRatedPhrases: []
  };

  if (history.length < 3) return result;

  // FPS patterns
  const fpsMatches = history
    .map(p => p.prompt_text?.match(/(\d+)\s*fps/i))
    .filter(Boolean)
    .map(m => m![1]);
  
  if (fpsMatches.length > 0) {
    const counts = countOccurrences(fpsMatches);
    const top = getTopOccurrence(counts);
    if (top && top.frequency >= 0.5) {
      result.fps = top;
      result.detected.push(`${top.value}fps (${Math.round(top.frequency * 100)}% of prompts)`);
    }
  }

  // Camera movement patterns
  const movements = ['tracking', 'dolly', 'pan', 'tilt', 'static', 'handheld', 'crane', 'steadicam', 'locked'];
  const movementMatches = history
    .map(p => {
      const text = (p.prompt_text || '').toLowerCase();
      return movements.find(m => text.includes(m));
    })
    .filter(Boolean) as string[];

  if (movementMatches.length > 0) {
    const counts = countOccurrences(movementMatches);
    const top = getTopOccurrence(counts);
    if (top && top.frequency >= 0.4) {
      result.cameraMovement = top;
      result.detected.push(`${top.value} camera (${Math.round(top.frequency * 100)}% of prompts)`);
    }
  }

  // Platform preference
  const platforms = history.map(p => p.platform).filter(Boolean);
  if (platforms.length > 0) {
    const counts = countOccurrences(platforms);
    const top = getTopOccurrence(counts);
    if (top && top.frequency >= 0.5) {
      result.preferredPlatform = top;
      result.detected.push(`Prefers ${top.value} (${Math.round(top.frequency * 100)}%)`);
    }
  }

  // High-rated patterns
  const highRated = history.filter(p => 
    p.user_feedback === 'great' || p.user_feedback === 'good' || p.user_feedback === '5' || p.user_feedback === '4'
  );
  if (highRated.length >= 2) {
    result.highRatedPhrases = findCommonPhrases(highRated.map(p => p.prompt_text));
  }

  return result;
}

function countOccurrences(arr: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  arr.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
  return counts;
}

function getTopOccurrence(counts: Map<string, number>): { value: string; frequency: number } | null {
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  let top: { value: string; frequency: number } | null = null;
  
  counts.forEach((count, value) => {
    const freq = count / total;
    if (!top || freq > top.frequency) {
      top = { value, frequency: freq };
    }
  });
  
  return top;
}

function findCommonPhrases(prompts: string[]): string[] {
  const phrases = new Map<string, number>();
  
  prompts.forEach(prompt => {
    if (!prompt) return;
    const words = prompt.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i+1]} ${words[i+2]}`;
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }
  });

  return Array.from(phrases.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([phrase]) => phrase);
}


// ============================================
// BRAND GUIDELINES FORMATTER
// ============================================
interface ColorEntry {
  hex: string;
  name: string;
  usage?: string;
}

interface Typography {
  primary_font?: string;
  secondary_font?: string;
  rules?: string;
}

function formatColorPalette(palette: ColorEntry[] | null): string {
  if (!palette || !Array.isArray(palette) || palette.length === 0) return '';
  
  const colorLines = palette.map(c => {
    let line = `  • ${c.hex}`;
    if (c.name) line += ` (${c.name})`;
    if (c.usage) line += ` - ${c.usage}`;
    return line;
  }).join('\n');
  
  return `COLOR PALETTE (use these exact values when describing colors):
${colorLines}
`;
}

function formatTypography(typography: Typography | null): string {
  if (!typography) return '';
  
  const parts: string[] = [];
  if (typography.primary_font) {
    parts.push(`  • Primary Font: ${typography.primary_font}`);
  }
  if (typography.secondary_font) {
    parts.push(`  • Secondary Font: ${typography.secondary_font}`);
  }
  if (typography.rules) {
    parts.push(`  • Rules: ${typography.rules}`);
  }
  
  if (parts.length === 0) return '';
  
  return `TYPOGRAPHY:
${parts.join('\n')}
`;
}

function formatToneKeywords(keywords: string[] | null): string {
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) return '';
  
  return `BRAND TONE: ${keywords.join(', ')}
(Ensure generated content reflects this brand voice)
`;
}

function formatVisualRules(rules: string | null): string {
  if (!rules || rules.trim() === '') return '';
  
  return `VISUAL RULES (MUST follow):
${rules}
`;
}


// ============================================
// SYSTEM PROMPT BUILDER
// ============================================
interface SystemPromptContext {
  platform: string;
  isVideo: boolean;
  clipDuration?: string;
  brand: any;
  promptHistory: any[];
  storedIntelligence: any[];
  patterns: PatternResult;
}

function buildSystemPrompt(ctx: SystemPromptContext): string {
  const { platform, isVideo, clipDuration, brand, promptHistory, storedIntelligence, patterns } = ctx;

  // Determine guidelines quality indicator
  const guidelinesIndicator = brand.guidelines_source 
    ? `[Guidelines: ${brand.guidelines_source}${brand.guidelines_updated_at ? `, updated ${new Date(brand.guidelines_updated_at).toLocaleDateString()}` : ''}]`
    : '[No guidelines configured - using basic brand info]';

  let prompt = `You are Continuum, a brand intelligence agent for professional broadcast content generation.

You learn from every interaction. You remember what works for each brand. You apply patterns automatically.

═══════════════════════════════════════
BRAND: ${brand.brand_name}
${guidelinesIndicator}
═══════════════════════════════════════
${brand.brand_description ? `Description: ${brand.brand_description}\n` : ''}${brand.industry ? `Industry: ${brand.industry}\n` : ''}
`;

  // Add structured brand guidelines if available
  const hasGuidelines = brand.guidelines_source && (
    brand.color_palette || 
    brand.typography || 
    brand.tone_keywords || 
    brand.visual_rules
  );

  if (hasGuidelines) {
    prompt += `───────────────────────────────────────
BRAND GUIDELINES
───────────────────────────────────────
`;
    
    // Color palette - formatted for AI to use exact values
    if (brand.color_palette) {
      prompt += formatColorPalette(brand.color_palette);
      prompt += '\n';
    }
    
    // Typography
    if (brand.typography) {
      prompt += formatTypography(brand.typography);
      prompt += '\n';
    }
    
    // Tone keywords
    if (brand.tone_keywords) {
      prompt += formatToneKeywords(brand.tone_keywords);
      prompt += '\n';
    }
    
    // Visual rules - critical constraints
    if (brand.visual_rules) {
      prompt += formatVisualRules(brand.visual_rules);
      prompt += '\n';
    }
    
    // Reference document
    if (brand.document_url) {
      prompt += `Reference: ${brand.document_url}\n`;
    }
  }

  // Add stored intelligence
  if (storedIntelligence.length > 0) {
    prompt += `═══════════════════════════════════════
LEARNED BRAND INTELLIGENCE
═══════════════════════════════════════
${storedIntelligence.map(i => 
  `• ${i.intelligence_type}: ${i.learned_value} (confidence: ${Math.round(i.confidence_score * 100)}%, seen ${i.occurrences}x)`
).join('\n')}

`;
  }

  // Add detected patterns from recent history
  if (patterns.detected.length > 0) {
    prompt += `═══════════════════════════════════════
DETECTED PATTERNS (from last ${promptHistory.length} prompts)
═══════════════════════════════════════
${patterns.detected.map(p => `• ${p}`).join('\n')}

INSTRUCTION: Apply these patterns unless the request explicitly contradicts them.

`;
  }

  // Add high-rated patterns
  if (patterns.highRatedPhrases.length > 0) {
    prompt += `HIGH-RATED PHRASES (appeared in successful prompts):
${patterns.highRatedPhrases.map(p => `• "${p}"`).join('\n')}

`;
  }

  // Add history context
  if (promptHistory.length > 0) {
    prompt += `═══════════════════════════════════════
RECENT HISTORY (${promptHistory.length} prompts)
═══════════════════════════════════════
${promptHistory.slice(0, 5).map((p, i) => 
  `${i + 1}. [${p.platform}] "${p.user_input?.substring(0, 60)}..."${p.user_feedback ? ` → ${p.user_feedback}` : ''}`
).join('\n')}

`;
  }

  // Motion-first methodology for video
  if (isVideo) {
    prompt += `═══════════════════════════════════════
MOTION-FIRST METHODOLOGY (Required for video)
═══════════════════════════════════════
1. MOTION DIRECTIVES FIRST
   Start with speed/movement, not static description.
   ✓ "Slow forward tracking at 5mph through..."
   ✗ "A car in a warehouse..."

2. CAMERA LOCK COMMANDS
   Prevent unwanted AI camera movement.
   ✓ "Camera locked on tripod" / "No pan or tilt"

3. BACKGROUND MOTION FOR STATIC SUBJECTS
   Prevents freeze-frame artifacts.
   ✓ "Dust particles drifting through light"

4. NEGATIVE CONSTRAINTS
   State what should NOT happen.
   ✓ "No zoom, no rack focus, no Dutch angle"

5. DURATION: ${clipDuration || '5'} seconds

`;
  }

  // Platform guidance
  prompt += getPlatformGuidance(platform);

  // Output format with guidelines reminder
  prompt += `
═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════
1. If applying patterns: Start with [APPLYING: pattern1, pattern2]
2. Generate the optimized prompt
   ${hasGuidelines ? '→ IMPORTANT: Reference specific colors by hex value from the brand palette' : ''}
   ${brand.tone_keywords ? `→ IMPORTANT: Reflect brand tone: ${(brand.tone_keywords as string[]).slice(0, 3).join(', ')}` : ''}
3. If you notice a new pattern worth saving: End with [SUGGESTION: description]

Generate the prompt now.`;

  return prompt;
}


// ============================================
// USER MESSAGE BUILDER
// ============================================
interface UserMessageContext {
  brand: any;
  shotDescription: string;
  platform: string;
  clipDuration?: string;
  isVideo: boolean;
  patterns: PatternResult;
}

function buildUserMessage(ctx: UserMessageContext): string {
  const { brand, shotDescription, platform, clipDuration, isVideo } = ctx;

  let message = `Generate an optimized ${isVideo ? 'video' : 'image'} prompt for ${platform}.

BRAND: ${brand.brand_name}
REQUEST: ${shotDescription}
${isVideo && clipDuration ? `DURATION: ${clipDuration} seconds` : ''}`;

  // Add tone reminder if available
  if (brand.tone_keywords && Array.isArray(brand.tone_keywords) && brand.tone_keywords.length > 0) {
    message += `\nBRAND VOICE: ${brand.tone_keywords.join(', ')}`;
  }

  message += `\n\nApply any relevant learned patterns and brand guidelines for this brand.`;

  return message;
}


// ============================================
// PLATFORM GUIDANCE
// ============================================
function getPlatformGuidance(platform: string): string {
  const guidance: Record<string, string> = {
    'veo3': `
PLATFORM: Google Veo 3 (5000 char limit)
• Exceptional motion consistency and literal execution
• Precise speed directives work well (mph/kph)
• Camera mount language executes perfectly
• Best for: Automotive, tracking shots, product motion
`,
    'sora': `
PLATFORM: Sora (4000 char limit)
• Outstanding cinematic lighting and atmosphere
• Struggles with complex coordinated motion
• Best for: Atmospheric, mood-focused content
• Simplify motion, emphasize lighting
`,
    'kling': `
PLATFORM: Kling (3500 char limit)
• Strong architectural and product detail
• Excellent frame-to-frame consistency
• Best for: Interiors, products, static beauty
`,
    'minimax': `
PLATFORM: MiniMax Hailuo (3000 char limit)
• Reliable general-purpose generation
• Good for standard commercial shots
`,
    'runway': `
PLATFORM: Runway Gen-3 (3500 char limit)
• Strong motion understanding
• Good for creative/experimental content
`,
    'seedance': `
PLATFORM: Seedance 1.0 Pro (3000 char limit)
• Good motion consistency
• Balanced quality/speed tradeoff
`,
    'pika': `
PLATFORM: Pika (2000 char limit)
• Fast generation
• Keep prompts concise
`,
    'freepik': `
PLATFORM: Freepik (2500 char limit)
• Stock-style output
• Good for generic commercial content
`,
    'midjourney': `
PLATFORM: Midjourney (2000 char limit)
• Exceptional artistic/stylized output
• Use --ar for aspect ratio, --v for version
• Best for: Hero images, concept art
`,
    'grok': `
PLATFORM: Grok (3000 char limit)
• Strong photorealistic rendering
• Good complex scene handling
`,
    'flux': `
PLATFORM: Flux (2500 char limit)
• Excellent fine detail and accuracy
• Strong text rendering
`
  };

  return guidance[platform] || `PLATFORM: ${platform}\n`;
}


// ============================================
// RESPONSE PARSER
// ============================================
function parseClaudeResponse(response: string): { 
  prompt: string; 
  suggestions: string[]; 
  appliedPatterns: string[] 
} {
  const suggestions: string[] = [];
  const appliedPatterns: string[] = [];
  let prompt = response;

  // Extract [APPLYING: ...] block
  const applyMatch = prompt.match(/\[APPLYING:\s*([^\]]+)\]/i);
  if (applyMatch) {
    appliedPatterns.push(...applyMatch[1].split(',').map(s => s.trim()));
    prompt = prompt.replace(applyMatch[0], '').trim();
  }

  // Extract [SUGGESTION: ...] blocks
  const suggestionRegex = /\[SUGGESTION:\s*([^\]]+)\]/gi;
  let match;
  while ((match = suggestionRegex.exec(response)) !== null) {
    suggestions.push(match[1].trim());
  }
  prompt = prompt.replace(suggestionRegex, '').trim();

  return { prompt, suggestions, appliedPatterns };
}


// ============================================
// UPDATE BRAND INTELLIGENCE
// ============================================
async function updateBrandIntelligence(
  brandId: string, 
  patterns: PatternResult, 
  userInput: string,
  platform: string
) {
  // Update or insert intelligence records based on detected patterns
  
  if (patterns.fps) {
    await upsertIntelligence(brandId, 'fps_preference', patterns.fps.value, patterns.fps.frequency);
  }
  
  if (patterns.cameraMovement) {
    await upsertIntelligence(brandId, 'camera_preference', patterns.cameraMovement.value, patterns.cameraMovement.frequency);
  }
  
  if (patterns.preferredPlatform) {
    await upsertIntelligence(brandId, 'platform_preference', patterns.preferredPlatform.value, patterns.preferredPlatform.frequency);
  }
}

async function upsertIntelligence(brandId: string, type: string, value: string, confidence: number) {
  // Check if exists
  const { data: existing } = await supabase
    .from('brand_intelligence')
    .select('intelligence_id, occurrences')
    .eq('brand_id', brandId)
    .eq('intelligence_type', type)
    .eq('learned_value', value)
    .single();

  if (existing) {
    // Update existing
    await supabase
      .from('brand_intelligence')
      .update({
        confidence_score: Math.min(confidence + 0.05, 1.0), // Increase confidence
        occurrences: existing.occurrences + 1,
        last_seen: new Date().toISOString()
      })
      .eq('intelligence_id', existing.intelligence_id);
  } else {
    // Insert new
    await supabase
      .from('brand_intelligence')
      .insert({
        brand_id: brandId,
        intelligence_type: type,
        learned_value: value,
        confidence_score: confidence,
        occurrences: 1
      });
  }
}


// ============================================
// CREDIT DEDUCTION
// ============================================
async function deductCredits(
  userId: string, 
  amount: number, 
  sessionId: string, 
  promptId?: string
) {
  // Get current balance
  const { data: balance } = await supabase
    .from('credit_balances')
    .select('balance_id, monthly_credits, topup_credits, total_credits_used')
    .eq('user_id', userId)
    .single();

  if (!balance) return;

  // Deduct from monthly first, then topup
  let monthlyDeduct = Math.min(balance.monthly_credits, amount);
  let topupDeduct = amount - monthlyDeduct;

  await supabase
    .from('credit_balances')
    .update({
      monthly_credits: balance.monthly_credits - monthlyDeduct,
      topup_credits: balance.topup_credits - topupDeduct,
      total_credits_used: balance.total_credits_used + amount,
      updated_at: new Date().toISOString()
    })
    .eq('balance_id', balance.balance_id);

  // Log transaction
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      transaction_type: 'deduction',
      credit_type: monthlyDeduct > 0 ? 'monthly' : 'topup',
      amount: -amount,
      description: `Prompt generation`,
      related_session_id: sessionId,
      related_prompt_id: promptId
    });
}
