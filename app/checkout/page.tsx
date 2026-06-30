import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PayButton from './PayButton'
import Navbar from '../components/Navbar'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { eventId } = await searchParams

  if (!eventId || typeof eventId !== 'string') {
    notFound()
  }

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) {
    notFound()
  }

  return (
    <>
      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(40px,-30px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.95); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(-50px,20px) scale(1.05); }
          66% { transform: translate(30px,-15px) scale(0.9); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .checkout-card { animation: fadeUp 0.6s ease 0.1s both; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #06000e 0%, #180838 40%, #2a0e5a 70%, #06000e 100%)',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-geist-sans, Arial, sans-serif)',
      }}>

        {/* Background orbs */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', animation: 'orb1 18s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '50%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,157,0.18) 0%, transparent 70%)', animation: 'orb2 22s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        </div>

        <Navbar />

        <div style={{ position: 'relative', zIndex: 10, padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
          <div
            className="checkout-card"
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: 36,
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Top accent bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #7c3aed, #ff6b9d, #00d4ff)', borderRadius: 2, marginBottom: 28 }} />

            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 24, letterSpacing: 0.5 }}>
              Order Summary
            </h2>

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 12, letterSpacing: 0.5 }}>
                {event.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontSize: 14 }}>📍 {event.location}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontSize: 14 }}>
                📅 {new Date(event.date).toLocaleDateString('en-LV', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
              {event.description && (
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>{event.description}</p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: 15 }}>1× ticket</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>€{event.price}</span>
            </div>

            <PayButton eventId={event.id} eventTitle={event.title} price={event.price} />
          </div>
        </div>
      </main>
    </>
  )
}
