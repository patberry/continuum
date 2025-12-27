// lib/claude.ts
// Claude API integration for Continuum
// Brand-aware prompt generation with learning
// Updated: December 26, 2024 - Validated rules from Veo 3, Sora 2, Kling O1, MiniMax testing

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BrandContext {
  brandId: string;
  brandName: string;
  brandDescription: string;
  guidelines: string[];
  learnedPatterns: LearnedPattern[];
  recentPrompts: RecentPrompt[];
}

export interface LearnedPattern {
  patternType: string;
  patternValue: string;
  confidence: number;
  timesUsed: number;
}

export interface RecentPrompt {
  promptText: string;
  userInput: string;
  feedback: 'great' | 'good' | 'bad' | null;
  platform: string;
}

export interface GenerationRequest {
  userInput: string;
  platform: 'veo3' | 'sora' | 'kling' | 'minimax' | 'midjourney' | 'flux' | 'runway';
  outputType: 'video' | 'still';
  sessionId: string;
  brandId: string;
  userId: string;
  duration?: number;
  shotType?: ShotType;
  screenDirection?: 'left-to-right' | 'right-to-left';
}

export interface GenerationResult {
  success: boolean;
  promptText?: string;
  promptId?: string;
  platformRecommendation?: string;
  technicalNotes?: string;
  tosTranslated?: boolean;
  brandDetected?: string;
  complexityWarning?: string;
  prediction?: PlatformPrediction;
  error?: string;
}

export interface PlatformPrediction {
  recommendedPlatform: string;
  confidence: number;  // 0-100 percentage
  rationale: string;
  alternatives: AlternativePlatform[];
  warnings: string[];
  factors: PredictionFactors;
}

export interface AlternativePlatform {
  platform: string;
  confidence: number;
  note: string;
}

export interface PredictionFactors {
  shotTypeMatch: number;      // 0-100
  durationFit: number;        // 0-100
  cameraRequirement: number;  // 0-100
  platformStrength: number;   // 0-100
}

export type ShotType = 
  | 'lateral_track' 
  | 'lateral_track_wide'
  | 'wide_establish' 
  | 'follow_behind' 
  | 'static_hero' 
  | 'interior' 
  | 'detail' 
  | 'auto';

// ============================================================================
// TOS TRANSLATION - Validated December 24-25, 2024
// Brand names trigger TOS blocks. Model numbers + visual descriptors do not.
// Testing confirmed: "Porsche" blocked, "911" rendered correctly.
// ============================================================================

interface TOSTranslation {
  modelNumber: string;
  visualDescriptors: string;
  silhouette?: string;
}

const BRAND_TRANSLATIONS: Record<string, TOSTranslation> = {
  // German Sports/Luxury
  'porsche 911': { 
    modelNumber: '911', 
    visualDescriptors: 'sports coupe with rear-engine silhouette',
    silhouette: 'distinctive round headlights, sloping rear'
  },
  'porsche taycan': { 
    modelNumber: 'Taycan', 
    visualDescriptors: 'electric sport sedan with flowing roofline' 
  },
  'porsche macan': { 
    modelNumber: 'Macan', 
    visualDescriptors: 'compact performance SUV with sport styling' 
  },
  'porsche cayenne': { 
    modelNumber: 'Cayenne', 
    visualDescriptors: 'luxury performance SUV' 
  },
  
  // Tesla
  'tesla model s': { 
    modelNumber: 'Model S', 
    visualDescriptors: 'electric sedan with panoramic glass roof' 
  },
  'tesla model 3': { 
    modelNumber: 'Model 3', 
    visualDescriptors: 'electric compact sedan with minimalist design' 
  },
  'tesla model x': { 
    modelNumber: 'Model X', 
    visualDescriptors: 'electric SUV with falcon-wing doors' 
  },
  'tesla model y': { 
    modelNumber: 'Model Y', 
    visualDescriptors: 'electric compact crossover SUV' 
  },
  'tesla cybertruck': { 
    modelNumber: 'Cybertruck', 
    visualDescriptors: 'angular stainless steel electric pickup' 
  },
  
  // BMW
  'bmw m3': { 
    modelNumber: 'M3', 
    visualDescriptors: 'sport sedan with aggressive front fascia and wide stance' 
  },
  'bmw m4': { 
    modelNumber: 'M4', 
    visualDescriptors: 'sport coupe with large kidney grille and muscular fenders' 
  },
  'bmw m5': { 
    modelNumber: 'M5', 
    visualDescriptors: 'executive sport sedan with quad exhaust' 
  },
  'bmw i4': { 
    modelNumber: 'i4', 
    visualDescriptors: 'electric grand coupe with flowing silhouette' 
  },
  'bmw ix': { 
    modelNumber: 'iX', 
    visualDescriptors: 'electric luxury SUV with minimalist design' 
  },
  
  // Mercedes
  'mercedes amg gt': { 
    modelNumber: 'AMG GT', 
    visualDescriptors: 'long-hood grand tourer with Panamericana grille' 
  },
  'mercedes s-class': { 
    modelNumber: 'S-Class', 
    visualDescriptors: 'flagship luxury sedan' 
  },
  'mercedes eqs': { 
    modelNumber: 'EQS', 
    visualDescriptors: 'electric luxury sedan with one-bow silhouette' 
  },
  'mercedes g-wagon': { 
    modelNumber: 'G-Class', 
    visualDescriptors: 'boxy off-road SUV with military heritage' 
  },
  'mercedes g-class': { 
    modelNumber: 'G-Class', 
    visualDescriptors: 'boxy off-road SUV with military heritage' 
  },
  
  // Audi
  'audi r8': { 
    modelNumber: 'R8', 
    visualDescriptors: 'mid-engine supercar with sideblades' 
  },
  'audi rs6': { 
    modelNumber: 'RS6', 
    visualDescriptors: 'performance wagon with wide-body fenders' 
  },
  'audi e-tron gt': { 
    modelNumber: 'e-tron GT', 
    visualDescriptors: 'electric grand tourer with sculpted sides' 
  },
  
  // Italian Exotics
  'ferrari 488': { 
    modelNumber: '488', 
    visualDescriptors: 'mid-engine Italian supercar with aggressive aero' 
  },
  'ferrari sf90': { 
    modelNumber: 'SF90', 
    visualDescriptors: 'hybrid hypercar with F1-derived technology' 
  },
  'ferrari roma': { 
    modelNumber: 'Roma', 
    visualDescriptors: 'elegant front-engine grand tourer' 
  },
  'lamborghini huracan': { 
    modelNumber: 'Huracan', 
    visualDescriptors: 'angular mid-engine supercar with hexagonal design language' 
  },
  'lamborghini urus': { 
    modelNumber: 'Urus', 
    visualDescriptors: 'super SUV with aggressive angular styling' 
  },
  'lamborghini revuelto': { 
    modelNumber: 'Revuelto', 
    visualDescriptors: 'hybrid supercar with dramatic Y-shaped lighting' 
  },
  
  // American
  'ford mustang': { 
    modelNumber: 'Mustang', 
    visualDescriptors: 'American muscle car with tri-bar taillights' 
  },
  'ford f-150': { 
    modelNumber: 'F-150', 
    visualDescriptors: 'full-size pickup truck' 
  },
  'ford bronco': { 
    modelNumber: 'Bronco', 
    visualDescriptors: 'rugged off-road SUV with round headlights' 
  },
  'chevrolet corvette': { 
    modelNumber: 'Corvette', 
    visualDescriptors: 'mid-engine American sports car' 
  },
  'chevrolet camaro': { 
    modelNumber: 'Camaro', 
    visualDescriptors: 'American muscle coupe with aggressive stance' 
  },
  'dodge challenger': { 
    modelNumber: 'Challenger', 
    visualDescriptors: 'retro-styled American muscle car' 
  },
  
  // Japanese Performance
  'nissan gt-r': { 
    modelNumber: 'GT-R', 
    visualDescriptors: 'twin-turbo sports car with quad circular taillights' 
  },
  'toyota supra': { 
    modelNumber: 'Supra', 
    visualDescriptors: 'sport coupe with double-bubble roof' 
  },
  'honda nsx': { 
    modelNumber: 'NSX', 
    visualDescriptors: 'hybrid supercar with floating C-pillar' 
  },
  'mazda mx-5': { 
    modelNumber: 'MX-5', 
    visualDescriptors: 'lightweight roadster convertible' 
  },
  
  // British
  'aston martin db11': { 
    modelNumber: 'DB11', 
    visualDescriptors: 'grand tourer with aeroblade vents' 
  },
  'aston martin vantage': { 
    modelNumber: 'Vantage', 
    visualDescriptors: 'compact sports car with wide grille' 
  },
  'mclaren 720s': { 
    modelNumber: '720S', 
    visualDescriptors: 'supercar with dihedral doors and eye sockets' 
  },
  'bentley continental': { 
    modelNumber: 'Continental', 
    visualDescriptors: 'luxury grand tourer with matrix grille' 
  },
  'rolls-royce phantom': { 
    modelNumber: 'Phantom', 
    visualDescriptors: 'ultra-luxury sedan with pantheon grille' 
  },
  
  // Rivian/Lucid
  'rivian r1t': { 
    modelNumber: 'R1T', 
    visualDescriptors: 'electric adventure pickup with stadium headlights' 
  },
  'rivian r1s': { 
    modelNumber: 'R1S', 
    visualDescriptors: 'electric adventure SUV with stadium headlights' 
  },
  'lucid air': { 
    modelNumber: 'Air', 
    visualDescriptors: 'sleek electric luxury sedan' 
  },
};

// Standalone brand names without specific models
const STANDALONE_BRAND_TRANSLATIONS: Record<string, string> = {
  'porsche': 'German sports car',
  'tesla': 'electric vehicle',
  'bmw': 'German luxury car',
  'mercedes': 'luxury sedan',
  'mercedes-benz': 'luxury sedan',
  'audi': 'German luxury car',
  'ferrari': 'Italian supercar',
  'lamborghini': 'Italian supercar',
  'ford': 'American vehicle',
  'chevrolet': 'American vehicle',
  'chevy': 'American vehicle',
  'dodge': 'American muscle car',
  'nissan': 'Japanese vehicle',
  'toyota': 'Japanese vehicle',
  'honda': 'Japanese vehicle',
  'mazda': 'Japanese vehicle',
  'aston martin': 'British grand tourer',
  'mclaren': 'British supercar',
  'bentley': 'British luxury car',
  'rolls-royce': 'ultra-luxury vehicle',
  'rivian': 'electric adventure vehicle',
  'lucid': 'electric luxury sedan',
};

interface TOSTranslationResult {
  translatedInput: string;
  brandDetected: string | null;
  wasTranslated: boolean;
}

/**
 * Translate brand names to TOS-safe equivalents.
 * Brand names (e.g., "Porsche") trigger content blocks.
 * Model numbers + visual descriptors (e.g., "911 sports coupe") render correctly.
 * Validated Dec 24-25, 2024: "911" passed, "Porsche 911" blocked.
 */
function translateForTOS(userInput: string): TOSTranslationResult {
  const lowerInput = userInput.toLowerCase();
  
  // Check specific brand + model combinations first (more specific = priority)
  for (const [brandKey, translation] of Object.entries(BRAND_TRANSLATIONS)) {
    if (lowerInput.includes(brandKey)) {
      // Build replacement: model number + visual descriptors
      const replacement = `${translation.modelNumber} ${translation.visualDescriptors}`;
      
      // Replace the brand phrase with TOS-safe version
      const regex = new RegExp(brandKey, 'gi');
      const translatedInput = userInput.replace(regex, replacement);
      
      return {
        translatedInput,
        brandDetected: brandKey,
        wasTranslated: true
      };
    }
  }
  
  // Check for standalone brand names without specific model
  for (const [brand, generic] of Object.entries(STANDALONE_BRAND_TRANSLATIONS)) {
    if (lowerInput.includes(brand)) {
      const regex = new RegExp(`\\b${brand}\\b`, 'gi');
      return {
        translatedInput: userInput.replace(regex, generic),
        brandDetected: brand,
        wasTranslated: true
      };
    }
  }
  
  return { translatedInput: userInput, brandDetected: null, wasTranslated: false };
}


// ============================================================================
// DURATION-COMPLEXITY RULES - Validated December 24-25, 2024
// 7s = ONE action, ONE camera behavior. Exceeding causes teleportation/scene drift.
// Testing confirmed: Multi-action prompts in 7s clips produce discontinuity.
// ============================================================================

interface ComplexityBudget {
  maxActions: number;
  maxCameraChanges: number;
  maxReveals: number;
  pacingGuidance: string;
  warning?: string;
}

/**
 * Calculate complexity budget based on duration.
 * Validated: 7-second clips need single actions or teleportation occurs.
 */
function getComplexityBudget(duration: number): ComplexityBudget {
  if (duration <= 3) {
    return {
      maxActions: 1,
      maxCameraChanges: 0,
      maxReveals: 0,
      pacingGuidance: 'Single quick action, static or simple camera. No transitions.',
      warning: 'Very short duration - keep extremely simple. One motion only.'
    };
  } else if (duration <= 5) {
    return {
      maxActions: 1,
      maxCameraChanges: 0,
      maxReveals: 0,
      pacingGuidance: 'ONE action, locked camera. No reveals or transitions.',
      warning: 'Short duration - single continuous action, no complexity.'
    };
  } else if (duration <= 7) {
    return {
      maxActions: 1,
      maxCameraChanges: 1,
      maxReveals: 0,
      pacingGuidance: 'ONE primary action, ONE camera behavior. No reveals. Moderate pacing.'
    };
  } else if (duration <= 10) {
    return {
      maxActions: 1,
      maxCameraChanges: 1,
      maxReveals: 0,
      pacingGuidance: 'ONE action with development, ONE camera move. Deliberate pacing. Can include subtle secondary motion (background elements).'
    };
  } else if (duration <= 15) {
    return {
      maxActions: 2,
      maxCameraChanges: 1,
      maxReveals: 1,
      pacingGuidance: 'Can introduce ONE transition or reveal. Slow, deliberate pacing. Primary action can develop over time. Secondary action allowed in final third.'
    };
  } else {
    return {
      maxActions: 2,
      maxCameraChanges: 2,
      maxReveals: 1,
      pacingGuidance: 'Extended duration allows for scene development. Keep pacing slow. Maximum two distinct actions. One major reveal allowed.',
      warning: 'Long duration - maintain consistency is harder. Consider breaking into multiple clips.'
    };
  }
}


// ============================================================================
// SHOT TEMPLATES - Validated December 24-25, 2024
// Templates use camera MOUNTING language, not behavioral descriptions.
// "Camera mounted on tracking vehicle's left side" > "parallel tracking shot"
// ============================================================================

interface ShotTemplate {
  name: string;
  cameraInstruction: string;
  framingGuidance: string;
  motionGuidance: string;
  defaultOccupancy: string;
  defaultScreenDirection: string;
  negativeConstraints: string[];
  platformNotes?: Record<string, string>;
}

const SHOT_TEMPLATES: Record<ShotType, ShotTemplate> = {
  lateral_track: {
    name: 'Lateral Tracking (Tight)',
    cameraInstruction: 'Camera mounted on tracking vehicle\'s left side maintains fixed lateral position, capturing full driver\'s side profile.',
    framingGuidance: 'Subject fills 70% of frame. Shallow depth of field, sharp focus on subject.',
    motionGuidance: 'Subject drives steadily. Camera maintains consistent distance and angle throughout.',
    defaultOccupancy: 'Single male driver with sunglasses, hands on steering wheel.',
    defaultScreenDirection: 'traveling screen-left to screen-right',
    negativeConstraints: [
      'Camera does not rotate or orbit around vehicle',
      'No zoom or focal length changes',
      'No Dutch angle',
      'Camera maintaining consistent side angle throughout'
    ],
    platformNotes: {
      veo3: 'Excellent. Respects camera lock.',
      sora: 'May drift to front 3/4 view. May add passengers.',
      kling: 'Excellent consistency. Dynamic backgrounds.',
      midjourney: 'Ignores camera position for "dramatic" angles. Stills only.'
    }
  },
  
  lateral_track_wide: {
    name: 'Lateral Tracking (Wide)',
    cameraInstruction: 'Camera mounted on tracking vehicle\'s left side at moderate distance, capturing full vehicle in frame with environmental context.',
    framingGuidance: 'Full vehicle visible with road and environment. Subject at 40-50% of frame.',
    motionGuidance: 'Subject drives steadily. Camera maintains consistent distance showing full vehicle plus surroundings.',
    defaultOccupancy: 'Single driver visible through windows.',
    defaultScreenDirection: 'traveling screen-left to screen-right',
    negativeConstraints: [
      'Camera does not close in or pull back',
      'No rotation around vehicle',
      'Maintain wide framing throughout'
    ]
  },
  
  wide_establish: {
    name: 'Wide Establishing Shot',
    cameraInstruction: 'Static camera on tripod, wide focal length. Subject enters from screen edge.',
    framingGuidance: 'Environment-forward composition. Subject at 20-30% of frame. Emphasize location.',
    motionGuidance: 'Subject enters frame and travels across. Camera remains locked.',
    defaultOccupancy: 'Driver visible as silhouette.',
    defaultScreenDirection: 'entering from screen-left, traveling right',
    negativeConstraints: [
      'Camera locked on tripod',
      'No pan, no tilt, no zoom',
      'No camera movement of any kind'
    ]
  },
  
  follow_behind: {
    name: 'Follow Behind',
    cameraInstruction: 'Camera mounted on trailing vehicle, centered behind subject. Slight elevation to see over subject roof.',
    framingGuidance: 'Subject centered in frame. Road extends ahead. Horizon visible above roofline.',
    motionGuidance: 'Subject drives away from camera at consistent pace. Camera follows at fixed distance.',
    defaultOccupancy: 'Single driver, seen from behind through rear window.',
    defaultScreenDirection: 'traveling away from camera toward horizon',
    negativeConstraints: [
      'Camera does not pass or overtake subject',
      'Maintain fixed following distance',
      'No side-to-side movement'
    ]
  },
  
  static_hero: {
    name: 'Static Hero',
    cameraInstruction: 'Camera on tripod at eye level or slightly below. Subject stationary, camera locked.',
    framingGuidance: 'Subject positioned using rule of thirds. Clean background, no distractions.',
    motionGuidance: 'Subject is stationary. Background has subtle motion: clouds moving, dust particles, leaves, light changes.',
    defaultOccupancy: 'Empty vehicle, no occupants.',
    defaultScreenDirection: 'facing screen-right (3/4 front view) or screen-left (3/4 rear view)',
    negativeConstraints: [
      'Vehicle does not move',
      'Camera locked, no movement',
      'No zoom, no rack focus'
    ],
    platformNotes: {
      veo3: 'May need explicit background motion or will freeze.',
      sora: 'Better lighting on static subjects.',
      kling: 'Include explicit background elements for motion.'
    }
  },
  
  interior: {
    name: 'Interior POV',
    cameraInstruction: 'Camera mounted on dashboard or passenger seat, facing driver or through windshield.',
    framingGuidance: 'Interior fills frame. Windshield view shows road ahead. Steering wheel and hands visible.',
    motionGuidance: 'View through windshield shows forward movement. Driver makes subtle steering adjustments.',
    defaultOccupancy: 'Driver in profile, hands at 9-and-3 on wheel.',
    defaultScreenDirection: 'forward motion visible through windshield',
    negativeConstraints: [
      'Camera stays inside vehicle',
      'No exterior shots',
      'Consistent interior lighting'
    ]
  },
  
  detail: {
    name: 'Detail/Macro',
    cameraInstruction: 'Close-up camera, shallow depth of field, focused on specific element.',
    framingGuidance: 'Detail element fills frame. Extreme shallow DOF, background abstract.',
    motionGuidance: 'Very subtle dolly or rack focus. Light movement preferred over camera movement.',
    defaultOccupancy: 'N/A - detail shots focus on vehicle elements, not occupants.',
    defaultScreenDirection: 'N/A',
    negativeConstraints: [
      'Maintain extreme close-up framing',
      'No pull-back to reveal',
      'Focus stays locked on detail'
    ]
  },
  
  auto: {
    name: 'Auto-Select',
    cameraInstruction: 'Camera position determined by scene requirements.',
    framingGuidance: 'Appropriate framing for the action described.',
    motionGuidance: 'Motion appropriate to duration and complexity budget.',
    defaultOccupancy: 'Single driver with sunglasses unless otherwise specified.',
    defaultScreenDirection: 'screen-left to screen-right',
    negativeConstraints: []
  }
};

/**
 * Get shot template with platform-specific adjustments.
 */
function getShotTemplate(
  shotType: ShotType, 
  platform: string
): ShotTemplate {
  const template = SHOT_TEMPLATES[shotType] || SHOT_TEMPLATES.auto;
  return template;
}


// ============================================================================
// PLATFORM RECOMMENDATIONS - Validated December 25-26, 2024
// Each platform has specific strengths. No "best overall."
// ============================================================================

interface PlatformCapabilities {
  vehicleConsistency: number;  // 1-10
  cameraLock: number;         // 1-10
  instructionCompliance: number;
  bestFor: string[];
  weaknesses: string[];
  notes: string;
}

const PLATFORM_CAPABILITIES: Record<string, PlatformCapabilities> = {
  veo3: {
    vehicleConsistency: 9,
    cameraLock: 10,
    instructionCompliance: 9,
    bestFor: [
      'Broadcast production',
      'Literal execution',
      'Product hero shots',
      'Camera lock critical shots',
      'Single occupant precision'
    ],
    weaknesses: [
      'May freeze on static subjects without explicit background motion',
      '10-minute cooldown between renders'
    ],
    notes: 'Primary recommendation for broadcast. Respects camera mounting language and screen direction.'
  },
  
  sora: {
    vehicleConsistency: 7,
    cameraLock: 5,
    instructionCompliance: 6,
    bestFor: [
      'Cinematic mood pieces',
      'Social content (variance is a feature)',
      'Human motion',
      'Creative exploration',
      'When interpretation is welcome'
    ],
    weaknesses: [
      'Adds passengers despite instructions',
      'Camera drifts from locked position',
      'Interprets classic versions of vehicles',
      'Not production-reliable'
    ],
    notes: 'Better for mood/social. Variance makes it unreliable for broadcast but creative for exploration.'
  },
  
  kling: {
    vehicleConsistency: 9,
    cameraLock: 9,
    instructionCompliance: 8,
    bestFor: [
      'Automotive tracking',
      'Dynamic environments (waves, weather)',
      '10-second sweet spot',
      'Modern vehicle accuracy'
    ],
    weaknesses: [
      'May not parse lane positioning language',
      'Needs explicit road position instructions'
    ],
    notes: 'Excellent for automotive. 10s is optimal duration. Dynamic backgrounds are its strength.'
  },
  
  minimax: {
    vehicleConsistency: 9,
    cameraLock: 9,
    instructionCompliance: 7,
    bestFor: [
      'Clean clinical execution',
      'Modern vehicle accuracy',
      'Consistent tracking'
    ],
    weaknesses: [
      'Does not parse lane positioning',
      'Variance in background interpretation between renders'
    ],
    notes: 'Clinical precision. Good via Freepik aggregator.'
  },
  
  midjourney: {
    vehicleConsistency: 8,
    cameraLock: 3,
    instructionCompliance: 4,
    bestFor: [
      'Hero stills',
      'Dramatic compositions',
      'Reference images for video workflows'
    ],
    weaknesses: [
      'Ignores camera position instructions',
      'Chooses "dramatic" over specified angles',
      'Screen direction unreliable',
      'Stills only'
    ],
    notes: 'Best for stills. Use with seed for consistency, then animate in Kling/Veo.'
  },
  
  runway: {
    vehicleConsistency: 7,
    cameraLock: 7,
    instructionCompliance: 7,
    bestFor: [
      'Image-to-video workflows',
      'Character reference',
      'Extending existing footage'
    ],
    weaknesses: [
      'Lower vehicle accuracy than dedicated platforms'
    ],
    notes: 'Solid for image-to-video. Character reference features emerging.'
  },
  
  flux: {
    vehicleConsistency: 8,
    cameraLock: 6,
    instructionCompliance: 7,
    bestFor: [
      'Still images',
      'Photorealistic renders'
    ],
    weaknesses: [
      'Stills only'
    ],
    notes: 'Quality stills, alternative to Midjourney.'
  }
};

/**
 * Get platform recommendation based on shot type and requirements.
 */
function getPlatformRecommendation(
  shotType: ShotType,
  outputType: 'video' | 'still',
  requirements?: { needsCameraLock?: boolean; needsVehicleAccuracy?: boolean }
): string {
  if (outputType === 'still') {
    return 'midjourney or flux';
  }
  
  // Video recommendations by shot type
  const recommendations: Record<ShotType, string> = {
    lateral_track: 'veo3 (broadcast) or kling (dynamic backgrounds)',
    lateral_track_wide: 'veo3 or kling',
    wide_establish: 'veo3',
    follow_behind: 'kling',
    static_hero: 'veo3 (with explicit background motion)',
    interior: 'veo3',
    detail: 'veo3',
    auto: 'veo3'
  };
  
  return recommendations[shotType] || 'veo3';
}


// ============================================================================
// SHOT TYPE REQUIREMENTS - What each shot needs from a platform
// Used for weighted prediction scoring
// ============================================================================

interface ShotRequirements {
  cameraLockImportance: number;      // 0-10: How critical is camera lock
  vehicleConsistencyImportance: number;  // 0-10: How critical is vehicle accuracy
  instructionComplianceImportance: number;  // 0-10: How literal must execution be
  motionComplexity: number;          // 0-10: How complex is the motion
  optimalDurationMin: number;        // Seconds
  optimalDurationMax: number;        // Seconds
  prefersDynamicBackground: boolean;
  prefersStaticCamera: boolean;
}

const SHOT_REQUIREMENTS: Record<ShotType, ShotRequirements> = {
  lateral_track: {
    cameraLockImportance: 10,        // Critical - camera must not drift
    vehicleConsistencyImportance: 9, // High - vehicle visible entire shot
    instructionComplianceImportance: 9,
    motionComplexity: 6,
    optimalDurationMin: 5,
    optimalDurationMax: 10,
    prefersDynamicBackground: true,
    prefersStaticCamera: false
  },
  
  lateral_track_wide: {
    cameraLockImportance: 9,
    vehicleConsistencyImportance: 8,
    instructionComplianceImportance: 8,
    motionComplexity: 5,
    optimalDurationMin: 5,
    optimalDurationMax: 12,
    prefersDynamicBackground: true,
    prefersStaticCamera: false
  },
  
  wide_establish: {
    cameraLockImportance: 10,        // Camera must be locked/static
    vehicleConsistencyImportance: 6, // Vehicle smaller in frame
    instructionComplianceImportance: 8,
    motionComplexity: 4,
    optimalDurationMin: 5,
    optimalDurationMax: 15,
    prefersDynamicBackground: false,
    prefersStaticCamera: true
  },
  
  follow_behind: {
    cameraLockImportance: 8,
    vehicleConsistencyImportance: 9,
    instructionComplianceImportance: 8,
    motionComplexity: 5,
    optimalDurationMin: 5,
    optimalDurationMax: 10,
    prefersDynamicBackground: true,
    prefersStaticCamera: false
  },
  
  static_hero: {
    cameraLockImportance: 10,        // Absolutely locked
    vehicleConsistencyImportance: 10, // Hero shot - must be perfect
    instructionComplianceImportance: 9,
    motionComplexity: 2,             // Low - vehicle stationary
    optimalDurationMin: 5,
    optimalDurationMax: 10,
    prefersDynamicBackground: false, // Need subtle background motion
    prefersStaticCamera: true
  },
  
  interior: {
    cameraLockImportance: 8,
    vehicleConsistencyImportance: 7,
    instructionComplianceImportance: 8,
    motionComplexity: 4,
    optimalDurationMin: 5,
    optimalDurationMax: 10,
    prefersDynamicBackground: false,
    prefersStaticCamera: false
  },
  
  detail: {
    cameraLockImportance: 9,
    vehicleConsistencyImportance: 10, // Detail must be accurate
    instructionComplianceImportance: 9,
    motionComplexity: 2,
    optimalDurationMin: 3,
    optimalDurationMax: 7,
    prefersDynamicBackground: false,
    prefersStaticCamera: true
  },
  
  auto: {
    cameraLockImportance: 7,
    vehicleConsistencyImportance: 8,
    instructionComplianceImportance: 7,
    motionComplexity: 5,
    optimalDurationMin: 5,
    optimalDurationMax: 10,
    prefersDynamicBackground: false,
    prefersStaticCamera: false
  }
};


// ============================================================================
// PLATFORM PREDICTION - Validated December 25-26, 2024
// Weighted scoring to predict success rate by platform
// ============================================================================

/**
 * Calculate success prediction for a specific platform given shot requirements.
 * Returns confidence score 0-100.
 */
function calculatePlatformScore(
  platform: string,
  shotType: ShotType,
  duration: number,
  outputType: 'video' | 'still',
  userInput: string
): { score: number; factors: PredictionFactors; warnings: string[] } {
  
  const caps = PLATFORM_CAPABILITIES[platform];
  const reqs = SHOT_REQUIREMENTS[shotType];
  const warnings: string[] = [];
  
  if (!caps || !reqs) {
    return { 
      score: 50, 
      factors: { shotTypeMatch: 50, durationFit: 50, cameraRequirement: 50, platformStrength: 50 },
      warnings: ['Unknown platform or shot type']
    };
  }
  
  // Factor 1: Camera Lock Match (weight: 30%)
  // Compare platform's camera lock ability vs shot's requirement
  const cameraLockScore = Math.min(100, (caps.cameraLock / 10) * 100);
  const cameraLockWeight = reqs.cameraLockImportance / 10;
  const cameraRequirement = cameraLockScore * cameraLockWeight + (100 * (1 - cameraLockWeight));
  
  if (reqs.cameraLockImportance >= 9 && caps.cameraLock < 8) {
    warnings.push(`${platform} may drift on camera-critical shots`);
  }
  
  // Factor 2: Vehicle Consistency Match (weight: 25%)
  const vehicleScore = Math.min(100, (caps.vehicleConsistency / 10) * 100);
  const vehicleWeight = reqs.vehicleConsistencyImportance / 10;
  const shotTypeMatch = vehicleScore * vehicleWeight + (100 * (1 - vehicleWeight));
  
  if (reqs.vehicleConsistencyImportance >= 9 && caps.vehicleConsistency < 8) {
    warnings.push(`${platform} may show vehicle inconsistency`);
  }
  
  // Factor 3: Duration Fit (weight: 20%)
  let durationFit = 100;
  if (duration < reqs.optimalDurationMin) {
    durationFit = 70; // Too short - may not complete action
    warnings.push('Duration may be too short for this shot type');
  } else if (duration > reqs.optimalDurationMax) {
    durationFit = 60; // Too long - consistency degrades
    warnings.push('Duration exceeds optimal range - consistency may degrade');
  }
  
  // Platform-specific duration bonuses
  if (platform === 'kling' && duration >= 8 && duration <= 10) {
    durationFit = Math.min(100, durationFit + 15); // Kling's sweet spot
  }
  if (platform === 'veo3' && duration <= 8) {
    durationFit = Math.min(100, durationFit + 10);
  }
  if (platform === 'sora' && duration > 10) {
    durationFit = Math.min(100, durationFit + 5); // Sora handles longer clips
  }
  
  // Factor 4: Platform Strength for This Use Case (weight: 25%)
  let platformStrength = (caps.instructionCompliance / 10) * 100;
  
  // Boost for platform's best-for matches
  const lowerInput = userInput.toLowerCase();
  
  if (platform === 'veo3') {
    if (reqs.prefersStaticCamera) platformStrength += 10;
    if (shotType === 'lateral_track' || shotType === 'lateral_track_wide') platformStrength += 10;
    if (shotType === 'static_hero') platformStrength += 5; // Good but needs background motion hint
  }
  
  if (platform === 'kling') {
    if (reqs.prefersDynamicBackground) platformStrength += 15;
    if (shotType === 'follow_behind') platformStrength += 10;
    if (lowerInput.includes('ocean') || lowerInput.includes('waves') || lowerInput.includes('weather')) {
      platformStrength += 10;
    }
  }
  
  if (platform === 'sora') {
    if (lowerInput.includes('cinematic') || lowerInput.includes('mood')) platformStrength += 10;
    if (lowerInput.includes('person') || lowerInput.includes('human') || lowerInput.includes('people')) {
      platformStrength += 15; // Sora better for human motion
    }
    // Penalty for precision-required shots
    if (reqs.cameraLockImportance >= 9) platformStrength -= 15;
  }
  
  if (platform === 'minimax') {
    if (shotType === 'lateral_track' || shotType === 'lateral_track_wide') platformStrength += 10;
  }
  
  // Stills platforms
  if (outputType === 'still') {
    if (platform === 'midjourney' || platform === 'flux') {
      platformStrength = 90;
    } else {
      platformStrength = 30; // Video platforms for stills
    }
  } else {
    // Video output on stills platform
    if (platform === 'midjourney' || platform === 'flux') {
      platformStrength = 0;
      warnings.push(`${platform} does not generate video`);
    }
  }
  
  platformStrength = Math.min(100, Math.max(0, platformStrength));
  
  // Calculate weighted final score
  const finalScore = Math.round(
    (cameraRequirement * 0.30) +
    (shotTypeMatch * 0.25) +
    (durationFit * 0.20) +
    (platformStrength * 0.25)
  );
  
  return {
    score: Math.min(100, Math.max(0, finalScore)),
    factors: {
      shotTypeMatch: Math.round(shotTypeMatch),
      durationFit: Math.round(durationFit),
      cameraRequirement: Math.round(cameraRequirement),
      platformStrength: Math.round(platformStrength)
    },
    warnings
  };
}

/**
 * Generate success prediction with platform recommendation.
 * Returns recommended platform, confidence, alternatives, and rationale.
 */
export function predictSuccess(
  shotType: ShotType,
  duration: number,
  outputType: 'video' | 'still',
  userInput: string,
  requestedPlatform?: string
): PlatformPrediction {
  
  // Video platforms to evaluate
  const videoPlatforms = ['veo3', 'kling', 'sora', 'minimax', 'runway'];
  const stillPlatforms = ['midjourney', 'flux'];
  
  const platformsToEvaluate = outputType === 'still' ? stillPlatforms : videoPlatforms;
  
  // Score all platforms
  const scores: { platform: string; score: number; factors: PredictionFactors; warnings: string[] }[] = [];
  
  for (const platform of platformsToEvaluate) {
    const result = calculatePlatformScore(platform, shotType, duration, outputType, userInput);
    scores.push({ platform, ...result });
  }
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  const best = scores[0];
  const alternatives = scores.slice(1, 3).map(s => ({
    platform: s.platform,
    confidence: s.score,
    note: generateAlternativeNote(s.platform, shotType, s.factors)
  }));
  
  // Generate rationale for top pick
  const rationale = generateRationale(best.platform, shotType, best.factors, duration);
  
  // Collect all warnings
  let allWarnings = [...best.warnings];
  
  // Add warning if user's requested platform isn't the best
  if (requestedPlatform && requestedPlatform !== best.platform) {
    const requestedScore = scores.find(s => s.platform === requestedPlatform);
    if (requestedScore && requestedScore.score < best.score - 10) {
      allWarnings.push(
        `${requestedPlatform} scores ${requestedScore.score}% vs ${best.platform} at ${best.score}%. Consider switching.`
      );
    }
  }
  
  return {
    recommendedPlatform: best.platform,
    confidence: best.score,
    rationale,
    alternatives,
    warnings: allWarnings,
    factors: best.factors
  };
}

/**
 * Generate human-readable rationale for platform recommendation.
 */
function generateRationale(
  platform: string, 
  shotType: ShotType, 
  factors: PredictionFactors,
  duration: number
): string {
  const caps = PLATFORM_CAPABILITIES[platform];
  if (!caps) return `${platform} selected based on available data.`;
  
  const strengths: string[] = [];
  
  // Camera lock
  if (caps.cameraLock >= 9) {
    strengths.push('excellent camera lock');
  }
  
  // Vehicle consistency
  if (caps.vehicleConsistency >= 9) {
    strengths.push('high vehicle consistency');
  }
  
  // Shot type specific
  const shotNames: Record<ShotType, string> = {
    lateral_track: 'lateral tracking shots',
    lateral_track_wide: 'wide tracking shots',
    wide_establish: 'establishing shots',
    follow_behind: 'follow shots',
    static_hero: 'static hero shots',
    interior: 'interior shots',
    detail: 'detail shots',
    auto: 'general shots'
  };
  
  if (platform === 'veo3') {
    strengths.push('broadcast-grade literal execution');
  } else if (platform === 'kling') {
    strengths.push('dynamic backgrounds');
    if (duration >= 8 && duration <= 10) {
      strengths.push('optimal 10s duration range');
    }
  } else if (platform === 'sora') {
    strengths.push('cinematic interpretation');
  } else if (platform === 'minimax') {
    strengths.push('clinical precision');
  }
  
  if (strengths.length === 0) {
    return `${platform} is a reasonable choice for ${shotNames[shotType]}.`;
  }
  
  return `${platform} excels at ${shotNames[shotType]} with ${strengths.join(', ')}.`;
}

/**
 * Generate note explaining why an alternative platform might be considered.
 */
function generateAlternativeNote(
  platform: string, 
  shotType: ShotType,
  factors: PredictionFactors
): string {
  if (platform === 'kling') {
    return 'Better for dynamic backgrounds (waves, weather)';
  } else if (platform === 'veo3') {
    return 'More literal execution, stricter camera lock';
  } else if (platform === 'sora') {
    return 'Better for mood pieces and human motion';
  } else if (platform === 'minimax') {
    return 'Clinical precision via Freepik aggregator';
  } else if (platform === 'runway') {
    return 'Better for image-to-video workflows';
  } else if (platform === 'midjourney') {
    return 'Best for hero stills with seed consistency';
  } else if (platform === 'flux') {
    return 'Photorealistic stills alternative';
  }
  return 'Alternative option';
}


// ============================================================================
// DEFAULT APPLICATION - Validated December 24-25, 2024
// Apply sensible defaults unless user specifies otherwise.
// ============================================================================

interface AppliedDefaults {
  occupancy: string;
  screenDirection: string;
  roadType: string;
  lighting: string;
  modifications: string[];
}

/**
 * Apply validated defaults to user input.
 * Defaults: single driver w/ sunglasses, screen-left-to-right, straight road, golden hour.
 */
function applyDefaults(
  userInput: string, 
  shotType: ShotType,
  screenDirection?: 'left-to-right' | 'right-to-left'
): AppliedDefaults {
  const template = SHOT_TEMPLATES[shotType] || SHOT_TEMPLATES.auto;
  const lowerInput = userInput.toLowerCase();
  const modifications: string[] = [];
  
  // Occupancy default: single driver with sunglasses
  let occupancy = template.defaultOccupancy;
  const occupancyKeywords = ['passenger', 'passengers', 'empty', 'no driver', 'family', 'couple', 'two people'];
  const hasOccupancy = occupancyKeywords.some(k => lowerInput.includes(k));
  if (!hasOccupancy && !lowerInput.includes('driver')) {
    modifications.push('Applied default: single driver with sunglasses');
  } else if (hasOccupancy) {
    occupancy = '(user specified)';
  }
  
  // Screen direction default: left-to-right
  let finalScreenDirection = screenDirection === 'right-to-left' 
    ? 'traveling screen-right to screen-left' 
    : template.defaultScreenDirection;
  
  const directionKeywords = ['left to right', 'right to left', 'left-to-right', 'right-to-left'];
  const hasDirection = directionKeywords.some(k => lowerInput.includes(k));
  if (!hasDirection && !screenDirection) {
    modifications.push('Applied default: screen-left to screen-right');
  }
  
  // Road type default: straight or gentle curves
  let roadType = 'Straight road section, gentle curves only.';
  const curveKeywords = ['winding', 'curves', 'mountain road', 'switchback', 'serpentine'];
  const hasCurves = curveKeywords.some(k => lowerInput.includes(k));
  if (hasCurves) {
    roadType = '(user specified winding road)';
  } else if (!lowerInput.includes('road') && !lowerInput.includes('highway')) {
    modifications.push('Applied default: straight road, gentle curves');
  }
  
  // Lighting default: golden hour
  let lighting = 'Golden hour sunlight, warm tones.';
  const lightingKeywords = ['night', 'noon', 'midday', 'overcast', 'rain', 'sunset', 'sunrise', 'blue hour', 'studio'];
  const hasLighting = lightingKeywords.some(k => lowerInput.includes(k));
  if (!hasLighting && !lowerInput.includes('golden hour')) {
    modifications.push('Applied default: golden hour lighting');
  } else if (hasLighting) {
    lighting = '(user specified)';
  }
  
  return {
    occupancy,
    screenDirection: finalScreenDirection,
    roadType,
    lighting,
    modifications
  };
}


// ============================================================================
// SYSTEM PROMPT BUILDER
// ============================================================================

function buildSystemPrompt(
  brandContext: BrandContext,
  platform: string,
  outputType: string,
  duration: number,
  shotType: ShotType
): string {
  const complexityBudget = getComplexityBudget(duration);
  const template = getShotTemplate(shotType, platform);
  const platformCaps = PLATFORM_CAPABILITIES[platform] || PLATFORM_CAPABILITIES.veo3;
  
  let learnedPatternSection = '';
  if (brandContext.learnedPatterns.length > 0) {
    const patterns = brandContext.learnedPatterns
      .filter(p => p.confidence > 0.6)
      .slice(0, 5)
      .map(p => `- ${p.patternType}: ${p.patternValue} (used ${p.timesUsed}x)`)
      .join('\n');
    if (patterns) {
      learnedPatternSection = `

## Learned Preferences for ${brandContext.brandName}
${patterns}
Apply these learned preferences when relevant.`;
    }
  }
  
  return `You are Continuum, a professional broadcast production AI. You generate ${outputType} prompts optimized for ${platform}.

## CRITICAL: Motion-First Methodology
For video prompts, structure is MANDATORY:
1. FIRST SENTENCE: Primary motion/movement directive
2. SECOND: Camera behavior/mounting specification  
3. THIRD: Subject description
4. FOURTH: Environment and lighting
5. FIFTH: Technical specifications
6. FINAL SENTENCE: Reinforce primary motion (prevents end-of-clip freeze)

This ordering is validated to produce 85%+ first-generation success rate.

## DURATION-COMPLEXITY RULES (Validated Dec 2024)
Duration: ${duration} seconds
Maximum Actions: ${complexityBudget.maxActions}
Maximum Camera Changes: ${complexityBudget.maxCameraChanges}
Maximum Reveals: ${complexityBudget.maxReveals}
Pacing: ${complexityBudget.pacingGuidance}
${complexityBudget.warning ? `⚠️ WARNING: ${complexityBudget.warning}` : ''}

EXCEEDING THIS BUDGET CAUSES TELEPORTATION/SCENE DRIFT. DO NOT EXCEED.

## SHOT TEMPLATE: ${template.name}
Camera: ${template.cameraInstruction}
Framing: ${template.framingGuidance}
Motion: ${template.motionGuidance}
Default Occupancy: ${template.defaultOccupancy}
Default Direction: ${template.defaultScreenDirection}

NEGATIVE CONSTRAINTS (include these):
${template.negativeConstraints.map(c => `- ${c}`).join('\n')}

## PLATFORM: ${platform.toUpperCase()}
${platformCaps.notes}
Best for: ${platformCaps.bestFor.join(', ')}
${platformCaps.weaknesses.length > 0 ? `Watch for: ${platformCaps.weaknesses.join(', ')}` : ''}

## CAMERA LANGUAGE (Validated Dec 2024)
USE: "Camera mounted on tracking vehicle's left side"
NOT: "parallel tracking shot" or "lateral tracking"
Mounting language produces better camera lock than behavioral descriptions.

## TECHNICAL SPECIFICATIONS
Always include:
- Shallow depth of field
- Motion blur on background (not subject)
- Frame rate: 24fps for cinematic
- Specific time of day lighting

## BRAND CONTEXT: ${brandContext.brandName}
${brandContext.brandDescription}
${brandContext.guidelines.length > 0 ? `Guidelines: ${brandContext.guidelines.join(', ')}` : ''}
${learnedPatternSection}

## OUTPUT FORMAT
Generate a single prompt paragraph. No headers, no bullet points, no formatting.
The prompt should flow naturally as continuous prose.
Include all technical specifications inline.
End with motion reinforcement to prevent freeze.`;
}


// ============================================================================
// BRAND CONTEXT LOADER
// ============================================================================

async function loadBrandContext(brandId: string, userId: string): Promise<BrandContext | null> {
  // Get brand profile
  const { data: brand, error: brandError } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('brand_id', brandId)
    .eq('user_id', userId)
    .single();

  if (brandError || !brand) return null;

  // Get learned patterns (brand intelligence)
  const { data: patterns } = await supabase
    .from('brand_intelligence')
    .select('pattern_type, pattern_value, confidence_score, times_applied')
    .eq('brand_id', brandId)
    .order('confidence_score', { ascending: false })
    .limit(20);

  // Get recent prompts for context (last 10, with feedback)
  const { data: recentPrompts } = await supabase
    .from('prompts')
    .select('prompt_text, user_input, feedback_rating, platform')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    brandId: brand.brand_id,
    brandName: brand.brand_name,
    brandDescription: brand.brand_description || '',
    guidelines: brand.guidelines || [],
    learnedPatterns: (patterns || []).map(p => ({
      patternType: p.pattern_type,
      patternValue: p.pattern_value,
      confidence: p.confidence_score,
      timesUsed: p.times_applied
    })),
    recentPrompts: (recentPrompts || []).map(p => ({
      promptText: p.prompt_text,
      userInput: p.user_input,
      feedback: p.feedback_rating,
      platform: p.platform
    }))
  };
}


// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

export async function generatePrompt(request: GenerationRequest): Promise<GenerationResult> {
  try {
    // Load brand context
    const brandContext = await loadBrandContext(request.brandId, request.userId);
    if (!brandContext) {
      return { success: false, error: 'Brand not found or access denied' };
    }

    // Apply TOS translation
    const tosResult = translateForTOS(request.userInput);
    
    // Determine duration (default 7s for video)
    const duration = request.duration || (request.outputType === 'video' ? 7 : 0);
    
    // Get complexity budget
    const complexityBudget = getComplexityBudget(duration);
    
    // Determine shot type
    const shotType = request.shotType || 'auto';
    
    // Apply defaults
    const defaults = applyDefaults(
      tosResult.translatedInput, 
      shotType,
      request.screenDirection
    );
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      brandContext,
      request.platform,
      request.outputType,
      duration,
      shotType
    );

    // Build user message with translated input and defaults
    let userMessage = tosResult.translatedInput;
    
    if (defaults.modifications.length > 0) {
      userMessage += `\n\n[Defaults applied: ${defaults.modifications.join('; ')}]`;
    }
    
    if (defaults.occupancy !== '(user specified)') {
      userMessage += `\nOccupancy: ${defaults.occupancy}`;
    }
    if (defaults.screenDirection !== '(user specified)') {
      userMessage += `\nDirection: ${defaults.screenDirection}`;
    }
    if (defaults.roadType !== '(user specified winding road)') {
      userMessage += `\nRoad: ${defaults.roadType}`;
    }
    if (defaults.lighting !== '(user specified)') {
      userMessage += `\nLighting: ${defaults.lighting}`;
    }

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    });

    // Extract prompt text
    const promptText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Store prompt in database
    const { data: promptRecord, error: insertError } = await supabase
      .from('prompts')
      .insert({
        session_id: request.sessionId,
        brand_id: request.brandId,
        user_input: request.userInput,
        prompt_text: promptText,
        platform: request.platform,
        shot_type: shotType,
        clip_duration: duration,
        tos_translated: tosResult.wasTranslated,
        brand_detected: tosResult.brandDetected
      })
      .select('prompt_id')
      .single();

    if (insertError) {
      console.error('Failed to store prompt:', insertError);
    }

    // Get platform recommendation
    const platformRec = getPlatformRecommendation(shotType, request.outputType);

    // Generate success prediction
    const prediction = predictSuccess(
      shotType,
      duration,
      request.outputType,
      request.userInput,
      request.platform
    );

    return {
      success: true,
      promptText,
      promptId: promptRecord?.prompt_id,
      platformRecommendation: platformRec,
      tosTranslated: tosResult.wasTranslated,
      brandDetected: tosResult.brandDetected || undefined,
      complexityWarning: complexityBudget.warning,
      prediction,
      technicalNotes: `Duration: ${duration}s | Shot: ${shotType} | Platform: ${request.platform} | Confidence: ${prediction.confidence}%`
    };

  } catch (error) {
    console.error('Prompt generation failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}


// ============================================================================
// FEEDBACK LEARNING
// ============================================================================

export async function processPromptFeedback(
  promptId: string,
  feedback: 'great' | 'good' | 'bad',
  failureCategory?: string,
  notes?: string
): Promise<void> {
  // Update prompt with feedback
  await supabase
    .from('prompts')
    .update({
      feedback_rating: feedback,
      failure_category: failureCategory,
      feedback_notes: notes,
      feedback_at: new Date().toISOString()
    })
    .eq('prompt_id', promptId);

  // If feedback is positive, learn from the prompt
  if (feedback === 'great' || feedback === 'good') {
    const { data: prompt } = await supabase
      .from('prompts')
      .select('*')
      .eq('prompt_id', promptId)
      .single();

    if (prompt) {
      await learnFromSuccessfulPrompt(prompt);
    }
  }
}

async function learnFromSuccessfulPrompt(prompt: any): Promise<void> {
  const patterns: { type: string; value: string }[] = [];

  // Extract camera type patterns
  const cameraTypes = [
    'lateral tracking', 'follow behind', 'wide establishing', 
    'static hero', 'interior', 'detail', 'macro',
    'aerial', 'drone', 'mounted on left', 'mounted on right'
  ];
  for (const camera of cameraTypes) {
    if (prompt.prompt_text.toLowerCase().includes(camera)) {
      patterns.push({ type: 'camera_type', value: camera });
    }
  }

  // Extract lighting patterns
  const lightingTypes = [
    'golden hour', 'blue hour', 'studio lighting', 'natural light', 
    'dramatic lighting', 'sunset', 'overcast', 'night'
  ];
  for (const light of lightingTypes) {
    if (prompt.prompt_text.toLowerCase().includes(light)) {
      patterns.push({ type: 'lighting', value: light });
    }
  }

  // Extract motion patterns
  const motionTypes = [
    'steady', 'smooth', 'fast', 'slow', 'accelerating', 
    'cruising', 'drifting', 'cornering'
  ];
  for (const motion of motionTypes) {
    if (prompt.prompt_text.toLowerCase().includes(motion)) {
      patterns.push({ type: 'motion_style', value: motion });
    }
  }

  // Extract screen direction
  if (prompt.prompt_text.toLowerCase().includes('left to right') || 
      prompt.prompt_text.toLowerCase().includes('left-to-right')) {
    patterns.push({ type: 'screen_direction', value: 'left-to-right' });
  }
  if (prompt.prompt_text.toLowerCase().includes('right to left') ||
      prompt.prompt_text.toLowerCase().includes('right-to-left')) {
    patterns.push({ type: 'screen_direction', value: 'right-to-left' });
  }

  // Store learned patterns
  for (const pattern of patterns) {
    const { data: existing } = await supabase
      .from('brand_intelligence')
      .select('intelligence_id, times_applied, confidence_score')
      .eq('brand_id', prompt.brand_id)
      .eq('pattern_type', pattern.type)
      .eq('pattern_value', pattern.value)
      .single();

    if (existing) {
      // Increment existing pattern
      await supabase
        .from('brand_intelligence')
        .update({
          times_applied: existing.times_applied + 1,
          confidence_score: Math.min(1.0, existing.confidence_score + 0.1),
          updated_at: new Date().toISOString()
        })
        .eq('intelligence_id', existing.intelligence_id);
    } else {
      // Create new pattern
      await supabase
        .from('brand_intelligence')
        .insert({
          brand_id: prompt.brand_id,
          pattern_type: pattern.type,
          pattern_value: pattern.value,
          confidence_score: 0.5,
          times_applied: 1,
          source: 'user_feedback'
        });
    }
  }
}
