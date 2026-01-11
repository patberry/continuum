// app/page.tsx
'use client'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Continuum</h1>
        <p className="text-xl text-gray-600 mb-8">Gen AI Brand Intelligence</p>
        <a 
          href="/dashboard/brands"
          className="inline-block bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
