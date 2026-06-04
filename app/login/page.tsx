'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

const NOTES = [
  { symbol: '♪', top: '12%', left: '6%',  size: 22, delay: 0,   color: '#ff6b9d' },
  { symbol: '♫', top: '70%', left: '90%', size: 32, delay: 0.8, color: '#00d4ff' },
  { symbol: '♬', top: '40%', left: '92%', size: 24, delay: 1.4, color: '#ffd700' },
  { symbol: '♩', top: '80%', left: '4%',  size: 18, delay: 0.5, color: '#b47dff' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const handleAuth = async () => {
    setMessage('')
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setIsError(true); setMessage(error.message); return }
      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, username })
      }
      setIsError(false)
      setMessage('Account created! You can now log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setIsError(true); setMessage(error.message) }
      else window.location.href = '/events'
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '13px 16px',
    color: 'white',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: 14,
    transition: 'border-color 0.2s ease',
  }

  return (
    <>
      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0)       scale(1);    }
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
        @keyframes glowPulse {
          0%,100% { text-shadow: 0 0 30px rgba(255,107,157,0.7), 0 0 60px rgba(124,58,237,0.5); }
          50%      { text-shadow: 0 0 50px rgba(255,107,157,1),   0 0 100px rgba(124,58,237,0.8); }
        }
        @keyframes btnGlow {
          0%,100% { box-shadow: 0 0 20px rgba(255,107,157,0.4), 0 4px 24px rgba(124,58,237,0.4); }
          50%      { box-shadow: 0 0 40px rgba(255,107,157,0.7), 0 4px 40px rgba(124,58,237,0.7); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .login-card { animation: fadeUp 0.6s ease 0.1s both; }
        .login-input:focus { border-color: rgba(180,125,255,0.6) !important; background: rgba(255,255,255,0.09) !important; }
        .login-input::placeholder { color: rgba(255,255,255,0.3); }
        .toggle-btn:hover { color: #ff6b9d !important; }
        .toggle-btn { transition: color 0.2s ease; }
        .submit-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .submit-btn { transition: all 0.2s ease; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #06000e 0%, #180838 40%, #2a0e5a 70%, #06000e 100%)',
        position: 'relative',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-geist-sans, Arial, sans-serif)',
      }}>

        {/* Background layer */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '5%',  left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', animation: 'orb1 18s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '50%', right: '5%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,157,0.18) 0%, transparent 70%)', animation: 'orb2 22s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
          {NOTES.map((n, i) => (
            <div key={i} style={{ position: 'absolute', top: n.top, left: n.left, fontSize: n.size, color: n.color, animation: `floatNote ${3.2 + i * 0.6}s ease-in-out ${n.delay}s infinite`, userSelect: 'none' }}>
              {n.symbol}
            </div>
          ))}
        </div>

        {/* Navbar */}
        <nav style={{ position: 'relative', zIndex: 20, height: 70, padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ color: 'white', fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>THE MIX</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 4 }}>LIVE EVENTS</span>
          </Link>
        </nav>

        {/* Form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 10 }}>
          <div className="login-card" style={{
            width: '100%',
            maxWidth: 420,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: '40px 36px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>

            {/* Card header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, letterSpacing: 1, marginBottom: 6, animation: 'glowPulse 4s ease-in-out infinite' }}>
                {isSignUp ? 'Join The Mix' : 'Welcome Back'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14 }}>
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
              className="login-input"
              style={{ ...inputStyle, marginBottom: 24 }}
            />

            <button
              onClick={handleAuth}
              className="submit-btn"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #7c3aed, #ff6b9d)',
                color: 'white',
                padding: '14px',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: 1,
                border: 'none',
                cursor: 'pointer',
                animation: 'btnGlow 3s ease-in-out infinite',
              }}
            >
              {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN →'}
            </button>

            {message && (
              <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: isError ? '#ff6b9d' : '#00d4ff' }}>
                {message}
              </p>
            )}

            <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
                className="toggle-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(180,125,255,0.9)', fontWeight: 700, fontSize: 13, padding: 0 }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>

      </main>
    </>
  )
}
