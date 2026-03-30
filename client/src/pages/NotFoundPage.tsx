// NotFoundPage - 404 page with water-themed design
import { useNavigate } from 'react-router-dom'

const NotFoundPage = () => {
    const navigate = useNavigate()

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(155deg,#000d2e 0%,#001a5c 40%,#002a7a 70%,#003d99 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', padding: '24px',
        }}>
            {/* Bubbles */}
            {[
                { size: 50, left: '5%', delay: '0s', dur: '8s' },
                { size: 25, left: '20%', delay: '2s', dur: '6s' },
                { size: 70, left: '78%', delay: '1s', dur: '9s' },
                { size: 35, left: '90%', delay: '3s', dur: '7s' },
                { size: 18, left: '60%', delay: '1.5s', dur: '10s' },
                { size: 42, left: '40%', delay: '4s', dur: '8s' },
            ].map((b, i) => (
                <div key={i} style={{
                    position: 'absolute', left: b.left, bottom: '-80px',
                    width: b.size, height: b.size, borderRadius: '50%',
                    border: '2px solid rgba(56,189,248,0.25)',
                    background: 'rgba(56,189,248,0.05)',
                    animation: `bubbleRise ${b.dur} ${b.delay} infinite ease-in`,
                    pointerEvents: 'none',
                }} />
            ))}

            {/* Radial glow */}
            <div style={{
                position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 520 }}>

                {/* Crying water drop SVG */}
                <div style={{ marginBottom: 20 }}>
                    <svg width="110" height="130" viewBox="0 0 110 130" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                        <defs>
                            <linearGradient id="drop404" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#1de9b6" />
                                <stop offset="100%" stopColor="#29b6f6" />
                            </linearGradient>
                        </defs>
                        {/* Main drop */}
                        <path d="M55 6 C55 6 18 56 18 78 C18 100 34.5 118 55 118 C75.5 118 92 100 92 78 C92 56 55 6 55 6Z"
                            fill="url(#drop404)" opacity="0.88" />
                        {/* Sad eyes */}
                        <circle cx="43" cy="72" r="5" fill="white" opacity="0.9" />
                        <circle cx="67" cy="72" r="5" fill="white" opacity="0.9" />
                        <circle cx="44.5" cy="73.5" r="2.5" fill="#003d99" />
                        <circle cx="68.5" cy="73.5" r="2.5" fill="#003d99" />
                        {/* Sad mouth */}
                        <path d="M43 91 Q55 83 67 91" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
                        {/* Tear drops */}
                        <ellipse cx="41" cy="82" rx="2.5" ry="4" fill="rgba(255,255,255,0.6)" style={{ animation: 'tearDrop 2s 0s infinite' }} />
                        <ellipse cx="69" cy="84" rx="2.5" ry="4" fill="rgba(255,255,255,0.6)" style={{ animation: 'tearDrop 2s 0.6s infinite' }} />
                        {/* Eyebrows (sad) */}
                        <path d="M37 64 Q43 60 49 63" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
                        <path d="M61 63 Q67 60 73 64" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
                    </svg>
                </div>

                {/* 404 text */}
                <h1 style={{
                    fontSize: 'clamp(4rem, 15vw, 7rem)', fontWeight: 900, lineHeight: 1,
                    background: 'linear-gradient(90deg, #1de9b6 0%, #29b6f6 50%, #7dd3fc 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    marginBottom: 8, letterSpacing: '-0.04em',
                    filter: 'drop-shadow(0 4px 16px rgba(56,189,248,0.4))',
                }}>
                    404
                </h1>

                <h2 style={{
                    fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 700,
                    color: '#ffffff', marginBottom: 10, letterSpacing: '-0.01em',
                }}>
                    Page Not Found
                </h2>
                <p style={{ color: 'rgba(210,235,255,0.65)', fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
                    Looks like this page went down the drain.<br />
                    Let's get you back to dry land.
                </p>

                {/* Ripple dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            width: 8, height: 8, borderRadius: '50%', background: '#38bdf8',
                            animation: `rippleDot 1.4s ${i * 0.2}s infinite ease-in-out`, opacity: 0.7,
                        }} />
                    ))}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '11px 24px', borderRadius: 13, fontWeight: 600,
                            fontSize: 13, color: 'rgba(210,235,255,0.85)', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            backdropFilter: 'blur(12px)', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    >
                        ← Go Back
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '11px 24px', borderRadius: 13, fontWeight: 700,
                            fontSize: 13, color: '#fff', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #0ea5e9, #1565c0)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            boxShadow: '0 8px 24px rgba(14,165,233,0.35)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        Go Home
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes bubbleRise {
                    0%   { transform: translateY(0) scale(1); opacity: 0.5; }
                    100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
                }
                @keyframes rippleDot {
                    0%, 100% { transform: translateY(0); opacity: 0.7; }
                    50%       { transform: translateY(-8px); opacity: 1; }
                }
                @keyframes tearDrop {
                    0%   { transform: translateY(0); opacity: 0.6; }
                    60%  { transform: translateY(8px); opacity: 0.8; }
                    100% { transform: translateY(16px); opacity: 0; }
                }
            `}</style>
        </div>
    )
}

export default NotFoundPage
