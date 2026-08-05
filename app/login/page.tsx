'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Navbar from '@/app/components/Navbar'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

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
      else window.location.href = '/'
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '13px 16px',
    color: 'white',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box' as const,
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
        .login-card { animation: fadeUp 0.6s ease 0.1s both; }
        .login-input:focus { border-color: rgba(255,26,26,0.6) !important; background: rgba(255,255,255,0.08) !important; }
        .login-input::placeholder { color: rgba(255,255,255,0.3); }
        .toggle-btn:hover { color: #ff1a1a !important; }
        .toggle-btn { transition: color 0.2s ease; }
        .submit-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .submit-btn { transition: all 0.2s ease; }
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

        {/* Form */}
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

            {/* Card header */}
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

      </main>
    </>
  )
}
