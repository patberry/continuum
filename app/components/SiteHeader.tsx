// components/SiteHeader.tsx
'use client';

import { UserButton } from '@clerk/nextjs';

interface SiteHeaderProps {
  currentPage: 'generate' | 'brands' | 'about';
}

export default function SiteHeader({ currentPage }: SiteHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 px-8 py-5 flex justify-between items-center z-50">
      {/* Logo - always links to /generate (main app entry point) */}
      <a href="/generate">
        <img 
          src="/continuum-logo.png" 
          alt="Continuum" 
          className="h-10 cursor-pointer hover:opacity-80 transition-opacity"
        />
      </a>
      
      {/* Navigation */}
      <nav className="flex items-center gap-6">
        <a 
          href="/generate" 
          className={`text-sm transition-colors ${
            currentPage === 'generate' 
              ? 'text-[#00FF87] font-semibold' 
              : 'text-gray-400 hover:text-[#00FF87]'
          }`}
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Generate
        </a>
        <a 
          href="/dashboard/brands" 
          className={`text-sm transition-colors ${
            currentPage === 'brands' 
              ? 'text-[#00FF87] font-semibold' 
              : 'text-gray-400 hover:text-[#00FF87]'
          }`}
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Brands
        </a>
        <a 
          href="/about" 
          className={`text-sm transition-colors ${
            currentPage === 'about' 
              ? 'text-[#00FF87] font-semibold' 
              : 'text-gray-400 hover:text-[#00FF87]'
          }`}
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          About
        </a>
        <UserButton afterSignOutUrl="/" />
      </nav>
    </header>
  );
}

// Usage note: When using this component, add pt-24 to your main content container
// to account for the fixed header height
