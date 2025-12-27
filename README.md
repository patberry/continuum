# Continuum Week 2: Credit System + Claude API

## Files to Add

Copy these files into your existing project:

```
continuum-code/
├── lib/
│   ├── credits.ts      ← NEW: Credit system
│   ├── sessions.ts     ← NEW: Session management
│   └── claude.ts       ← NEW: Claude API integration
├── app/
│   └── api/
│       ├── sessions/
│       │   └── route.ts   ← NEW: Session endpoints
│       ├── generate/
│       │   └── route.ts   ← NEW: Prompt generation
│       ├── credits/
│       │   └── route.ts   ← NEW: Balance check
│       └── feedback/
│           └── route.ts   ← NEW: Learning feedback
└── .env.local             ← UPDATE: Add ANTHROPIC_API_KEY
```

## Setup Steps

### 1. Install Anthropic SDK
```bash
npm install @anthropic-ai/sdk
```

### 2. Get Anthropic API Key
1. Go to https://console.anthropic.com
2. Create an API key
3. Add to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-xxx
```

### 3. Add Database Function (Optional - for cleaner credit updates)

Run this in Supabase SQL Editor:
```sql
-- Helper function for incrementing credits used
CREATE OR REPLACE FUNCTION increment_credits_used(amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN amount;
END;
$$ LANGUAGE plpgsql;
```

## API Usage

### Check Credit Balance
```javascript
GET /api/credits

Response:
{
  "credits": {
    "monthly": 50,
    "topup": 0,
    "total": 50
  }
}
```

### Create Session (before generating)
```javascript
POST /api/sessions
Body: { "brandId": "uuid-here" }

Response:
{
  "session": {
    "sessionId": "uuid",
    "brandId": "uuid",
    "status": "active",
    ...
  },
  "costEstimate": 10,
  "message": "Session created. First prompt will cost 10 credits."
}
```

### Generate Prompt
```javascript
POST /api/generate
Body: {
  "userInput": "Porsche 911 driving on coastal highway at sunset",
  "platform": "veo3",        // veo3, sora, midjourney, flux
  "outputType": "video",     // video, still
  "sessionId": "uuid-from-session"
}

Response:
{
  "success": true,
  "prompt": {
    "id": "uuid",
    "text": "A sleek Porsche 911 carves through...",
    "platform": "veo3",
    "outputType": "video",
    "technicalNotes": "Optimized for veo3 video generation"
  },
  "credits": {
    "cost": 10,
    "remaining": 40,
    "isFirstPrompt": true,
    "multiplier": "1x (0-10 min)"
  }
}
```

### Submit Feedback (powers learning)
```javascript
POST /api/feedback
Body: {
  "promptId": "uuid",
  "rating": "great"  // great, good, bad
}

Response:
{
  "success": true,
  "message": "🧠 Recording... This pattern will be remembered."
}
```

### Close Session
```javascript
DELETE /api/sessions

Response:
{
  "message": "Session closed",
  "summary": {
    "promptCount": 5,
    "totalCreditsUsed": 18,
    "duration": "12 minutes"
  }
}
```

## Credit Pricing

| Action | Cost | Notes |
|--------|------|-------|
| First prompt in session | 10 credits | Base session cost |
| Each iteration | 2 credits | Refinements |
| Time multiplier 0-10 min | 1x | Standard rate |
| Time multiplier 10-20 min | 1.5x | Slight premium |
| Time multiplier 20-30 min | 2x | Incentivizes efficiency |

Example: 5 prompts over 15 minutes = 10 + (4 × 2 × 1.5) = 22 credits

## The Learning System

When users rate prompts as "great":
1. Pattern extraction runs on the prompt
2. Camera angles, lighting, etc. are identified
3. Patterns stored in `brand_intelligence` table
4. Future prompts for that brand incorporate learned patterns

This is how Continuum "gets smarter with every commercial."

---

## Next Steps (Week 3+)

- [ ] UI for session/generate flow
- [ ] Credit display component
- [ ] Feedback buttons (👍 Great / 👌 Good / 👎 Bad)
- [ ] Session timer with multiplier display
