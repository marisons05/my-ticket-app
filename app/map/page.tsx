import { supabase } from '@/lib/supabase'
import Navbar from '../components/Navbar'
import MapWithFilter from '../components/MapWithFilter'

export default async function MapPage() {
  const { data: events } = await supabase.from('events').select('*')

  return (
    <div style={{ minHeight: '100vh', background: '#06000e', position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1000 }}>
        <Navbar />
      </div>
      <div style={{ padding: '24px 32px 32px' }}>
        <div style={{
          height: 'calc(100vh - 130px)',
          borderRadius: 18,
          overflow: 'hidden',
          border: '1px solid rgba(180,125,255,0.35)',
          boxShadow: '0 0 0 1px rgba(124,58,237,0.2), 0 0 40px rgba(124,58,237,0.15), inset 0 0 0 1px rgba(180,125,255,0.08)',
        }}>
          <MapWithFilter events={events ?? []} />
        </div>
      </div>
    </div>
  )
}
