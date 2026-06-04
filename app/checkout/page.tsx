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
    <main className="min-h-screen" style={{ backgroundColor: '#3d1f7a' }}>
      <Navbar />
      <div style={{ padding: '32px', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', marginBottom: '16px' }}>
            Order Summary
          </h2>
          <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111', marginBottom: '8px' }}>
              {event.title}
            </h3>
            <p style={{ color: '#555', marginBottom: '4px' }}>📍 {event.location}</p>
            <p style={{ color: '#555', marginBottom: '4px' }}>
              📅 {new Date(event.date).toLocaleDateString('en-LV', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
            {event.description && (
              <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>{event.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ color: '#555', fontWeight: '500' }}>1x ticket</span>
            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#111' }}>€{event.price}</span>
          </div>
          <PayButton eventId={event.id} eventTitle={event.title} price={event.price} />
        </div>
      </div>
    </main>
  )
}
