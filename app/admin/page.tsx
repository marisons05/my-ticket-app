'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

export default function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    price: '',
    total_tickets: '',
  })
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null)
  const [coordsStatus, setCoordsStatus] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [backfillLoading, setBackfillLoading] = useState(false)
  const [backfillResult, setBackfillResult] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setAuthError('Not logged in. Please sign in first.'); setAuthChecked(true); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.is_admin) {
        setAuthError('Access denied — admin only.')
      }
      setAuthChecked(true)
    }
    checkAdmin()
  }, [])

  if (!authChecked) return (
    <main style={{ minHeight: '100vh', background: '#3d1f7a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'white' }}>Checking access…</p>
    </main>
  )

  if (authError) return (
    <main style={{ minHeight: '100vh', background: '#3d1f7a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'white', fontSize: 18 }}>{authError}</p>
    </main>
  )

  const backfillImages = async () => {
    setBackfillLoading(true)
    setBackfillResult('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/backfill-images', {
      method: 'POST',
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    })
    const json = await res.json()
    if (res.ok) setBackfillResult(`✅ Updated ${json.updated} of ${json.total} RA events with images`)
    else setBackfillResult(`❌ ${json.error}`)
    setBackfillLoading(false)
  }

  const lookupAddress = async () => {
    if (!address.trim()) return
    setCoordsStatus('Looking up address...')
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    )
    const data = await res.json()
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      setCoords({ lat, lng })
      setCoordsStatus(`✅ Found: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } else {
      setCoordsStatus('❌ Address not found, try being more specific')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImagePreview(null)
    }
  }

  const handleSubmit = async () => {
    if (!form.title || !form.date || !form.price || !form.total_tickets) {
      setMessage('Please fill in all fields')
      return
    }
    if (!coords) {
      setMessage('Please look up the address first')
      return
    }
    setLoading(true)

    let image_url: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `events/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(path, imageFile, { upsert: true })
      if (uploadError) {
        setMessage('Image upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const { error } = await supabase.from('events').insert({
      title: form.title,
      description: form.description,
      location: form.location || address,
      date: form.date,
      price: parseFloat(form.price),
      total_tickets: parseInt(form.total_tickets),
      tickets_remaining: parseInt(form.total_tickets),
      latitude: coords.lat,
      longitude: coords.lng,
      ...(image_url ? { image_url } : {}),
    })
    setLoading(false)
    if (error) setMessage(error.message)
    else {
      setMessage('✅ Event added successfully!')
      setForm({ title: '', description: '', location: '', date: '', price: '', total_tickets: '' })
      setAddress('')
      setCoords(null)
      setCoordsStatus('')
      setImageFile(null)
      setImagePreview(null)
    }
  }

  const inputStyle = {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '15px',
    color: '#111',
    marginBottom: '12px',
    boxSizing: 'border-box' as const
  }

  return (
    <main className="min-h-screen" style={{backgroundColor: '#3d1f7a'}}>
      <Navbar />
      <div style={{padding: '32px', maxWidth: '700px', margin: '0 auto'}}>
        <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: 8}}>
            <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#111', margin: 0}}>
              ➕ Add New Event
            </h1>
            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
              <button
                onClick={backfillImages}
                disabled={backfillLoading}
                style={{fontSize: '14px', fontWeight: '700', color: '#b45309', background: '#fef3c7', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer'}}
              >
                {backfillLoading ? 'Fetching…' : 'Backfill RA Images'}
              </button>
              <a
                href="/admin/staging"
                style={{fontSize: '14px', fontWeight: '700', color: '#7c3aed', textDecoration: 'none', background: '#f0e8ff', padding: '8px 14px', borderRadius: '8px'}}
              >
                Review Queue →
              </a>
            </div>
          </div>
          {backfillResult && (
            <p style={{marginBottom: 16, fontSize: 13, fontWeight: 600, color: backfillResult.startsWith('✅') ? 'green' : 'red'}}>{backfillResult}</p>
          )}

          <label style={{fontWeight: '600', color: '#333', fontSize: '14px'}}>Event Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{...inputStyle, padding: '8px 12px', cursor: 'pointer'}}
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              style={{width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px'}}
            />
          )}

          <label style={{fontWeight: '600', color: '#333', fontSize: '14px'}}>Event Title</label>
          <input style={inputStyle} placeholder="e.g. Club Night at Skybar" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />

          <label style={{fontWeight: '600', color: '#333', fontSize: '14px'}}>Description</label>
          <textarea style={{...inputStyle, height: '80px', resize: 'none'}} placeholder="Describe the event..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />

          <label style={{fontWeight: '600', color: '#333', fontSize: '14px'}}>Display Location (e.g. Skybar, Riga)</label>
          <input style={inputStyle} placeholder="Venue name for display" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />

          <label style={{fontWeight: '600', color: '#333', fontSize: '14px'}}>Address for Map</label>
          <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
            <input
              style={{...inputStyle, marginBottom: 0, flex: 1}}
              placeholder="e.g. Kalku iela 12, Riga"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
            <button
              onClick={lookupAddress}
              style={{backgroundColor: '#3d1f7a', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', whiteSpace: 'nowrap'}}
            >
              Get Coords
            </button>
          </div>
          {coordsStatus && <p style={{fontSize: '13px', color: coords ? 'green' : 'red', marginBottom: '12px'}}>{coordsStatus}</p>}

          <label style={{fontWeight: '600', color: '#333', fontSize: '14px'}}>Date & Time</label>
          <input style={inputStyle} type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
            <div>
              <label style={{fontWeight: '600', color: '#333', fontSize: '14px'}}>Price (€)</label>
              <input style={inputStyle} type="number" placeholder="0.00" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            </div>
            <div>
              <label style={{fontWeight: '600', color: '#333', fontSize: '14px'}}>Total Tickets</label>
              <input style={inputStyle} type="number" placeholder="100" value={form.total_tickets} onChange={e => setForm({...form, total_tickets: e.target.value})} />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{width: '100%', backgroundColor: '#3d1f7a', color: 'white', padding: '14px', borderRadius: '8px', fontWeight: '800', border: 'none', cursor: 'pointer', fontSize: '16px', marginTop: '8px'}}
          >
            {loading ? 'Adding...' : 'Add Event'}
          </button>

          {message && (
            <p style={{marginTop: '16px', textAlign: 'center', fontWeight: '600', color: message.includes('✅') ? 'green' : 'red'}}>
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}