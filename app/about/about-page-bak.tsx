'use client';

import { useUser } from '@clerk/nextjs';

export default function AboutPage() {
  const { user } = useUser();
  return (
    <>
      <style jsx global>{`
        body {
            font-family: 'Inter', sans-serif;
            background: #000;
            color: #fff;
            line-height: 1.8;
        }

        .site-nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #000;
            border-bottom: 1px solid #1a1a1a;
            padding: 20px 0;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .site-nav-container {
            max-width: 1200px;
            width: 100%;
            padding: 0 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .site-nav-logo {
            height: 40px;
            cursor: pointer;
        }

        .site-nav-logo img {
            height: 100%;
            width: auto;
        }

        .site-nav-right {
            display: flex;
            align-items: center;
            gap: 32px;
        }

        .site-nav-link {
            color: #888;
            text-decoration: none;
            font-size: 15px;
            font-weight: 500;
            transition: color 0.2s;
        }

        .site-nav-link:hover {
            color: #fff;
        }

        .site-nav-link.active {
            color: #ccc;
        }

        .user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: #00FF87;
            font-weight: 600;
            cursor: pointer;
            overflow: hidden;
            border: 1px solid #444;
        }

        .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .about-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 120px 40px 80px;
        }

        .about-header {
            margin-bottom: 80px;
            padding-bottom: 40px;
            border-bottom: 2px solid #00FF87;
        }

        .about-tagline {
            font-size: 48px;
            font-weight: 700;
            color: #00FF87;
            margin-bottom: 10px;
        }

        .about-subtitle {
            font-size: 20px;
            color: #999;
        }

        .about-section {
            margin-bottom: 80px;
        }

        .section-header {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 30px;
            color: #00FF87;
        }

        .lead-text {
            font-size: 22px;
            font-weight: 500;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #fff;
        }

        .body-text {
            font-size: 18px;
            line-height: 1.8;
            margin-bottom: 25px;
            color: #ccc;
        }

        .body-text strong {
            color: #fff;
            font-weight: 600;
        }

        .highlight-box {
            background: linear-gradient(135deg, #001a0d 0%, #000 100%);
            border-left: 4px solid #00FF87;
            padding: 35px;
            margin: 40px 0;
        }

        .highlight-title {
            font-size: 20px;
            font-weight: 700;
            color: #00FF87;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .highlight-content {
            font-size: 18px;
            line-height: 1.7;
            color: #fff;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin: 50px 0;
        }

        .stat-card {
            background: #111;
            border: 1px solid #333;
            padding: 30px;
            text-align: center;
        }

        .stat-value {
            font-family: 'JetBrains Mono', monospace;
            font-size: 48px;
            font-weight: 700;
            color: #00FF87;
            margin-bottom: 10px;
        }

        .stat-label {
            font-size: 14px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .founder-section {
            background: #0a0a0a;
            border: 2px solid #222;
            padding: 50px;
            margin: 60px 0;
        }

        .founder-header {
            font-size: 28px;
            font-weight: 700;
            color: #00FF87;
            margin-bottom: 25px;
        }

        .pull-quote {
            font-size: 28px;
            font-weight: 600;
            line-height: 1.5;
            color: #00FF87;
            padding: 40px 0;
            margin: 50px 0;
            border-top: 2px solid #222;
            border-bottom: 2px solid #222;
            text-align: center;
        }

        .two-col {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 50px;
            margin: 40px 0;
        }

        .col-header {
            font-size: 20px;
            font-weight: 700;
            color: #00FF87;
            margin-bottom: 15px;
        }

        .cta-section {
            background: linear-gradient(135deg, #00FF87 0%, #00cc6a 100%);
            color: #000;
            padding: 60px;
            text-align: center;
            margin-top: 80px;
        }

        .cta-header {
            font-size: 36px;
            font-weight: 800;
            margin-bottom: 20px;
        }

        .cta-text {
            font-size: 20px;
            margin-bottom: 30px;
        }

        .cta-button {
            display: inline-block;
            background: #000;
            color: #00FF87;
            padding: 18px 40px;
            font-size: 18px;
            font-weight: 700;
            text-decoration: none;
            border: 2px solid #000;
            transition: all 0.3s ease;
        }

        .cta-button:hover {
            background: transparent;
            color: #000;
            border-color: #000;
        }

        @media (max-width: 768px) {
            .stats-grid,
            .two-col {
                grid-template-columns: 1fr;
            }

            .section-header {
                font-size: 28px;
            }

            .lead-text {
                font-size: 18px;
            }

            .pull-quote {
                font-size: 22px;
            }
        }
      `}</style>

      {/* Site Navigation */}
      <nav className="site-nav">
        <div className="site-nav-container">
          <a href="/" className="site-nav-logo">
            <img src="/continuum-logo.png" alt="CONTINUUM" />
          </a>
          <div className="site-nav-right">
            <a href="/generate" className="site-nav-link">Generate</a>
            <a href="/dashboard/brands" className="site-nav-link">Brands</a>
            <a href="/about" className="site-nav-link active">About</a>
            <div className="user-avatar">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={user.firstName || 'User'} />
              ) : (
                <span>{user?.firstName?.charAt(0) || 'U'}</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="about-container">
        {/* Header */}
        <div className="about-header">
          <div className="about-tagline">GenAI Brand Intelligence</div>
          <div className="about-subtitle">Production infrastructure for the AI era</div>
        </div>

        {/* Main Intro */}
        <div className="about-section">
          <p className="lead-text">
            Continuum isn&apos;t a prompt generator. It&apos;s brand intelligence infrastructure that gets smarter with every project you create.
          </p>

          <p className="body-text">
            In 2024 Google Veo and OpenAI Sora reached broadcast quality GenAI video. They solved the generation problem, but created three new ones:
          </p>

          <ul style={{ margin: '30px 0 30px 40px', fontSize: '18px', lineHeight: '1.8', color: '#ccc' }}>
            <li style={{ marginBottom: '15px' }}>How do you maintain brand consistency across hundreds of AI-generated shots?</li>
            <li style={{ marginBottom: '15px' }}>How do you ensure that a brand&apos;s signature visual style transfers from one video to the next?</li>
            <li style={{ marginBottom: '15px' }}>How do you prevent hard-won creative knowledge from evaporating after every project?</li>
          </ul>

          <p className="body-text">
            Most tools treat AI video generation as a one-off transaction. You describe what you want, the AI generates it, and all the context disappears. Next time, you start from zero.
          </p>

          <p className="body-text">
            It falls apart completely when you&apos;re managing multiple brands—automotive, fashion, entertainment, artistic—each with distinct visual languages, technical requirements, and competitive sensitivities.
          </p>

          <p className="body-text">
            CONTINUUM treats brand knowledge as infrastructure, not disposable input. The platform learns and remembers from every prompt you generate, every piece of feedback you provide, every successful shot you create.
          </p>

          <p className="body-text">
            Month one, it helps you make broadcast-quality content. Month twelve, it knows your brands better than junior creatives.
          </p>
        </div>

        {/* The Problem */}
        <div className="about-section">
          <h2 className="section-header">The Real Problem</h2>

          <p className="body-text">
            Professional broadcast production demands frame-to-frame continuity. When you&apos;re cutting together a thirty-second commercial from six AI-generated clips, every shot needs to match. Same lighting temperature. Same motion cadence. Same visual language.
          </p>

          <p className="body-text">
            AI video platforms have no idea what happened yesterday.
          </p>

          <p className="body-text">
            They don&apos;t know that Brand A prefers 24fps with hard shadows, or that Brand B&apos;s content always uses slow tracking shots with tungsten lighting.
          </p>

          <p className="body-text">
            Every generation starts fresh.
          </p>

          <p className="body-text">
            Every creative manually reconstructs institutional knowledge.
          </p>

          <p className="body-text">
            Every agency reinvents prompts that worked perfectly last month.
          </p>

          <p className="body-text">
            The inefficiency compounds when you&apos;re managing competitive brands with your conflict agency. Your automotive client&apos;s intelligence can&apos;t accidentally inform work for their competitor.
          </p>

          <p className="body-text">
            But you also can&apos;t just run separate systems because you lose all operational efficiency at scale.
          </p>

          <p className="body-text">
            This problem exists everywhere broadcast-quality AI video meets professional production: automotive commercials, museum exhibitions, fashion campaigns, animation studios, entertainment properties, artistic projects. Any environment where brand consistency matters and starting over each time is economically unsustainable.
          </p>
        </div>

        {/* Brand Isolation Advantage */}
        <div className="highlight-box">
          <div className="highlight-title">The Brand Isolation Advantage</div>
          <div className="highlight-content">
            <p style={{ marginBottom: '20px' }}>
              Continuum implements database-level isolation ensuring Porsche intelligence never touches Tesla data. This isn&apos;t marketing copy—it&apos;s row-level security policies enforced at the PostgreSQL layer. Each brand exists in a cryptographically verified container with immutable audit trails.
            </p>
            <p style={{ marginBottom: '20px' }}>
              For agencies, this creates competitive advantage. When you pitch a new automotive account, you can demonstrate that their brand intelligence will be completely isolated from competitors. When IT does diligence, you can show them the technical architecture proving isolation at the database level, not just application permissions.
            </p>
            <p>
              But here&apos;s what makes it powerful: isolation doesn&apos;t mean starting over. Within each brand container, Continuum accumulates pattern recognition, learns from feedback, and builds institutional knowledge. You get both absolute isolation and continuous learning—something impossible with completely separate systems.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="about-section">
          <h2 className="section-header">How Learning Compounds</h2>

          <p className="body-text">
            Every prompt you generate becomes data. Continuum stores not just the final prompt text, but the context around it: which brand, what shot type, which platform performed best, what iterations you made, how you rated the outcome. This creates a learning layer that improves every future generation.
          </p>

          <p className="body-text">
            After three months, the platform starts recognizing patterns. It notices you always use 24fps for automotive hero shots. It learns that Veo 3 gives you better results than Sora for tracking shots with complex motion. It remembers that Brand X prefers tungsten lighting while Brand Y needs daylight color temperature.
          </p>

          <p className="body-text">
            After a year, you&apos;ve built proprietary intelligence. A thousand prompts, five hundred feedback ratings, learned preferences across twenty brands. The switching cost becomes massive—leave Continuum and you lose all that accumulated knowledge. Start fresh elsewhere and you&apos;re back to manual prompt iteration.
          </p>

          <p className="body-text">
            This is the moat. Not features you can copy. Not technology you can replicate. Data accumulation that compounds over time and creates genuine competitive advantage.
          </p>
        </div>

        <div className="pull-quote">
          &quot;We&apos;re not building a tool. We&apos;re building infrastructure that gets more valuable the longer you use it.&quot;
        </div>

        {/* What Makes It Different */}
        <div className="about-section">
          <h2 className="section-header">Built for Production</h2>

          <div className="two-col">
            <div>
              <div className="col-header">Broadcast Quality Bar</div>
              <p className="body-text">
                Continuum optimizes for broadcast production, not social media volume. The motion-first methodology was developed through real automotive shoots—six-shot commercial sequences that needed to cut together seamlessly for TV. This isn&apos;t theoretical prompt engineering. It&apos;s production knowledge encoded into infrastructure.
              </p>
            </div>
            <div>
              <div className="col-header">Intelligence Layer</div>
              <p className="body-text">
                The platform generates prompts for professional tools like Veo and Sora rather than generating content itself. This positions Continuum as infrastructure, not a competing tool. You maintain creative control and use best-in-class generation platforms. Continuum just makes them smarter.
              </p>
            </div>
          </div>

          <div className="two-col">
            <div>
              <div className="col-header">Extensible Architecture</div>
              <p className="body-text">
                When new AI video platforms launch, your intelligence transfers automatically. The learning layer is separate from the generation layer. Add support for new models in days, not months. Your accumulated brand knowledge works everywhere.
              </p>
            </div>
            <div>
              <div className="col-header">Real-World Tested</div>
              <p className="body-text">
                The methodology comes from twenty years of broadcast production experience and systematic testing across multiple AI platforms. Not theory. Not demo videos. Production work that needed to pass broadcast technical specs and client approval.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">11</div>
            <div className="stat-label">AI Platforms Supported</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">85%+</div>
            <div className="stat-label">Shot Consistency Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">20+</div>
            <div className="stat-label">Years Production Experience</div>
          </div>
        </div>

        {/* Platform Versatility */}
        <div className="about-section">
          <h2 className="section-header">Beyond Automotive</h2>

          <p className="body-text">
            The motion-first methodology isn&apos;t product-specific—it&apos;s video-specific. The same principles that ensure shot-to-shot consistency in automotive commercials work for any broadcast-quality content.
          </p>

          <div className="highlight-box">
            <div className="highlight-title">Proof: Impressionist Art Animation</div>
            <div className="highlight-content">
              <p style={{ marginBottom: '20px' }}>
                Recent testing validated the platform&apos;s versatility: a sequence animating four famous impressionist paintings with flipbook-style internal movement. Sequential artwork presentation, top-to-bottom drawing animation, random brushstroke motion within each piece—all executed with broadcast-level consistency on Veo 3.
              </p>
              <p style={{ marginBottom: '20px' }}>
                Same methodology. Same platform. Different content vertical. Perfect execution.
              </p>
              <p>
                This expands Continuum&apos;s addressable market beyond automotive to animation studios, creative agencies, entertainment brands, art galleries, museums, and fashion houses. Any production environment requiring frame-to-frame consistency across AI-generated sequences.
              </p>
            </div>
          </div>

          <p className="body-text">
            The brand isolation advantage applies equally across verticals. Disney animation style intelligence never touches Pixar style data. Museum A&apos;s collection knowledge remains separate from Museum B&apos;s. Agency creative for competing fashion brands stays completely isolated while both benefit from accumulated pattern recognition within their containers.
          </p>

          <p className="body-text">
            What started as automotive production infrastructure revealed itself as something broader: infrastructure for ANY broadcast-quality AI video content requiring consistency, brand isolation, and institutional knowledge that compounds over time.
          </p>
        </div>

        {/* Founder Story */}
        <div className="founder-section">
          <div className="founder-header">Built by Producers, For Producers</div>
          
          <p className="body-text">
            Continuum was built by someone who spent two decades in the trenches of broadcast production. Not as a developer who learned about video. As a producer who learned to code.
          </p>

          <p className="body-text">
            The founder built an $11 million production company using iterative MVP methodology—ship fast, validate with real clients, compound what works. Managed automotive accounts like Cadillac where broadcast quality isn&apos;t negotiable and continuity failures kill entire campaigns. When AI video platforms reached broadcast quality in 2024, the problem was immediately obvious: these tools had no institutional memory.
          </p>

          <p className="body-text">
            Continuum came from shipping a real project—a six-shot Porsche Macan Electric commercial that needed to cut together seamlessly. The motion-first methodology wasn&apos;t invented in a lab. It was discovered through systematic testing across Veo, Sora, and others, documenting what actually worked versus what the platforms claimed would work.
          </p>

          <p className="body-text">
            But the real revelation came from testing beyond automotive. An impressionist art animation sequence—four famous paintings brought to life with sequential artwork presentation and internal movement—validated that the methodology works for ANY content requiring broadcast-level consistency. The platform that started as automotive infrastructure revealed itself as infrastructure for the entire broadcast AI video market.
          </p>

          <p className="body-text">
            This is production infrastructure built by someone who understands the economics of agency work, the requirements of broadcast technical specs, and the difference between demo reels and deliverable footage. The platform exists because the tools that should exist don&apos;t.
          </p>
        </div>

        {/* The Opportunity */}
        <div className="about-section">
          <h2 className="section-header">Why Now</h2>

          <p className="body-text">
            AI video generation crossed the broadcast quality threshold in late 2024. Google Veo 3 can produce shots that pass technical broadcast specs. OpenAI Sora delivers cinematic lighting. The generation problem is solved. The infrastructure problem is wide open.
          </p>

          <p className="body-text">
            Production companies and agencies are already using these tools for real client work. But they&apos;re doing it inefficiently—manual prompt iteration, no institutional memory, no brand consistency infrastructure. The companies that build proprietary intelligence now will have massive advantages when this becomes standard production workflow in 2025-2026.
          </p>

          <p className="body-text">
            Continuum solves the last-mile problem: making AI video generation reliable enough for professional production at scale. Not by building better models, but by building better infrastructure around the models that already work.
          </p>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <div className="cta-header">Start Building Your Intelligence</div>
          <div className="cta-text">
            Month one, we help you create broadcast-quality content.<br />
            Month twelve, we know your brands better than junior creatives.
          </div>
          <a href="#" className="cta-button">Request Beta Access</a>
        </div>
      </div>
    </>
  );
}
