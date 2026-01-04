export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto px-8 py-20">
        
        {/* Hero Section */}
        <div className="mb-16">
          <h1 
            className="text-6xl font-bold mb-6" 
            style={{ 
              fontFamily: 'JetBrains Mono, monospace',
              color: '#00FF87' 
            }}
          >
            CONTINUUM
          </h1>
          
          <p className="text-2xl text-white mb-8 font-semibold">
            Production infrastructure for the AI era.
          </p>
          
          <div className="bg-gray-900 border-l-4 border-[#00FF87] p-8 mb-8">
            <p className="text-xl text-gray-300 mb-4">
              <span className="text-white font-semibold">Month one,</span> we help you create broadcast-quality content.
            </p>
            <p className="text-xl text-gray-300">
              <span className="text-white font-semibold">Month twelve,</span> we know your brands better than junior creatives.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <a 
              href="/dashboard/brands"
              className="px-8 py-4 bg-[#00FF87] text-black font-bold rounded hover:bg-[#00DD75] transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Start Building Your Intelligence
            </a>
            <a 
              href="#methodology"
              className="px-8 py-4 border-2 border-[#00FF87] text-[#00FF87] font-bold rounded hover:bg-[#00FF87] hover:text-black transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Our Methodology
            </a>
          </div>
        </div>

        <hr className="border-gray-800 mb-16" />

        {/* The Real Problem */}
        <section className="mb-16">
          <h2 
            className="text-3xl font-bold mb-6 text-white"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            The Real Problem with AI Video
          </h2>
          
          <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
            <p>
              In 2024, tools like Google Veo and OpenAI Sora reached broadcast quality GenAI video. They solved the generation problem but created new ones regarding consistency and workflow.
            </p>
            
            <p>
              Most tools treat AI video generation as a one-off transaction: you describe what you want, the AI generates it, and all context disappears. This fails in professional production, which demands frame-to-frame continuity across hundreds of shots—the same lighting temperature, motion cadence, and visual language.
            </p>
            
            <p>
              Currently, every generation starts fresh. Agencies waste time manually reconstructing institutional knowledge and reinventing prompts that worked perfectly last month.
            </p>
            
            <p className="text-xl text-[#00FF87] font-semibold pt-4">
              Continuum isn't a prompt generator. It's brand intelligence infrastructure that gets smarter with every project you create.
            </p>
          </div>
        </section>

        <hr className="border-gray-800 mb-16" />

        {/* The Two Pillars */}
        <section className="mb-16">
          <h2 
            className="text-3xl font-bold mb-8 text-white"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            The Two Pillars of Continuum
          </h2>

          {/* Pillar 1 */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-[#00FF87]">
              1. The Brand Isolation Advantage
            </h3>
            
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              We implement database-level isolation ensuring competitive intelligence—like Porsche and Tesla—never touches.
            </p>

            <ul className="space-y-6">
              <li className="text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">True Security:</span> This isn't marketing copy; it is row-level security policies enforced at the PostgreSQL layer.
              </li>
              <li className="text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">Verifiable:</span> Each brand exists in a cryptographically verified container with immutable audit trails.
              </li>
              <li className="text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">Competitive Edge:</span> For agencies, this creates a massive advantage when pitching new accounts or passing IT diligence.
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-[#00FF87]">
              2. Compounding Intelligence
            </h3>
            
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              Isolation doesn't mean starting over. Within each brand container, Continuum accumulates pattern recognition and builds institutional knowledge. Every prompt you generate becomes data, storing the text, context, and performance feedback.
            </p>

            <ul className="space-y-6">
              <li className="text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">It Learns Preferences:</span> The platform notices you always use 24fps for automotive hero shots, or that Brand X prefers tungsten lighting while Brand Y needs daylight.
              </li>
              <li className="text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">It Optimizes Models:</span> It learns over time which platforms perform better for specific tasks, such as Veo 3 over Sora for complex tracking motion.
              </li>
              <li className="text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">The Data Moat:</span> After a year, you have built proprietary intelligence based on thousands of prompts and learned preferences across brands. This data accumulation creates a genuine competitive advantage that cannot be replicated.
              </li>
            </ul>
          </div>
        </section>

        <hr className="border-gray-800 mb-16" />

        {/* Built for Professional Production */}
        <section id="methodology" className="mb-16">
          <h2 
            className="text-3xl font-bold mb-6 text-white"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Built for Professional Production
          </h2>
          
          <p className="text-gray-300 text-lg mb-12 leading-relaxed">
            This platform exists because the tools that should exist don't. The methodology comes from twenty years of broadcast production experience and systematic testing across multiple AI platforms—not theory or demo videos.
          </p>

          {/* Real-World Validated */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-[#00FF87]">
              Real-World Validated
            </h3>
            
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              Our motion-first methodology was developed through real shoots requiring broadcast technical specs and client approval.
            </p>

            <ul className="space-y-6">
              <li className="text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">Automotive:</span> Proven on a six-shot Porsche Macan Electric commercial that needed to cut together seamlessly.
              </li>
              <li className="text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">Beyond Automotive:</span> Recent testing animated Impressionist paintings with complex, flipbook-style internal movement, validating frame-to-frame consistency for any broadcast-quality content.
              </li>
            </ul>
          </div>

          {/* Extensible Architecture */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-[#00FF87]">
              Extensible Architecture
            </h3>
            
            <p className="text-gray-300 text-lg leading-relaxed">
              Continuum is an intelligence layer that generates prompts for professional tools like Veo and Sora, rather than competing with them. When new AI video platforms launch, your accumulated intelligence transfers automatically; the learning layer is separate from the generation layer.
            </p>
          </div>
        </section>

        <hr className="border-gray-800 mb-16" />

        {/* Why Now */}
        <section className="mb-16">
          <h2 
            className="text-3xl font-bold mb-6 text-white"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Why Now
          </h2>
          
          <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
            <p>
              AI video generation crossed the broadcast quality threshold in late 2024. Production companies are already using these tools for client work, but they are doing it inefficiently—manual iteration, no institutional memory, and no infrastructure.
            </p>
            
            <p>
              Continuum solves the last-mile problem: making AI video generation reliable enough for professional production at scale. The companies that build proprietary intelligence now will have massive advantages as this becomes the standard workflow in 2025–2026.
            </p>
            
            <p className="text-xl text-white font-semibold pt-4">
              We aren't building a tool. We're building infrastructure that gets more valuable the longer you use it.
            </p>
          </div>
        </section>

        <hr className="border-gray-800 mb-16" />

        {/* Footer CTA */}
        <div className="text-center">
          <h2 
            className="text-4xl font-bold mb-8" 
            style={{ 
              fontFamily: 'JetBrains Mono, monospace',
              color: '#00FF87' 
            }}
          >
            CONTINUUM
          </h2>
          
          <div className="flex gap-4 justify-center">
            <a 
              href="mailto:support@continuum.video"
              className="px-8 py-4 border-2 border-[#00FF87] text-[#00FF87] font-bold rounded hover:bg-[#00FF87] hover:text-black transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Contact Us
            </a>
            <a 
              href="/dashboard/brands"
              className="px-8 py-4 bg-[#00FF87] text-black font-bold rounded hover:bg-[#00DD75] transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Login
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
