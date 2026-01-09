'use client';

import { useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import FeedbackSidebar from './FeedbackSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: 'generate' | 'brands' | 'feedback' | 'about';
}

export default function AppLayout({ children, currentPage }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Feedback Sidebar */}
      <FeedbackSidebar />
      
      {/* Header - left-16 accounts for sidebar */}
      <header className="fixed top-0 left-16 right-0 bg-black border-b border-gray-800 px-8 py-5 flex justify-between items-center z-50">
        <a href="/generate">
          <img 
            src="/continuum-logo.png" 
            alt="Continuum" 
            className="h-10 cursor-pointer hover:opacity-80 transition-opacity"
          />
        </a>
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
            href="/feedback" 
            className={`text-sm transition-colors ${
              currentPage === 'feedback' 
                ? 'text-[#00FF87] font-semibold' 
                : 'text-gray-400 hover:text-[#00FF87]'
            }`}
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Feedback
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

      {/* Main Content - ml-16 for sidebar, pt-24 for header */}
      <main className="ml-16 pt-24">
        {children}
      </main>
    </div>
  );
}
