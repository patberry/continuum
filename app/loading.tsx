// app/loading.tsx
export default function Loading() {
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      {/* Logo */}
      <img 
        src="/continuum-logo.png" 
        alt="Continuum" 
        style={{
          height: '80px',
          marginBottom: '24px',
        }}
      />
      
      {/* Tagline */}
      <p 
        style={{
          color: '#00FF87',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '16px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        GEN AI BRAND INTELLIGENCE
      </p>
      
      {/* Subtle loading indicator */}
      <div 
        style={{
          marginTop: '40px',
          width: '40px',
          height: '40px',
          border: '3px solid #333',
          borderTopColor: '#00FF87',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
