// app/components/NavBar.tsx
'use client'

import { UserButton } from '@clerk/nextjs'

interface NavBarProps {
  activePage: 'generate' | 'brands' | 'guide' | 'about'
}

export default function NavBar({ activePage }: NavBarProps) {
  const navItems = [
    { id: 'generate', label: 'Generate', href: '/generate' },
    { id: 'brands', label: 'Brands', href: '/dashboard/brands' },
    { id: 'guide', label: 'Guide', href: '/guide' },
    { id: 'about', label: 'About', href: '/about' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 px-8 py-5 flex justify-between items-center z-50">
      <a href="/generate">
        <img 
          src="/continuum-logo.png" 
          alt="Continuum" 
          className="h-10 cursor-pointer hover:opacity-80 transition-opacity"
        />
      </a>
      <nav className="flex items-center gap-6">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`text-sm transition-colors ${
              activePage === item.id
                ? 'text-[#00FF87] font-semibold'
                : 'text-gray-400 hover:text-[#00FF87]'
            }`}
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {item.label}
          </a>
        ))}
        <UserButton afterSignOutUrl="/" />
      </nav>
    </header>
  )
}
