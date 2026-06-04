'use client'

import { useEffect, useState } from 'react'
import { createClient, type User } from '@supabase/supabase-js'
import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

const NOTES = [
  { symbol: '♪', top: '12%', left: '5%',  size: 22, delay: 0,   color: '#ff6b9d' },
  { symbol: '♫', top: '65%', left: '91%', size: 32, delay: 0.8, color: '#00d4ff' },
  { symbol: '♬', top: '38%', left: '93%', size: 24, delay: 1.4, color: '#ffd700' },
  { symbol: '♩', top: '82%', left: '4%',  size: 18, delay: 0.5, color: '#b47dff' },
]

const ACCENT_COLORS = ['#b47dff', '#ff6b9d', '#00d4ff']

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
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 18,
    padding: 28,
    marginBottom: 24,
    backdropFilter: 'blur(16px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
    position: 'relative',
    overflow: 'hidden',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '12px 16px',
    color: 'white',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 12,
  }

  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg, #7c3aed, #ff6b9d)',
    color: 'white',
    padding: '11px 26px',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: 0.5,
    border: 'none',
    cursor: 'pointer',
  }

  return (
    <>
      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0)       scale(1);   }
          33%      { transform: translate(40px,-30px) scale(1.1); }
          66%      { transform: translate(-20px,20px) scale(0.95); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0)        scale(1);    }
          33%      { transform: translate(-50px,20px) scale(1.05); }
          66%      { transform: translate(30px,-15px) scale(0.9);  }
        }
        @keyframes floatNote {
          0%,100% { transform: translateY(0)     rotate(0deg);  opacity: 0.2; }
          50%      { transform: translateY(-20px) rotate(12deg); opacity: 0.5; }
        }
        @keyframes btnGlow {
          0%,100% { box-shadow: 0 0 20px rgba(255,107,157,0.4), 0 4px 24px rgba(124,58,237,0.4); }
          50%      { box-shadow: 0 0 40px rgba(255,107,157,0.7), 0 4px 40px rgba(124,58,237,0.7); }
        }
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
        .acc-input:focus { border-color: rgba(180,125,255,0.6) !important; background: rgba(255,255,255,0.09) !important; }
        .acc-btn-primary:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .acc-btn-primary { transition: all 0.2s ease; animation: btnGlow 3s ease-in-out infinite; }
        .acc-btn-ghost:hover { background: rgba(255,255,255,0.1) !important; }
        .acc-btn-ghost { transition: background 0.2s ease; }
        .artist-tag:hover .remove-x { opacity: 1 !important; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #06000e 0%, #180838 40%, #2a0e5a 70%, #06000e 100%)',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-geist-sans, Arial, sans-serif)',
      }}>

        {/* Background */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '5%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', animation: 'orb1 18s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '50%', right: '5%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,157,0.18) 0%, transparent 70%)', animation: 'orb2 22s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '10%', left: '35%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)', animation: 'orb1 14s ease-in-out infinite reverse' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
          {NOTES.map((n, i) => (
            <div key={i} style={{ position: 'absolute', top: n.top, left: n.left, fontSize: n.size, color: n.color, animation: `floatNote ${3.2 + i * 0.6}s ease-in-out ${n.delay}s infinite`, userSelect: 'none' }}>
              {n.symbol}
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 20 }}>
          <Navbar />
        </div>

        <div style={{ position: 'relative', zIndex: 10, padding: '48px 40px 80px', maxWidth: 720, margin: '0 auto' }}>

          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 4, marginBottom: 6, textTransform: 'uppercase' }}>Dashboard</p>
          <h1 style={{ color: 'white', fontSize: 32, fontWeight: 900, marginBottom: 32, letterSpacing: 1 }}>My Account</h1>

          {/* Profile info */}
          <div className="acc-card" style={{ ...cardStyle }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #b47dff, transparent)' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' }}>Profile</p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 8 }}>📧 {user?.email}</p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 8 }}>👤 {username}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 4 }}>
              Member since {user ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>

          {/* Change username */}
          <div className="acc-card" style={{ ...cardStyle }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #ff6b9d, transparent)' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' }}>Change Username</p>
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
              <p style={{ marginTop: 12, color: '#00d4ff', fontSize: 13, fontWeight: 600 }}>{usernameMessage}</p>
            )}
          </div>

          {/* Favorite Artists */}
          <div className="acc-card" style={{ ...cardStyle }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #00d4ff, transparent)' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' }}>Favorite Artists</p>

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
                {favoriteArtists.map((artist, i) => {
                  const color = ACCENT_COLORS[i % ACCENT_COLORS.length]
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
                        border: `1px solid ${color}55`,
                        background: `${color}18`,
                        color,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {artist}
                      <button
                        onClick={() => handleRemoveArtist(artist)}
                        className="remove-x"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color, opacity: 0.5, fontSize: 14, padding: 0, lineHeight: 1, transition: 'opacity 0.2s' }}
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
              <p style={{ marginTop: 12, color: '#00d4ff', fontSize: 13, fontWeight: 600 }}>{artistMessage}</p>
            )}
          </div>

          {/* My Tickets */}
          <div className="acc-card" style={{ ...cardStyle, marginBottom: 0 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #ffd700, transparent)' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' }}>🎟️ My Tickets</p>
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
