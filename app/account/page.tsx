'use client'

import { useEffect, useState } from 'react'
import { createClient, type User } from '@supabase/supabase-js'
import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [usernameMessage, setUsernameMessage] = useState('')

  const [favoriteArtists, setFavoriteArtists] = useState<string[]>([])
  const [newArtist, setNewArtist] = useState('')
  const [artistMessage, setArtistMessage] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
      } else {
        setUser(data.user)
        supabase
          .from('profiles')
          .select('username, favorite_artists')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUsername(profile.username)
              setNewUsername(profile.username)
              setFavoriteArtists(profile.favorite_artists ?? [])
            }
          })
      }
    })
  }, [])

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) { setUsernameMessage('Username cannot be empty'); return }
    if (!user) { setUsernameMessage('Unable to update username. Please sign in again.'); return }
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', user.id)
    if (error) setUsernameMessage(error.message)
    else {
      setUsername(newUsername)
      setUsernameMessage('Username updated!')
      setTimeout(() => setUsernameMessage(''), 3000)
    }
  }

  const handleAddArtist = async () => {
    const trimmed = newArtist.trim()
    if (!trimmed) return
    if (favoriteArtists.includes(trimmed)) { setArtistMessage('Already in your list'); return }
    if (!user) return
    const updated = [...favoriteArtists, trimmed]
    const { error } = await supabase
      .from('profiles')
      .update({ favorite_artists: updated })
      .eq('id', user.id)
    if (error) { setArtistMessage(error.message); return }
    setFavoriteArtists(updated)
    setNewArtist('')
    setArtistMessage('Artist added!')
    setTimeout(() => setArtistMessage(''), 2500)
  }

  const handleRemoveArtist = async (artist: string) => {
    if (!user) return
    const updated = favoriteArtists.filter(a => a !== artist)
    const { error } = await supabase
      .from('profiles')
      .update({ favorite_artists: updated })
      .eq('id', user.id)
    if (!error) setFavoriteArtists(updated)
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 18,
    padding: 28,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 16px',
    color: 'white',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 12,
    fontFamily: 'var(--font-space-mono, monospace)',
  }

  const btnPrimary: React.CSSProperties = {
    background: 'white',
    color: 'black',
    padding: '11px 26px',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 0.5,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-space-mono, monospace)',
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .acc-card { animation: fadeUp 0.6s ease both; }
        .acc-card:nth-child(1) { animation-delay: 0.05s; }
        .acc-card:nth-child(2) { animation-delay: 0.15s; }
        .acc-card:nth-child(3) { animation-delay: 0.25s; }
        .acc-card:nth-child(4) { animation-delay: 0.35s; }
        .acc-input::placeholder { color: rgba(255,255,255,0.28); }
        .acc-input:focus { border-color: rgba(255,26,26,0.6) !important; background: rgba(255,255,255,0.08) !important; }
        .acc-btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .acc-btn-primary { transition: all 0.2s ease; }
        .acc-btn-ghost:hover { background: rgba(255,255,255,0.1) !important; }
        .acc-btn-ghost { transition: background 0.2s ease; }
        .artist-tag:hover .remove-x { opacity: 1 !important; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: '#000',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-space-mono, monospace)',
      }}>

        <Navbar />

        <div style={{ padding: '48px 40px 80px', maxWidth: 720, margin: '0 auto' }}>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 4, marginBottom: 6, textTransform: 'uppercase' }}>Dashboard</p>
          <h1 style={{ color: 'white', fontSize: 32, fontWeight: 900, marginBottom: 32, letterSpacing: 1 }}>My Account</h1>

          {/* Profile info */}
          <div className="acc-card" style={{ ...cardStyle }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' }}>Profile</p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 8 }}>📧 {user?.email}</p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 8 }}>👤 {username}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
              Member since {user ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>

          {/* Change username */}
          <div className="acc-card" style={{ ...cardStyle }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' }}>Change Username</p>
            <input
              type="text"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUpdateUsername()}
              placeholder="New username"
              className="acc-input"
              style={inputStyle}
            />
            <button onClick={handleUpdateUsername} className="acc-btn-primary" style={btnPrimary}>
              Save Username
            </button>
            {usernameMessage && (
              <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{usernameMessage}</p>
            )}
          </div>

          {/* Favorite Artists */}
          <div className="acc-card" style={{ ...cardStyle }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' }}>Favorite Artists</p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input
                type="text"
                value={newArtist}
                onChange={e => setNewArtist(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddArtist()}
                placeholder="Artist name"
                className="acc-input"
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <button
                onClick={handleAddArtist}
                className="acc-btn-primary"
                style={{ ...btnPrimary, whiteSpace: 'nowrap', paddingLeft: 20, paddingRight: 20 }}
              >
                + Add
              </button>
            </div>

            {favoriteArtists.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {favoriteArtists.map((artist) => {
                  return (
                    <span
                      key={artist}
                      className="artist-tag"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 100,
                        border: '1px solid rgba(255,26,26,0.4)',
                        background: 'rgba(255,26,26,0.1)',
                        color: '#ff1a1a',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {artist}
                      <button
                        onClick={() => handleRemoveArtist(artist)}
                        className="remove-x"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff1a1a', opacity: 0.5, fontSize: 14, padding: 0, lineHeight: 1, transition: 'opacity 0.2s' }}
                        aria-label={`Remove ${artist}`}
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 14, marginTop: 4 }}>No artists added yet. Add some to get personalized recommendations.</p>
            )}

            {artistMessage && (
              <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{artistMessage}</p>
            )}
          </div>

          {/* My Tickets */}
          <div className="acc-card" style={{ ...cardStyle, marginBottom: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' }}>🎟️ My Tickets</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>You have not purchased any tickets yet.</p>
            <button
              onClick={() => window.location.href = '/events'}
              className="acc-btn-primary"
              style={{ ...btnPrimary, marginTop: 16 }}
            >
              Browse Events →
            </button>
          </div>

        </div>
      </main>
    </>
  )
}
