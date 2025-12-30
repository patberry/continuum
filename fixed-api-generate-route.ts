import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

// All supported platforms
const VALID_PLATFORMS = [
  // Video
  'veo3', 'sora', 'kling', 'minimax', 'runway', 'seedance', 'pika', 'freepik',
  // Image
  'midjourney', 'grok', 'flux'
];

// Platform-specific character limits
const PLATFORM_LIMITS = {
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

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId, platform, clipDuration, shotDescription } = await request.json();

    // Validation
    if (!brandId || !platform || !shotDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate platform
    if (!VALID_PLATFORMS.includes(platform.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid platform. Supported: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch brand data (you'll need to implement this based on your DB)
    // const brand = await getBrand(brandId);

    // Determine if video or image
    const isVideo = ['veo3', 'sora', 'kling', 'minimax', 'runway', 'seedance', 'pika', 'freepik'].includes(platform);

    // Build system prompt for Claude
    const systemPrompt = isVideo 
      ? buildVideoPromptSystem(platform, clipDuration)
      : buildImagePromptSystem(platform);

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Brand: [Brand Name from DB]
Shot Description: ${shotDescription}
Platform: ${platform}
${isVideo ? `Duration: ${clipDuration} seconds` : ''}

Generate optimized prompt.`,
        }],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error('Claude API failed');
    }

    const data = await response.json();
    let generatedPrompt = data.content[0].text;

    // Check platform character limits and truncate if needed
    const limit = PLATFORM_LIMITS[platform];
    const warnings = [];

    if (limit && generatedPrompt.length > limit) {
      // Truncate at sentence boundary
      const truncated = generatedPrompt.substring(0, limit);
      const lastPeriod = truncated.lastIndexOf('.');
      generatedPrompt = lastPeriod > 0 
        ? truncated.substring(0, lastPeriod + 1)
        : truncated;
      
      warnings.push(`Prompt truncated to ${limit} characters for ${platform}`);
    }

    // TODO: Store in database
    // - Session ID
    // - Brand ID
    // - Generated prompt
    // - Platform
    // - User input
    // - Timestamp

    return NextResponse.json({
      prompt: generatedPrompt,
      creditsCharged: 10,
      warnings,
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}

function buildVideoPromptSystem(platform: string, duration: string) {
  return `You are an AI video prompt optimization agent for ${platform}.

CRITICAL RULES - Motion-First Methodology:

1. MOTION DIRECTIVES FIRST
   - Start with explicit speed and movement
   - Example: "Slow forward tracking at 5mph" NOT "A car in a warehouse"
   
2. CAMERA LOCK COMMANDS
   - Explicit camera behavior to prevent autonomous movement
   - Example: "Camera locked on tripod, no pan or tilt"
   
3. BACKGROUND MOTION FOR STATIC SUBJECTS
   - Prevent freeze-frame artifacts
   - Example: "Subtle dust particles moving through light beams"
   
4. NEGATIVE CONSTRAINTS
   - Explicitly state what should NOT occur
   - Example: "No zoom, no rack focus, no Dutch angle"

5. DURATION AWARENESS
   - ${duration} seconds is the target duration
   - Adjust motion speed accordingly

PLATFORM-SPECIFIC OPTIMIZATIONS:

${platform === 'veo3' ? `
Google Veo 3:
- Excels at literal execution and motion consistency
- Use precise speed directives (mph/kph)
- Camera mount language works perfectly
- Best for: Automotive, motion-heavy shots
` : ''}

${platform === 'sora' ? `
Sora 2 Pro:
- Exceptional cinematic lighting
- Struggles with complex coordinated motion
- Best for: Atmospheric, lighting-focused shots
- Use fewer motion directives, emphasize lighting
` : ''}

${platform === 'kling' ? `
Kling O1:
- Strong architectural and product detail
- Excellent consistency
- Best for: Interiors, products, static beauty
` : ''}

${platform === 'freepik' ? `
Freepik:
- 2500 character HARD LIMIT
- Keep prompts concise
- Focus on key elements only
` : ''}

OUTPUT FORMAT:
Structured prompt following motion-first methodology. No preamble, just the prompt.`;
}

function buildImagePromptSystem(platform: string) {
  return `You are an AI image prompt optimization agent for ${platform}.

CRITICAL RULES - Image Generation:

1. COMPOSITION FIRST
   - Frame, angle, perspective
   - Example: "Low angle, rule of thirds, subject right frame"

2. LIGHTING SPECIFICATION
   - Direction, quality, color temperature
   - Example: "Golden hour, hard side light, warm 3200K"

3. BRAND CONSISTENCY
   - Apply brand visual language
   - Color palette, design elements

4. TECHNICAL SPECS
   - Style, render quality, details
   - Example: "Photorealistic, 8K, sharp focus"

PLATFORM-SPECIFIC OPTIMIZATIONS:

${platform === 'midjourney' ? `
Midjourney:
- Responds well to artistic style references
- Use aspect ratios strategically
- Best for: Stylized, artistic renders
- 2000 character limit
` : ''}

${platform === 'grok' ? `
Grok:
- Strong photorealistic rendering
- Good at complex scenes
- Best for: Realistic imagery
` : ''}

${platform === 'flux' ? `
Flux:
- Excellent detail and accuracy
- Good at text rendering
- Best for: Detailed, precise imagery
- 2500 character limit
` : ''}

OUTPUT FORMAT:
Optimized image generation prompt. No preamble, just the prompt.`;
}
