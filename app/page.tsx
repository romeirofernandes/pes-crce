/**
 * This file is a shim for v0 compatibility.
 * The actual application is built with Vite + React Router in /src
 * 
 * To run this project:
 * 1. npm install
 * 2. npm run dev
 * 3. Open http://localhost:5173
 */

export default function Page() {
  return (
    <div style={{ 
      padding: '40px', 
      background: '#09090b', 
      color: '#fafafa',
      fontFamily: 'system-ui, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '28px', marginBottom: '20px', fontWeight: 'bold' }}>
        ⚽ PES Tournament Manager
      </h1>
      <p style={{ fontSize: '16px', marginBottom: '30px', color: '#a1a1a6' }}>
        A production-grade Vite + React SPA
      </p>
      <div style={{ 
        background: '#27272a', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #3f3f46',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#fafafa', marginBottom: '16px' }}>
          This project is built with <strong>Vite + React Router</strong>, not Next.js.
        </p>
        <ol style={{ 
          textAlign: 'left', 
          color: '#a1a1a6',
          paddingLeft: '20px',
          lineHeight: '1.8'
        }}>
          <li>Run: <code style={{ background: '#18181b', padding: '4px 8px', borderRadius: '4px' }}>npm install</code></li>
          <li>Run: <code style={{ background: '#18181b', padding: '4px 8px', borderRadius: '4px' }}>npm run dev</code></li>
          <li>Open: <code style={{ background: '#18181b', padding: '4px 8px', borderRadius: '4px' }}>http://localhost:5173</code></li>
        </ol>
      </div>
      <div style={{ 
        marginTop: '40px', 
        fontSize: '14px', 
        color: '#52525b',
        textAlign: 'center'
      }}>
        <p>Features:</p>
        <ul style={{ color: '#a1a1a6', paddingLeft: '20px' }}>
          <li>📊 Live tournament standings with React Flow</li>
          <li>🎮 Toggle 1v1 and 2v2 formats</li>
          <li>🔐 Password-protected admin panel</li>
          <li>🎲 Smart fixture generation with fair randomization</li>
          <li>💾 Persistent localStorage data</li>
        </ul>
      </div>
    </div>
  )
}
