import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

export async function GET() {
  const { data, error } = await supabase
    .from('music_events')
    .select('*')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}