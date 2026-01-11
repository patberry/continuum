'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Auto-redirect signed-in users to generate page
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/generate');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      {/* Logo */}
      <img 
        src="/continuum-logo.png" 
        alt="Continuum" 
        style={{
          height: '100px',
          marginBottom: '24px',
        }}
      />
      
      {/* Tagline */}
      <p 
        style={{
          color: '#00FF87',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          margin: 0,
          marginBottom: '48px',
        }}
      >
        GEN AI BRAND INTELLIGENCE
      </p>
      
      {/* CTA Button */}
      {isLoaded && !isSignedIn && (
        <a
          href="/sign-in"
          style={{
            backgroundColor: '#00FF87',
            color: '#000000',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '14px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            padding: '16px 48px',
            borderRadius: '6px',
            textDecoration: 'none',
            transition: 'background-color 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#00DD75'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#00FF87'}
        >
          Get Started
        </a>
      )}

      {/* Loading state while checking auth */}
      {!isLoaded && (
        <div 
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #333',
            borderTopColor: '#00FF87',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
