// app/dashboard/brands/page.js
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

export default function BrandsPage() {
  const { userId, isLoaded } = useAuth()
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
    if (isLoaded && userId) {
      fetchBrands()
    }
  }, [isLoaded, userId])

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

  async function createBrand(e) {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: brandName,
          brand_description: brandDescription
        })
      })

      const data = await response.json()

      if (response.ok) {
        setBrands([data.brand, ...brands])
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

  async function deleteBrand(brandId) {
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

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Loading brands...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Brand Profiles</h1>
          <p className="text-gray-600">
            Each brand is completely isolated. Porsche intelligence never touches Tesla data.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Create button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-black text-white px-6 py-3 rounded font-semibold hover:bg-gray-800"
          >
            + Create New Brand
          </button>
        )}

        {/* Create form */}
        {showForm && (
          <form onSubmit={createBrand} className="mb-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Create New Brand</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Brand Name *
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Porsche, Tesla, Nike"
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Description (optional)
              </label>
              <textarea
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="Notes about this brand..."
                className="w-full px-4 py-2 border border-gray-300 rounded h-24"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-black text-white px-6 py-2 rounded font-semibold hover:bg-gray-800 disabled:bg-gray-400"
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
                className="px-6 py-2 border border-gray-300 rounded font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Brand list */}
        <div className="space-y-4">
          {brands.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <p className="text-gray-600 mb-4">No brands yet. Create your first brand to get started.</p>
            </div>
          ) : (
            brands.map(brand => (
              <div key={brand.brand_id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{brand.brand_name}</h3>
                      <span className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                        🔒 ISOLATED
                      </span>
                    </div>
                    {brand.brand_description && (
                      <p className="text-gray-600 mb-3">{brand.brand_description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Created {new Date(brand.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = `/generate?brand=${brand.brand_id}`}
                      className="px-4 py-2 bg-black text-white rounded font-semibold hover:bg-gray-800"
                    >
                      Generate
                    </button>
                    <button
                      onClick={() => deleteBrand(brand.brand_id)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded font-semibold hover:bg-red-50"
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
