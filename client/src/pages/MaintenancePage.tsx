// MaintenancePage - shown to customers when their station is under maintenance
import { useNavigate } from 'react-router-dom'
import logo from '../assets/aqualastech-logo-noBG.png'

const MaintenancePage = () => {
    const navigate = useNavigate()

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(155deg,#000d2e 0%,#001a5c 40%,#002a7a 70%,#003d99 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', padding: '24px',
        }}>
            {/* Animated bubbles */}
            {[
                { size: 60, left: '8%', delay: '0s', dur: '7s', top: '75%' },
                { size: 30, left: '18%', delay: '1.5s', dur: '9s', top: '80%' },
                { size: 80, left: '72%', delay: '0.8s', dur: '8s', top: '78%' },
                { size: 20, left: '85%', delay: '2s', dur: '6s', top: '82%' },
                { size: 45, left: '50%', delay: '3s', dur: '10s', top: '77%' },
                { size: 25, left: '35%', delay: '1s', dur: '7.5s', top: '85%' },
            ].map((b, i) => (
                <div key={i} style={{
                    position: 'absolute', left: b.left, top: b.top,
                    width: b.size, height: b.size, borderRadius: '50%',
                    border: '2px solid rgba(56,189,248,0.3)',
                    background: 'rgba(56,189,248,0.06)',
                    animation: `bubbleRise ${b.dur} ${b.delay} infinite ease-in`,
                    pointerEvents: 'none',
                }} />
            ))}

            {/* Glow orb */}
            <div style={{
                position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
                width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 480 }}>

                {/* Logo */}
                <img src={logo} alt="AquaLasTech" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 24, filter: 'drop-shadow(0 0 16px rgba(56,189,248,0.5))' }} />

                {/* Water drop with wrench icon (SVG) */}
                <div style={{ marginBottom: 28 }}>
                    <svg width="90" height="100" viewBox="0 0 90 100" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                        <defs>
                            <linearGradient id="dropGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#1de9b6" />
                                <stop offset="100%" stopColor="#29b6f6" />
                            </linearGradient>
                        </defs>
                        {/* Drop shape */}
                        <path d="M45 5 C45 5 15 45 15 62 C15 79 28.5 92 45 92 C61.5 92 75 79 75 62 C75 45 45 5 45 5Z"
                            fill="url(#dropGrad)" opacity="0.9" />
                        {/* Wrench icon inside drop */}
                        <g transform="translate(27, 46)" fill="white" opacity="0.95">
                            <path d="M11 2C8.5 2 6.3 3.3 5 5.3L8.5 8.8L6.5 10.8L3 7.3C2.4 8.5 2 9.9 2 11.5C2 16 5.7 19.5 10.2 19.5C11.2 19.5 12.2 19.3 13.1 18.9L20.5 26.3C21.3 27.1 22.5 27.1 23.3 26.3L25.3 24.3C26.1 23.5 26.1 22.3 25.3 21.5L17.9 14.1C18.3 13.2 18.5 12.2 18.5 11.2C18.5 6.7 15 2 10.5 2L11 2Z" />
                        </g>
                    </svg>
                </div>

                {/* Text */}
                <h1 style={{
                    fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', fontWeight: 900, color: '#ffffff',
                    marginBottom: 10, letterSpacing: '-0.02em',
                    textShadow: '0 4px 24px rgba(0,30,90,0.5)',
                }}>
                    Under Maintenance
                </h1>
                <p style={{ color: 'rgba(210,235,255,0.75)', fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
                    We're currently improving our services.
                </p>
                <p style={{ color: 'rgba(147,210,255,0.65)', fontSize: 13, marginBottom: 36 }}>
                    Please check back soon — we'll be up and running shortly.
                </p>

                {/* Water ripple decoration */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 36 }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#38bdf8',
                            animation: `rippleDot 1.4s ${i * 0.2}s infinite ease-in-out`,
                            opacity: 0.7,
                        }} />
                    ))}
                </div>

                {/* Back button */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '12px 28px', borderRadius: 14, fontWeight: 700,
                        fontSize: 14, color: '#fff', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(12px)',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                >
                    ← Back to Home
                </button>
            </div>

            <style>{`
                @keyframes bubbleRise {
                    0%   { transform: translateY(0) scale(1); opacity: 0.6; }
                    100% { transform: translateY(-90vh) scale(0.4); opacity: 0; }
                }
                @keyframes rippleDot {
                    0%, 100% { transform: translateY(0); opacity: 0.7; }
                    50%       { transform: translateY(-8px); opacity: 1; }
                }
            `}</style>
        </div>
    )
}

export default MaintenancePage
