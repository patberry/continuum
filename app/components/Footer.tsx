'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

// Routes where sidebar appears (authenticated app pages)
const APP_ROUTES = ['/generate', '/dashboard', '/feedback'];

export default function Footer() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  
  // Check if sidebar is visible on this page
  const isAppPage = APP_ROUTES.some(route => pathname.startsWith(route));
  const sidebarVisible = isLoaded && isSignedIn && isAppPage;

  return (
    <footer className={`bg-gray-900 border-t border-gray-800 py-12 px-8 transition-all duration-300 ${sidebarVisible ? 'ml-16' : ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div>
            <h3 
              className="text-[#00FF87] text-xl font-bold mb-2"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              CONTINUUM
            </h3>
            <p className="text-gray-400 text-sm">
              GenAI Brand Intelligence
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 
              className="text-white font-bold mb-4 uppercase text-sm"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/dashboard/brands" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/generate" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Generate
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 
              className="text-white font-bold mb-4 uppercase text-sm"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Beta Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 
              className="text-white font-bold mb-4 uppercase text-sm"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 Continuum. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span 
              className="bg-[#00FF87] text-black text-xs font-bold px-2 py-1 rounded"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              BETA
            </span>
            <span className="text-gray-500 text-sm">
              Brand Intelligence · Not a Tool, an Agent
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
