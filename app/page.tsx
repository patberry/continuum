'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  const [minDelayPassed, setMinDelayPassed] = useState(false);

  // 3-second minimum display time
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinDelayPassed(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Only proceed after both: auth loaded AND 3 seconds passed
  useEffect(() => {
    if (isLoaded && minDelayPassed) {
      if (isSignedIn) {
        router.push('/generate');
      } else {
        setShowContent(true);
      }
    }
  }, [isLoaded, minDelayPassed, isSignedIn, router]);

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
          marginBottom: '32px',
        }}
      >
        GEN AI BRAND INTELLIGENCE
      </p>

      {/* Showreel Video */}
      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          marginBottom: '32px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #333',
          boxShadow: '0 4px 24px rgba(0, 255, 135, 0.15)',
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: '100%',
            display: 'block',
          }}
        >
          <source src="/gallery/Continuum_show_reel.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Subtext */}
      <p
        style={{
          color: '#666',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          letterSpacing: '1px',
          margin: 0,
          marginBottom: '32px',
        }}
      >
        MADE WITH CONTINUUM PROMPTS
      </p>
      
      {/* CTA Button - only shows after 3 sec AND not signed in */}
      {showContent && (
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
            animation: 'fadeIn 0.5s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#00DD75'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#00FF87'}
        >
          Get Started
        </a>
      )}

      {/* Spinner while waiting */}
      {!showContent && (
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
