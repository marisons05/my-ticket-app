export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '32px 40px',
      textAlign: 'center',
      background: '#000',
      fontFamily: 'var(--font-space-mono, monospace)',
    }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 4px' }}>
        {['Terms & Conditions', 'Privacy Policy', 'Refund Policy', 'About Us', 'Contact'].map((label, i, arr) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'default' }}>{label}</span>
            {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>|</span>}
          </span>
        ))}
      </div>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0 }}>© 2026 The Mix. All rights reserved.</p>
    </footer>
  )
}
