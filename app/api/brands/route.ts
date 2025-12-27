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
      console.log('Sending brand data:', { name: trimmedName, description: brandDescription })
      
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
      const response = await fetch(`/api/brands?id=${brandId}`, {
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
            + C