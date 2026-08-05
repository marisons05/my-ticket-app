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
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .checkout-card { animation: fadeUp 0.6s ease 0.1s both; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: '#000',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-space-mono, monospace)',
      }}>

        <Navbar />

        <div style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
          <div
            className="checkout-card"
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 18,
              padding: 36,
            }}
          >
            {/* Top accent bar */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, #ff1a1a, transparent)', borderRadius: 2, marginBottom: 28 }} />

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
