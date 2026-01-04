export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 
            className="text-4xl font-bold mb-4" 
            style={{ 
              fontFamily: 'JetBrains Mono, monospace',
              color: '#00FF87' 
            }}
          >
            Terms of Service
          </h1>
          <p className="text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="space-y-8 text-gray-300">
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Continuum ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to these Terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Beta Program</h2>
              <p>
                Continuum is currently in beta testing. The Service is provided "as is" and "as available" without any warranties. 
                Features may change, be removed, or modified at any time without notice.
              </p>
              <p className="mt-3">
                As a beta user, you acknowledge:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>The Service may contain bugs or errors</li>
                <li>Features are subject to change</li>
                <li>We may reset data or accounts during testing</li>
                <li>Service availability is not guaranteed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Brand Data Ownership</h2>
              <p>
                <span className="text-[#00FF87] font-semibold">You retain complete ownership of your brand data.</span>
              </p>
              <p className="mt-3">
                This includes:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Brand profiles you create</li>
                <li>Prompts you generate</li>
                <li>Feedback and ratings you provide</li>
                <li>Any content created using the Service</li>
              </ul>
              <p className="mt-3">
                Continuum does not claim ownership of your brand intelligence. 
                We use your data solely to provide and improve the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Brand Isolation Guarantee</h2>
              <p className="text-[#00FF87] font-semibold">
                Each brand profile operates within an isolated learning container.
              </p>
              <p className="mt-3">
                We guarantee:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Porsche intelligence never touches Tesla data</li>
                <li>Database-level isolation via Row-Level Security policies</li>
                <li>No cross-contamination between competing brands</li>
                <li>Complete data segregation for agency clients</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to reverse engineer or hack the Service</li>
                <li>Share your account credentials with others</li>
                <li>Use the Service to generate harmful, offensive, or inappropriate content</li>
                <li>Abuse the token system or attempt to manipulate credits</li>
                <li>Scrape or systematically extract data from the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Tokens & Billing</h2>
              <p>
                Beta users receive a token allocation for testing purposes. 
                Token consumption:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Generate new prompt: 10 tokens</li>
                <li>Refine existing prompt: 2 tokens</li>
                <li>Tokens expire 12 months after allocation</li>
              </ul>
              <p className="mt-3">
                Future pricing will be announced before general availability launch.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
                INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                OR NON-INFRINGEMENT.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
              <p>
                CONTINUUM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR 
                PUNITIVE DAMAGES RESULTING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of material changes 
                via email or in-app notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Contact</h2>
              <p>
                Questions about these Terms? Contact us:
              </p>
              <p className="mt-3">
                Email: <a href="mailto:legal@continuum.video" className="text-[#00FF87] hover:underline">legal@continuum.video</a>
              </p>
            </section>

          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <a 
            href="/dashboard/brands" 
            className="text-[#00FF87] hover:underline text-sm"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
