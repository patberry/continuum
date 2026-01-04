export default function SecurityPage() {
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
            Security
          </h1>
          <p className="text-gray-400">
            Enterprise-grade security architecture for brand intelligence
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="space-y-8 text-gray-300">
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Brand-Isolated Learning Architecture</h2>
              <div className="bg-gray-900 border-2 border-[#00FF87] p-6 rounded-lg my-4">
                <p className="text-[#00FF87] font-semibold text-lg mb-3">
                  PostgreSQL Row-Level Security policies at the database layer—not application layer
                </p>
                <p>
                  This is critical for agencies managing competing clients. Brand isolation must survive 
                  application vulnerabilities, so we enforce it at the database level.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Technical Implementation:</h3>
              
              <h4 className="text-lg font-semibold text-[#00FF87] mt-4 mb-2">1. Tenant Identifier Propagation</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Each authenticated session carries a cryptographically verified brand_id</li>
                <li>brand_id propagates to all database queries via PostgreSQL session variables</li>
                <li>Uses <code className="bg-gray-800 px-2 py-1 rounded text-sm">set_config()</code> and <code className="bg-gray-800 px-2 py-1 rounded text-sm">current_setting()</code> for secure context passing</li>
              </ul>

              <h4 className="text-lg font-semibold text-[#00FF87] mt-4 mb-2">2. Row-Level Security Policies</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>All tables containing brand-specific data enforce RLS policies</li>
                <li>Policies automatically filter rows based on session's brand_id</li>
                <li>Prevents cross-brand data access regardless of query construction</li>
                <li>Survives application-layer vulnerabilities (SQL injection, etc.)</li>
              </ul>

              <h4 className="text-lg font-semibold text-[#00FF87] mt-4 mb-2">3. Learning Data Isolation</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pattern recognition operates within isolated brand containers</li>
                <li>Prompt success ratings stored per brand_id</li>
                <li>Preference learning never crosses brand boundaries</li>
                <li>Intelligence accumulation without cross-contamination</li>
              </ul>

              <h4 className="text-lg font-semibold text-[#00FF87] mt-4 mb-2">4. Audit Trail</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Comprehensive logging of all brand data access</li>
                <li>Immutable timestamps for forensic verification</li>
                <li>Supports enterprise compliance requirements</li>
                <li>Enables proof of isolation for IT audits</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Database Security</h2>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Encryption</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>At Rest:</strong> AES-256 encryption for all stored data</li>
                <li><strong>In Transit:</strong> TLS 1.3 for all connections</li>
                <li><strong>Backups:</strong> Encrypted and geographically distributed</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Access Control</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Least-privilege principle for all database roles</li>
                <li>No direct database access for application code</li>
                <li>Connection pooling with credential rotation</li>
                <li>IP allowlisting and VPC peering where available</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Application Security</h2>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Authentication</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Clerk authentication with industry-standard security</li>
                <li>Email verification required for all accounts</li>
                <li>Session management with automatic expiration</li>
                <li>No password storage (delegated to Clerk)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">API Security</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Rate limiting to prevent abuse</li>
                <li>Token-based consumption tracking</li>
                <li>Input validation and sanitization</li>
                <li>CORS policies for web requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Infrastructure</h2>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Hosting</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Platform:</strong> Netlify with global CDN</li>
                <li><strong>SSL/TLS:</strong> Automatic HTTPS with modern cipher suites</li>
                <li><strong>DDoS Protection:</strong> Built-in mitigation</li>
                <li><strong>Edge Caching:</strong> Reduced latency and improved resilience</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Database</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Provider:</strong> Supabase (managed PostgreSQL)</li>
                <li><strong>Replication:</strong> Automated backups with point-in-time recovery</li>
                <li><strong>Monitoring:</strong> Real-time performance and anomaly detection</li>
                <li><strong>Compliance:</strong> SOC 2 Type II certified</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Third-Party Security</h2>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Supabase</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>SOC 2 Type II compliant</li>
                <li>ISO 27001 certified</li>
                <li>GDPR compliant</li>
                <li>Regular security audits</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Clerk</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>SOC 2 Type II compliant</li>
                <li>GDPR and CCPA compliant</li>
                <li>OWASP best practices</li>
                <li>Regular penetration testing</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Anthropic Claude</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>API calls are ephemeral (not used for training)</li>
                <li>No data retention by Anthropic</li>
                <li>SOC 2 Type II compliant</li>
                <li>Enterprise-grade SLA</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Enterprise Guarantees</h2>
              
              <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg my-4">
                <h3 className="text-lg font-semibold text-white mb-3">For Agency Clients:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-[#00FF87]">
                    <strong>Absolute Brand Isolation:</strong> Porsche intelligence never touches Tesla data—guaranteed at database layer
                  </li>
                  <li className="text-[#00FF87]">
                    <strong>Audit Trail:</strong> Forensic verification of brand data access available on request
                  </li>
                  <li className="text-[#00FF87]">
                    <strong>Compliance:</strong> Meet client requirements for data segregation and security
                  </li>
                  <li className="text-[#00FF87]">
                    <strong>Technical Transparency:</strong> Documentation available for IT security reviews
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Vulnerability Management</h2>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Monitoring</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Real-time error tracking and alerting</li>
                <li>Automated security scanning of dependencies</li>
                <li>Performance monitoring and anomaly detection</li>
                <li>Log aggregation and analysis</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Incident Response</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>24-hour incident response team</li>
                <li>Automated rollback capabilities</li>
                <li>Documented breach notification procedures</li>
                <li>Post-incident analysis and remediation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Responsible Disclosure</h2>
              <p>
                We take security seriously. If you discover a vulnerability, please report it responsibly:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Email: <a href="mailto:security@continuum.video" className="text-[#00FF87] hover:underline">security@continuum.video</a></li>
                <li>Include detailed steps to reproduce</li>
                <li>Allow us reasonable time to address before public disclosure</li>
                <li>We'll acknowledge receipt within 24 hours</li>
              </ul>
              <p className="mt-4">
                We appreciate the security research community and will credit responsible disclosures (with permission).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Questions?</h2>
              <p>
                For security inquiries or technical details:
              </p>
              <p className="mt-3">
                Email: <a href="mailto:security@continuum.video" className="text-[#00FF87] hover:underline">security@continuum.video</a>
              </p>
              <p className="mt-3 text-sm text-gray-400">
                IT decision makers: We're happy to provide additional technical documentation for security reviews.
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
