import { supabase } from '@/lib/supabase'
import Navbar from '../components/Navbar'
import MapWithFilter from '../components/MapWithFilter'

export default async function MapPage() {
  const { data: events } = await supabase
    .from('events')
    .select('id, title, starts_at, ends_at, ticket_url, genre_tags, image_url, description, venues(name, address, lat, lng)')
    .eq('status', 'published')
    .order('starts_at', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', background: '#000', position: 'relative', fontFamily: 'var(--font-space-mono, monospace)' }}>
      <div style={{ position: 'relative', zIndex: 1000 }}>
        <Navbar />
      </div>
      <div style={{ padding: '24px 32px 32px' }}>
        <div style={{
          height: 'calc(100vh - 130px)',
          borderRadius: 18,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.09)',
        }}>
          <MapWithFilter events={events ?? []} />
        </div>
      </div>
    </div>
  )
}
