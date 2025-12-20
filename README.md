\# Continuum



\*\*Gen AI Brand Intelligence Platform\*\*



Continuum is an AI-powered platform that learns brand guidelines and generates optimized prompts for professional AI video generation (Veo, Sora, Runway). Built for broadcast producers, agencies, and brands managing competitive accounts.



\## Key Features



\- \*\*Brand Intelligence Learning\*\*: System remembers and improves with every generation

\- \*\*Complete Brand Isolation\*\*: Each brand profile is cryptographically isolated

\- \*\*Session-Based Pricing\*\*: Credit system with time multipliers

\- \*\*Multi-Model Support\*\*: Works with Veo 3, Sora, Midjourney, and more

\- \*\*Broadcast Quality\*\*: Motion-first methodology for professional production



\## Tech Stack



\- \*\*Frontend\*\*: Next.js 14, React, Tailwind CSS

\- \*\*Backend\*\*: Next.js API Routes, Vercel Serverless

\- \*\*Database\*\*: PostgreSQL (Supabase) with Row-Level Security

\- \*\*Auth\*\*: Clerk

\- \*\*AI\*\*: Claude API (Anthropic)

\- \*\*Payments\*\*: Stripe (planned)



\## Current Status



✅ Week 1 Complete - Brand Management MVP

\- User authentication

\- Brand CRUD operations

\- Database with complete isolation

\- Audit logging



🚧 Week 2 In Progress - Credit System + AI Integration



\## Architecture



\- 10-table PostgreSQL database with brand isolation

\- Row-level security policies

\- Extensible model adapter system

\- Session-based credit tracking with time multipliers



\## Project Background



Built using iterative MVP methodology. Validated with real-world testing on automotive commercials (Porsche, Tesla) using Veo 3 and Sora platforms.



\## Setup

```bash

npm install

\# Add .env.local with Supabase, Clerk, Anthropic keys

npm run dev

```



---



\*\*Built by PM Berry\*\*

