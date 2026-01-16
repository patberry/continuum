// app/dashboard/brands/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'

export default function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [brandName, setBrandName] = useState('')
  const [brandDescription, setBrandDescription] = useState('')
  const [error, setError] = useState('')

  // Fetch brands on mount
  useEffect(() => {
    fetchBrands()
  }, [])

  async function fetchBrands() {
    try {
      const response = await fetch('/api/brands')
      const data = await response.json()
      
      if (response.ok) {
        setBrands(data.brands || [])
      } else {
        setError(data.error || 'Failed to fetch brands')
      }
    } catch (err) {
      setError('Failed to load brands')
    } finally {
      setLoading(false)
    }
  }

  async function createBrand(e: React.FormEvent) {
    e.preventDefault()
    
    // Client-side validation
    const trimmedName = brandName.trim()
    if (!trimmedName) {
      setError('Brand name is required')
      return
    }
    
    setCreating(true)
    setError('')
    
    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: brandDescription.trim()
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Success - refresh list
        fetchBrands()
        setBrandName('')
        setBrandDescription('')
        setShowForm(false)
      } else {
        setError(data.error || 'Failed to create brand')
      }
    } catch (err) {
      setError('Failed to create brand')
    } finally {
      setCreating(false)
    }
  }

  async function deleteBrand(brandId: string) {
    if (!confirm('Are you sure you want to delete this brand?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchBrands()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete brand')
      }
    } catch (err) {
      alert('Failed to delete brand')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 px-8 py-5 flex justify-between items-center z-50">
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
    className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
    style={{ fontFamily: 'JetBrains Mono, monospace' }}
  >
    Generate
  </a>
  <a 
    href="/dashboard/brands" 
    className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
    style={{ fontFamily: 'JetBrains Mono, monospace' }}
  >
    Brands
  </a>
  <a 
    href="/guide" 
    className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
    style={{ fontFamily: 'JetBrains Mono, monospace' }}
  >
   Guide
  </a>
  <a 
    href="/about" 
    className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
    style={{ fontFamily: 'JetBrains Mono, monospace' }}
  >
    About
  </a>
  <UserButton afterSignOutUrl="/" />
</nav>
        </header>
        <div className="max-w-4xl mx-auto p-8 pt-24">
          <p className="text-gray-400">Loading brands...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 px-8 py-5 flex justify-between items-center z-50">
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
            className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Generate
          </a>
          <a 
            href="/dashboard/brands" 
            className="text-[#00FF87] font-semibold text-sm transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Brands
          </a>
          <a 
            href="/about" 
            className="text-gray-400 hover:text-[#00FF87] text-sm transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            About
          </a>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </header>

      {/* Main Content - with top padding for fixed header */}
      <div className="max-w-4xl mx-auto p-8 pt-24">

        {/* Subtitle / Explanation */}
        <div className="mb-8 bg-gray-900 border border-gray-800 p-4 rounded">
          <p className="text-gray-300 text-sm">
            Each brand is completely isolated. <span className="text-[#00FF87]">Porsche intelligence never touches Tesla data.</span>
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-900 border border-red-700 text-red-200 p-4 rounded">
            {error}
          </div>
        )}

        {/* Create button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-[#00FF87] text-black font-bold px-6 py-3 rounded hover:bg-[#00DD75] transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            + CREATE NEW BRAND
          </button>
        )}

        {/* Create form */}
        {showForm && (
          <div className="mb-8 bg-gray-900 border border-gray-700 p-6 rounded">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF87' }}>
              Create New Brand
            </h2>
            
            <form onSubmit={createBrand} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none"
                  placeholder="e.g. Porsche, Nike, Sub-Zero"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2 uppercase text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Brand Description (Optional)
                </label>
                <textarea
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-[#00FF87] focus:outline-none"
                  placeholder="Brief description, key attributes, or notes about this brand..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className={`flex-1 py-3 rounded font-bold transition-colors ${
                    creating 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#00FF87] text-black hover:bg-[#00DD75]'
                  }`}
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {creating ? 'CREATING...' : 'CREATE BRAND'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setBrandName('')
                    setBrandDescription('')
                    setError('')
                  }}
                  className="px-6 py-3 rounded font-bold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Brands list */}
        <div className="space-y-4">
          {brands.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 p-8 rounded text-center">
              <p className="text-gray-400">No brands yet. Create your first brand profile to get started.</p>
            </div>
          ) : (
            brands.map((brand: any) => (
              <div 
                key={brand.brand_id} 
                onClick={() => window.location.href = `/generate?brand=${brand.brand_id}`}
                className="bg-gray-900 border border-gray-700 p-6 rounded hover:border-[#00FF87] transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">🔒</span>
                      <h3 className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF87' }}>
                        {brand.brand_name}
                      </h3>
                    </div>
                    
                    {brand.brand_description && (
                      <p className="text-gray-400 text-sm mt-2">{brand.brand_description}</p>
                    )}
                    
                    <div className="mt-3 text-xs text-gray-500">
                      Created: {new Date(brand.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBrand(brand.brand_id);
                    }}
                    className="ml-4 text-red-500 hover:text-red-400 text-sm font-bold"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
