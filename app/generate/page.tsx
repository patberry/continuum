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
      console.log('Sending brand data:', { brand_name: trimmedName, brand_description: brandDescription })
      
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName, 
          description: brandDescription.trim()
        })
      })

      const data = await response.json()
      console.log('API response:', data)

      if (response.ok) {
        setBrands([data.brand, ...brands])
        setBrandName('')
        setBrandDescription('')
        setShowForm(false)
        setError('')
      } else {
        setError(data.error || 'Failed to create brand')
      }
    } catch (err) {
      console.error('Create brand error:', err)
      setError('Failed to create brand')
    } finally {
      setCreating(false)
    }
  }

  async function deleteBrand(brandId: string) {
    if (!confirm('Delete this brand? All sessions, prompts, and intelligence will be permanently removed.')) {
      return
    }

    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBrands(brands.filter(b => b.brand_id !== brandId))
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
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400">Loading brands...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with UserButton - MATCHING GENERATE PAGE */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF87' }}>
              CONTINUUM
            </h1>
            <p className="text-white">Brand Intelligence Profiles</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>

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
          <form onSubmit={createBrand} className="mb-8 bg-gray-900 border border-gray-700 p-6 rounded">
            <h2 className="text-xl font-bold mb-4 text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Create New Brand
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Brand Name *
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Porsche, Tesla, Nike, Sub-Zero"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF87]"
                autoComplete="off"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Description (optional)
              </label>
              <textarea
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="Notes about this brand..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded h-24 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF87] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating || !brandName.trim()}
                className="bg-[#00FF87] text-black font-bold px-6 py-3 rounded hover:bg-[#00DD75] disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
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
                className="px-6 py-3 border border-gray-700 text-gray-300 rounded hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Brand list */}
        <div className="space-y-4">
          {brands.length === 0 ? (
            <div className="bg-gray-900 border border-gray-700 p-12 rounded text-center">
              <p className="text-gray-400 mb-2">No brands yet.</p>
              <p className="text-gray-500 text-sm">Create your first brand to start building intelligence.</p>
            </div>
          ) : (
            brands.map(brand => (
              <div key={brand.brand_id} className="bg-gray-900 border border-gray-700 p-6 rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {brand.brand_name}
                      </h3>
                      <span className="text-xs px-3 py-1 bg-[#00FF87]/10 text-[#00FF87] rounded border border-[#00FF87]/30 font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        🔒 ISOLATED
                      </span>
                    </div>
                    {brand.brand_description && (
                      <p className="text-gray-400 mb-3">{brand.brand_description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Created {new Date(brand.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = `/generate?brand=${brand.brand_id}`}
                      className="px-4 py-2 bg-[#00FF87] text-black font-bold rounded hover:bg-[#00DD75] transition-colors"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      GENERATE
                    </button>
                    <button
                      onClick={() => deleteBrand(brand.brand_id)}
                      className="px-4 py-2 border border-red-700 text-red-400 rounded hover:bg-red-900/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
