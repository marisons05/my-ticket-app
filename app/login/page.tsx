'use client'

import { useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Navbar from '@/app/components/Navbar'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

const GENRES = ['All', 'Electronic', 'Techno', 'House', 'Hip-Hop', 'Rock', 'Pop', 'Jazz', 'R&B']

const PRESET_ARTISTS: { name: string; genre: string }[] = [
  // Electronic
  { name: 'Bicep', genre: 'Electronic' },
  { name: 'Four Tet', genre: 'Electronic' },
  { name: 'Floating Points', genre: 'Electronic' },
  { name: 'Aphex Twin', genre: 'Electronic' },
  { name: 'Bonobo', genre: 'Electronic' },
  { name: 'Jon Hopkins', genre: 'Electronic' },
  { name: 'Caribou', genre: 'Electronic' },
  { name: 'Nicolas Jaar', genre: 'Electronic' },
  // Techno
  { name: 'Amelie Lens', genre: 'Techno' },
  { name: 'Charlotte de Witte', genre: 'Techno' },
  { name: 'Richie Hawtin', genre: 'Techno' },
  { name: 'Adam Beyer', genre: 'Techno' },
  { name: 'I Hate Models', genre: 'Techno' },
  { name: 'Paula Temple', genre: 'Techno' },
  { name: 'Surgeon', genre: 'Techno' },
  { name: 'Rebekah', genre: 'Techno' },
  // House
  { name: 'Disclosure', genre: 'House' },
  { name: 'Maya Jane Coles', genre: 'House' },
  { name: 'DJ Koze', genre: 'House' },
  { name: 'Dixon', genre: 'House' },
  { name: 'Peggy Gou', genre: 'House' },
  { name: 'Honey Dijon', genre: 'House' },
  { name: 'Objekt', genre: 'House' },
  { name: 'Kerri Chandler', genre: 'House' },
  // Hip-Hop
  { name: 'Kendrick Lamar', genre: 'Hip-Hop' },
  { name: 'Tyler, the Creator', genre: 'Hip-Hop' },
  { name: 'J. Cole', genre: 'Hip-Hop' },
  { name: 'Frank Ocean', genre: 'Hip-Hop' },
  { name: 'SZA', genre: 'Hip-Hop' },
  { name: 'Denzel Curry', genre: 'Hip-Hop' },
  { name: 'Little Simz', genre: 'Hip-Hop' },
  { name: 'Megan Thee Stallion', genre: 'Hip-Hop' },
  // Rock
  { name: 'Arctic Monkeys', genre: 'Rock' },
  { name: 'Radiohead', genre: 'Rock' },
  { name: 'Arcade Fire', genre: 'Rock' },
  { name: 'The National', genre: 'Rock' },
  { name: 'Idles', genre: 'Rock' },
  { name: 'Fontaines D.C.', genre: 'Rock' },
  { name: 'Wolf Alice', genre: 'Rock' },
  { name: 'Wet Leg', genre: 'Rock' },
  // Pop
  { name: 'Dua Lipa', genre: 'Pop' },
  { name: 'Charli XCX', genre: 'Pop' },
  { name: 'Caroline Polachek', genre: 'Pop' },
  { name: 'Rosalía', genre: 'Pop' },
  { name: 'Billie Eilish', genre: 'Pop' },
  { name: 'Lorde', genre: 'Pop' },
  { name: 'HAIM', genre: 'Pop' },
  { name: 'Mitski', genre: 'Pop' },
  // Jazz
  { name: 'Kamasi Washington', genre: 'Jazz' },
  { name: 'Nubya Garcia', genre: 'Jazz' },
  { name: 'Shabaka Hutchings', genre: 'Jazz' },
  { name: 'GoGo Penguin', genre: 'Jazz' },
  { name: 'Sault', genre: 'Jazz' },
  { name: 'Moses Sumney', genre: 'Jazz' },
  // R&B
  { name: 'Daniel Caesar', genre: 'R&B' },
  { name: 'H.E.R.', genre: 'R&B' },
  { name: 'Thundercat', genre: 'R&B' },
  { name: 'Steve Lacy', genre: 'R&B' },
  { name: 'Lucky Daye', genre: 'R&B' },
  { name: 'Snoh Aalegra', genre: 'R&B' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  // Onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false)
  const [noSpam, setNoSpam] = useState(true)
  const [recommendationsOptIn, setRecommendationsOptIn] = useState(true)
  const [artists, setArtists] = useState<string[]>([])
  const [artistInput, setArtistInput] = useState('')
  const [artistSearch, setArtistSearch] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')
  const [saving, setSaving] = useState(false)
  const artistInputRef = useRef<HTMLInputElement>(null)

  const handleAuth = async () => {
    setMessage('')
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setIsError(true); setMessage(error.message); return }
      const confirmRequired = !data.session
      setNeedsEmailConfirm(confirmRequired)
      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, username })
        setPendingUserId(data.user.id)
      }
      setShowOnboarding(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setIsError(true); setMessage(error.message) }
      else window.location.href = '/'
    }
  }

  const addArtist = () => {
    const trimmed = artistInput.trim()
    if (!trimmed || artists.includes(trimmed)) { setArtistInput(''); return }
    setArtists(prev => [...prev, trimmed])
    setArtistInput('')
    artistInputRef.current?.focus()
  }

  const removeArtist = (a: string) => setArtists(prev => prev.filter(x => x !== a))

  const handleFinishOnboarding = async () => {
    if (!pendingUserId) { window.location.href = '/'; return }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        preferences_opt_in: recommendationsOptIn,
        favorite_artists: artists,
      })
      .eq('id', pendingUserId)
    setSaving(false)
    if (error) {
      setMessage(error.message)
      setIsError(true)
      setShowOnboarding(false)
      return
    }
    if (needsEmailConfirm) {
      setShowOnboarding(false)
      setIsError(false)
      setMessage('Account created! Please check your email to confirm before signing in.')
    } else {
      window.location.href = '/'
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '13px 16px',
    color: 'white',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 14,
    fontFamily: 'var(--font-space-mono, monospace)',
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1);       }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .login-card { animation: fadeUp 0.6s ease 0.1s both; }
        .login-input:focus { border-color: rgba(255,26,26,0.6) !important; background: rgba(255,255,255,0.08) !important; }
        .login-input::placeholder { color: rgba(255,255,255,0.3); }
        .toggle-btn:hover { color: #ff1a1a !important; }
        .toggle-btn { transition: color 0.2s ease; }
        .submit-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .submit-btn { transition: all 0.2s ease; }

        /* Onboarding overlay */
        .ob-overlay { animation: overlayIn 0.3s ease both; }
        .ob-modal  { animation: modalIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.05s both; }

        /* Toggle switch */
        .sw-track { transition: background 0.25s ease; }
        .sw-thumb { transition: transform 0.25s cubic-bezier(0.22,1,0.36,1); }

        /* Artist input */
        .ob-artist-input::placeholder { color: rgba(255,255,255,0.28); }
        .ob-artist-input:focus { border-color: rgba(255,26,26,0.55) !important; background: rgba(255,255,255,0.07) !important; }

        /* Artist tag */
        .artist-chip { transition: background 0.18s, border-color 0.18s; }
        .artist-chip:hover { background: rgba(255,26,26,0.18) !important; border-color: rgba(255,26,26,0.7) !important; }
        .artist-chip .chip-x { opacity: 0.5; transition: opacity 0.15s; }
        .artist-chip:hover .chip-x { opacity: 1; }

        /* Consent row */
        .consent-row:hover { background: rgba(255,255,255,0.025) !important; }
        .consent-row { transition: background 0.18s; }

        /* Finish btn */
        .ob-finish-btn { transition: all 0.2s ease; }
        .ob-finish-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .ob-finish-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; filter: none; }

        /* Add btn */
        .ob-add-btn { transition: all 0.18s ease; }
        .ob-add-btn:hover { background: rgba(255,26,26,0.2) !important; border-color: rgba(255,26,26,0.7) !important; }

        /* Preset chip */
        .preset-chip { transition: background 0.15s, border-color 0.15s, color 0.15s; cursor: pointer; }
        .preset-chip:hover { background: rgba(255,26,26,0.15) !important; border-color: rgba(255,26,26,0.5) !important; color: #ff6666 !important; }

        /* Genre pill */
        .genre-pill { transition: background 0.15s, border-color 0.15s, color 0.15s; cursor: pointer; }
        .genre-pill:hover { background: rgba(255,255,255,0.08) !important; }

        /* Search input */
        .ob-search-input::placeholder { color: rgba(255,255,255,0.25); }
        .ob-search-input:focus { border-color: rgba(255,26,26,0.5) !important; background: rgba(255,255,255,0.07) !important; }

        /* Artist scroll area */
        .preset-scroll::-webkit-scrollbar { width: 4px; }
        .preset-scroll::-webkit-scrollbar-track { background: transparent; }
        .preset-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: '#000',
        position: 'relative',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-space-mono, monospace)',
      }}>

        <Navbar />

        {/* Login / Sign-up form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 10 }}>
          <div className="login-card" style={{
            width: '100%',
            maxWidth: 420,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 18,
            padding: '40px 36px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}>

            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <p style={{ color: '#ff1a1a', fontSize: 11, letterSpacing: 4, marginBottom: 12, textTransform: 'uppercase', fontWeight: 700 }}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </p>
              <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, letterSpacing: 1, marginBottom: 6 }}>
                {isSignUp ? 'Join The Mix' : 'Welcome Back'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                {isSignUp ? 'Create your account to get tickets' : 'Sign in to access your tickets'}
              </p>
            </div>

            {isSignUp && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="login-input"
                style={inputStyle}
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="login-input"
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              className="login-input"
              style={{ ...inputStyle, marginBottom: 24 }}
            />

            <button
              onClick={handleAuth}
              className="submit-btn"
              style={{
                width: '100%',
                background: 'white',
                color: 'black',
                padding: '14px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 1,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-space-mono, monospace)',
              }}
            >
              {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN →'}
            </button>

            {message && (
              <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: isError ? '#ff1a1a' : 'rgba(255,255,255,0.7)' }}>
                {message}
              </p>
            )}

            <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
                className="toggle-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: 13, padding: 0, fontFamily: 'var(--font-space-mono, monospace)' }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>

        {/* ── Onboarding modal ── */}
        {showOnboarding && (
          <div
            className="ob-overlay"
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              padding: '20px',
              paddingTop: 90,
              paddingBottom: 40,
              overflowY: 'auto',
            }}
          >
            <div
              className="ob-modal"
              style={{
                width: '100%',
                maxWidth: 500,
                background: 'rgba(12,12,12,0.97)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 22,
                boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,26,26,0.08)',
                overflow: 'hidden',
              }}
            >
              {/* Red accent bar */}
              <div style={{ height: 3, background: 'linear-gradient(90deg, #ff1a1a 0%, rgba(255,26,26,0.3) 60%, transparent 100%)' }} />

              <div style={{ padding: '36px 36px 40px' }}>

                {/* Header */}
                <div style={{ marginBottom: needsEmailConfirm ? 20 : 32 }}>
                  <p style={{ color: '#ff1a1a', fontSize: 10, letterSpacing: 4, marginBottom: 10, textTransform: 'uppercase', fontWeight: 700 }}>
                    Almost there
                  </p>
                  <h2 style={{ color: 'white', fontSize: 24, fontWeight: 900, letterSpacing: 0.5, marginBottom: 8 }}>
                    Personalise your experience
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, lineHeight: 1.6 }}>
                    Tell us what you're into. We use this to surface events you'll actually care about — nothing else.
                  </p>
                </div>

                {/* Email confirmation notice */}
                {needsEmailConfirm && (
                  <div style={{ marginBottom: 28, background: 'rgba(255,26,26,0.08)', border: '1px solid rgba(255,26,26,0.25)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>✉️</span>
                    <div>
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Check your inbox</p>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.5 }}>
                        We sent a confirmation link to <span style={{ color: 'white', fontWeight: 600 }}>{email}</span>. You'll need to verify your email before you can sign in.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Consent section ── */}
                <div style={{ marginBottom: 28 }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, fontWeight: 700 }}>
                    Preferences
                  </p>

                  <ConsentRow
                    checked={noSpam}
                    onChange={setNoSpam}
                    title="Zero spam, guaranteed"
                    description="We'll never flood your inbox. Only critical account info — no marketing blasts."
                  />

                  <ConsentRow
                    checked={recommendationsOptIn}
                    onChange={setRecommendationsOptIn}
                    title="Smart event recommendations"
                    description="Get personalised suggestions based on your favourite artists and genres."
                  />
                </div>

                {/* ── Artists section ── */}
                <div style={{ marginBottom: 32 }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14, fontWeight: 700 }}>
                    Favourite Artists <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, letterSpacing: 1 }}>(optional)</span>
                  </p>

                  {/* Genre filter pills */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {GENRES.map(g => (
                      <button
                        key={g}
                        onClick={() => setActiveGenre(g)}
                        className="genre-pill"
                        style={{
                          padding: '5px 13px',
                          borderRadius: 100,
                          border: `1px solid ${activeGenre === g ? 'rgba(255,26,26,0.7)' : 'rgba(255,255,255,0.1)'}`,
                          background: activeGenre === g ? 'rgba(255,26,26,0.15)' : 'rgba(255,255,255,0.04)',
                          color: activeGenre === g ? '#ff1a1a' : 'rgba(255,255,255,0.45)',
                          fontSize: 11,
                          fontWeight: activeGenre === g ? 700 : 400,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-space-mono, monospace)',
                          letterSpacing: 0.5,
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search artists…"
                    value={artistSearch}
                    onChange={e => setArtistSearch(e.target.value)}
                    className="ob-search-input"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 9,
                      padding: '9px 13px',
                      color: 'white',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: 10,
                      fontFamily: 'var(--font-space-mono, monospace)',
                    }}
                  />

                  {/* Preset artist grid */}
                  <div
                    className="preset-scroll"
                    style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 14 }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {PRESET_ARTISTS
                        .filter(a => activeGenre === 'All' || a.genre === activeGenre)
                        .filter(a => a.name.toLowerCase().includes(artistSearch.toLowerCase()))
                        .map(a => {
                          const selected = artists.includes(a.name)
                          return (
                            <button
                              key={a.name}
                              onClick={() => selected ? removeArtist(a.name) : setArtists(prev => [...prev, a.name])}
                              className="preset-chip"
                              style={{
                                padding: '6px 13px',
                                borderRadius: 100,
                                border: `1px solid ${selected ? 'rgba(255,26,26,0.7)' : 'rgba(255,255,255,0.1)'}`,
                                background: selected ? 'rgba(255,26,26,0.18)' : 'rgba(255,255,255,0.04)',
                                color: selected ? '#ff1a1a' : 'rgba(255,255,255,0.6)',
                                fontSize: 12,
                                fontWeight: selected ? 700 : 400,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-space-mono, monospace)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              {selected && <span style={{ fontSize: 10 }}>✓</span>}
                              {a.name}
                            </button>
                          )
                        })
                      }
                    </div>
                  </div>

                  {/* Custom artist input */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      ref={artistInputRef}
                      type="text"
                      placeholder="Add someone not on the list…"
                      value={artistInput}
                      onChange={e => setArtistInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addArtist() } }}
                      className="ob-artist-input"
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        padding: '10px 13px',
                        color: 'white',
                        fontSize: 12,
                        outline: 'none',
                        fontFamily: 'var(--font-space-mono, monospace)',
                      }}
                    />
                    <button
                      onClick={addArtist}
                      className="ob-add-btn"
                      style={{
                        background: 'rgba(255,26,26,0.12)',
                        border: '1px solid rgba(255,26,26,0.4)',
                        borderRadius: 10,
                        color: '#ff1a1a',
                        fontWeight: 700,
                        fontSize: 12,
                        padding: '0 16px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-space-mono, monospace)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Selected summary */}
                  {artists.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                        Selected ({artists.length})
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {artists.map(a => (
                          <span
                            key={a}
                            className="artist-chip"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '5px 12px',
                              borderRadius: 100,
                              background: 'rgba(255,26,26,0.12)',
                              border: '1px solid rgba(255,26,26,0.45)',
                              color: '#ff1a1a',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {a}
                            <button
                              onClick={() => removeArtist(a)}
                              className="chip-x"
                              aria-label={`Remove ${a}`}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff1a1a', fontSize: 14, padding: 0, lineHeight: 1 }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── CTA ── */}
                <button
                  onClick={handleFinishOnboarding}
                  disabled={saving}
                  className="ob-finish-btn"
                  style={{
                    width: '100%',
                    background: 'white',
                    color: 'black',
                    padding: '15px',
                    borderRadius: 12,
                    fontWeight: 900,
                    fontSize: 14,
                    letterSpacing: 1.5,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-space-mono, monospace)',
                    textTransform: 'uppercase',
                  }}
                >
                  {saving ? 'Saving…' : needsEmailConfirm ? 'Done →' : "Let's Go →"}
                </button>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 14 }}>
                  You can change these anytime in your account settings.
                </p>

              </div>
            </div>
          </div>
        )}

      </main>
    </>
  )
}

// ── Toggle row component ──────────────────────────────────────
function ConsentRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title: string
  description: string
}) {
  return (
    <div
      className="consent-row"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: '14px 16px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0)',
        cursor: 'pointer',
        marginBottom: 10,
        userSelect: 'none',
      }}
    >
      {/* Toggle switch */}
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <div
          className="sw-track"
          style={{
            width: 42,
            height: 24,
            borderRadius: 100,
            background: checked ? '#ff1a1a' : 'rgba(255,255,255,0.12)',
            position: 'relative',
          }}
        >
          <div
            className="sw-thumb"
            style={{
              position: 'absolute',
              top: 3,
              left: 3,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'white',
              transform: checked ? 'translateX(18px)' : 'translateX(0)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          />
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{title}</p>
        <p style={{ color: 'rgba(255,255,255,0.36)', fontSize: 12, lineHeight: 1.5 }}>{description}</p>
      </div>
    </div>
  )
}
