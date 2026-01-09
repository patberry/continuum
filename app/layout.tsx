import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Footer from './components/Footer';

export const metadata = {
  title: 'Continuum',
  description: 'Gen AI Brand Intelligence',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#00FF87',
          colorBackground: '#000000',
          colorText: '#ffffff',
          colorTextSecondary: '#999999',
          colorInputBackground: '#1a1a1a',
          colorInputText: '#ffffff',
          fontFamily: 'JetBrains Mono, monospace',
        },
        elements: {
          card: {
            backgroundColor: '#0a0a0a',
            border: '1px solid #333',
            boxShadow: '0 2px 20px rgba(0, 255, 135, 0.1)',
          },
          headerTitle: {
            color: '#00FF87',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: '700',
            fontSize: '24px',
          },
          headerSubtitle: {
            color: '#999',
          },
          formButtonPrimary: {
            backgroundColor: '#00FF87',
            color: '#000000',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: '700',
            textTransform: 'uppercase',
            fontSize: '14px',
            letterSpacing: '0.5px',
            '&:hover': {
              backgroundColor: '#00DD75',
            },
          },
          formFieldInput: {
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            color: '#ffffff',
            '&:focus': {
              borderColor: '#00FF87',
              boxShadow: '0 0 0 1px #00FF87',
            },
          },
          formFieldLabel: {
            color: '#cccccc',
            fontSize: '13px',
          },
          footerActionLink: {
            color: '#00FF87',
            '&:hover': {
              color: '#00DD75',
            },
          },
          socialButtonsBlockButton: {
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#222',
              borderColor: '#00FF87',
            },
          },
          socialButtonsBlockButtonText: {
            fontFamily: 'JetBrains Mono, monospace',
          },
          dividerLine: {
            backgroundColor: '#333',
          },
          dividerText: {
            color: '#666',
          },
          formContainer: {
            gap: '1rem',
          },
          footer: {
            backgroundColor: '#0a0a0a',
            '& + div': {
              backgroundColor: '#0a0a0a',
            },
          },
          alertText: {
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
          },
          formFieldErrorText: {
            color: '#ff6b6b',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
          },
          identityPreview: {
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
          },
          identityPreviewText: {
            color: '#ffffff',
          },
          identityPreviewEditButton: {
            color: '#00FF87',
          },
        },
      }}
    >
      <html lang="en" className="bg-black">
        <body className="bg-black min-h-screen flex flex-col">
          {/* NO SIDEBAR HERE - Sidebar is included via AppLayout for authenticated pages only */}
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  )
}
