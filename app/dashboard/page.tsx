// app/dashboard/brands/page.tsx
'use client'

import { useState, useEffect } from 'react'

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
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400">Loading brands...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-500 mb-2">Your Brand Profiles</h1>
          <p className="text-gray-400">
            Each brand is completely isolated. Porsche intelligence never touches Tesla data.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Create button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-green-600 text-white px-6 py-3 rounded font-semibold hover:bg-green-700"
          >
            + Create New Brand
          </button>
        )}

        {/* Create form */}
        {showForm && (
          <form onSubmit={createBrand} className="mb-8 bg-gray-900 border border-gray-700 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Create New Brand</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Brand Name *
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Porsche, Tesla, Nike, Sub-Zero"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
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
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded h-24 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating || !brandName.trim()}
                className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Brand'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setBrandName('')
                  setBrandDescription('')
                  setError('')
                }}
                className="px-6 py-2 border border-gray-600 text-gray-300 rounded font-semibold hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Brand list */}
        <div className="space-y-4">
          {brands.length === 0 ? (
            <div className="bg-gray-900 border border-gray-700 p-12 rounded-lg text-center">
              <p className="text-gray-400 mb-4">No brands yet. Create your first brand to get started.</p>
            </div>
          ) : (
            brands.map(brand => (
              <div key={brand.brand_id} className="bg-gray-900 border border-gray-700 p-6 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{brand.brand_name}</h3>
                      <span className="text-sm px-3 py-1 bg-green-900/50 text-green-400 rounded-full font-semibold">
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
                      className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                    >
                      Generate
                    </button>
                    <button
                      onClick={() => deleteBrand(brand.brand_id)}
                      className="px-4 py-2 border border-red-700 text-red-400 rounded font-semibold hover:bg-red-900/30"
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
