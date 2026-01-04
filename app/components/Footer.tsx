export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="flex flex-col items-start justify-start">
            <img 
              src="/continuum-logo.png" 
              alt="CONTINUUM" 
              className="h-10 mb-2"
            />
            <p className="text-gray-400 text-sm pl-3.5">
              GenAI Brand Intelligence
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/dashboard/brands" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/generate" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Generate
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:support@continuum.video" 
                  className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a 
                  href="mailto:support@continuum.video?subject=Beta%20Feedback" 
                  className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
                >
                  Beta Feedback
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/terms" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Terms
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/security" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Continuum. All rights reserved.
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs bg-[#00FF87] text-black px-2 py-1 rounded font-semibold">
                BETA
              </span>
              <span className="text-gray-500 text-xs">
                Brand Intelligence · Not a Tool, an Agent
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
