import React, { useState, useEffect } from "react";
import logo from "../assets/aqualastech-logo-noBG.png"
import water_bg from "../assets/water-bg.jpg"
import { FiPhone, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
    const navigate = useNavigate();
    const [bgLoaded, setBgLoaded] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
        }
    }, [])

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: "linear-gradient(155deg, rgba(0,42,110,1) 0%, rgba(0,74,173,1) 35%, rgba(100,160,210,1) 70%, rgba(154,189,220,1) 100%)"
            }}
        >
            <img src={water_bg} alt="" className="hidden" onLoad={() => setBgLoaded(true)} />
            <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 pointer-events-none"
                style={{ backgroundImage: `url(${water_bg})`, opacity: bgLoaded ? 0.12 : 0 }} />
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(100,180,255,0.18) 0%, transparent 65%)" }} />
            <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, #60b4ff, transparent)" }} />
            <div className="absolute bottom-[-100px] right-[-60px] w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, #a0d4ff, transparent)" }} />

            {/* Navbar — shorter in landscape */}
            <div
                className="relative z-10 mx-3 mt-2 md:mx-6 md:mt-4 flex items-center justify-between px-4 md:px-8
                           h-11 [@media(max-height:500px)_and_(orientation:landscape)]:h-10 md:h-16 rounded-2xl border border-white/30 shadow-xl shrink-0"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
            >
                <div className="flex items-center gap-2.5">
                    <img src={logo} alt="logo" className="h-7 w-7 md:h-10 md:w-10 object-contain drop-shadow-lg" />
                    <span className="font-bold text-white text-base md:text-xl tracking-tight"
                        style={{ textShadow: "0 1px 8px rgba(0,30,80,0.4)" }}>
                        AquaLasTech
                    </span>
                </div>

                <div className="hidden md:flex items-center w-full absolute left-0 right-0 pointer-events-none justify-center">
                    <div className="flex items-center gap-2 text-sm font-medium pointer-events-auto"
                        style={{ color: "rgba(220,240,255,0.92)" }}>
                        <FiPhone size={14} />
                        <span>09672534800</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-1 text-sm font-semibold relative z-10">
                    <button onClick={() => navigate("/login")}
                        className="px-4 py-2 rounded-xl transition-all hover:bg-white/15 active:scale-95"
                        style={{ color: "rgba(220,240,255,0.9)" }}>Log in</button>
                    <span style={{ color: "rgba(180,210,255,0.5)" }}>|</span>
                    <button onClick={() => navigate("/signup")}
                        className="px-4 py-2 rounded-xl transition-all hover:bg-white/15 active:scale-95"
                        style={{ color: "rgba(220,240,255,0.9)" }}>Sign up</button>
                </div>

                <div className="flex md:hidden items-center gap-1.5" style={{ color: "rgba(220,240,255,0.92)" }}>
                    <FiPhone size={12} />
                    <span className="text-xs">09672534800</span>
                </div>
            </div>

            {/* Hero */}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center text-center px-6
                            [@media(max-height:500px)_and_(orientation:landscape)]:flex-row [@media(max-height:500px)_and_(orientation:landscape)]:gap-10 [@media(max-height:500px)_and_(orientation:landscape)]:px-10 [@media(max-height:500px)_and_(orientation:landscape)]:justify-center">

                {/* Left side in [@media(max-height:500px)_and_(orientation:landscape)]: heading + subtitle */}
                <div className="flex flex-col items-center [@media(max-height:500px)_and_(orientation:landscape)]:items-start [@media(max-height:500px)_and_(orientation:landscape)]:text-left [@media(max-height:500px)_and_(orientation:landscape)]:flex-1">
                    <h1
                        className="font-bold tracking-tight leading-none text-5xl [@media(max-height:500px)_and_(orientation:landscape)]:text-4xl md:text-7xl lg:text-8xl"
                        style={{ color: "rgba(255,255,255,0.97)", textShadow: "0 4px 24px rgba(0,30,90,0.5)" }}
                    >
                        AquaLasTech
                    </h1>
                    <p className="mt-2 max-w-xs [@media(max-height:500px)_and_(orientation:landscape)]:max-w-sm leading-relaxed font-light text-sm md:text-lg"
                        style={{ color: "rgba(210,235,255,0.88)" }}>
                        Streamlining Water Orders,{" "}
                        <span style={{ color: "rgba(180,220,255,0.95)", fontWeight: 500 }}>
                            Enhancing Service Efficiency
                        </span>
                    </p>

                    {/* Stats — hidden in landscape, shown in portrait */}
                    <div className="[@media(max-height:500px)_and_(orientation:landscape)]:hidden flex items-center gap-6 mt-5">
                        {[
                            { label: "Orders Delivered", value: "10K+" },
                            { label: "Happy Customers", value: "500+" },
                            { label: "Uptime", value: "99.9%" },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex flex-col items-center">
                                <span className="font-bold text-xl" style={{ color: "rgba(255,255,255,0.97)" }}>{value}</span>
                                <span className="text-[10px] mt-0.5 tracking-wide" style={{ color: "rgba(190,220,255,0.75)" }}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side in [@media(max-height:500px)_and_(orientation:landscape)]: CTA + buttons */}
                <div className="flex flex-col items-center [@media(max-height:500px)_and_(orientation:landscape)]:items-start [@media(max-height:500px)_and_(orientation:landscape)]:flex-1 mt-5 [@media(max-height:500px)_and_(orientation:landscape)]:mt-0">
                    {/* Stats in landscape */}
                    <div className="hidden [@media(max-height:500px)_and_(orientation:landscape)]:flex items-center gap-6 mb-4">
                        {[
                            { label: "Orders Delivered", value: "10K+" },
                            { label: "Happy Customers", value: "500+" },
                            { label: "Uptime", value: "99.9%" },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex flex-col items-center">
                                <span className="font-bold text-lg" style={{ color: "rgba(255,255,255,0.97)" }}>{value}</span>
                                <span className="text-[10px] mt-0.5 tracking-wide" style={{ color: "rgba(190,220,255,0.75)" }}>{label}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate("/login")}
                        className="flex items-center gap-3 px-8 py-3 rounded-2xl text-base font-semibold
                                   transition-all duration-200 active:scale-95 shadow-2xl group"
                        style={{
                            background: "rgba(255,255,255,0.18)",
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            border: "1px solid rgba(255,255,255,0.35)",
                            color: "rgba(255,255,255,0.97)",
                            boxShadow: "0 8px 32px rgba(0,40,120,0.25), inset 0 1px 0 rgba(255,255,255,0.2)"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.26)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
                    >
                        Order Water Now
                        <FiArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </button>

                    <p className="mt-2 text-xs" style={{ color: "rgba(180,215,255,0.65)" }}>
                        Digital Payment · Real-time tracking · Easy Order
                    </p>

                    <div className="flex md:hidden items-center gap-3 mt-3">
                        <button onClick={() => navigate("/login")}
                            className="px-5 py-1.5 rounded-xl border border-white/30 text-sm font-semibold bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                            style={{ color: "rgba(220,240,255,0.95)" }}>Log in</button>
                        <button onClick={() => navigate("/signup")}
                            className="px-5 py-1.5 rounded-xl border border-white/30 text-sm font-semibold bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                            style={{ color: "rgba(220,240,255,0.95)" }}>Sign up</button>
                    </div>
                </div>
            </div>

            {/* Wave — hidden in landscape */}
            <div className="[@media(max-height:500px)_and_(orientation:landscape)]:hidden relative z-10 w-full shrink-0" style={{ height: "50px" }}>
                <svg viewBox="0 0 1440 50" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0,25 C360,50 1080,0 1440,25 L1440,50 L0,50 Z" fill="rgba(255,255,255,0.06)" />
                    <path d="M0,38 C480,12 960,45 1440,32 L1440,50 L0,50 Z" fill="rgba(255,255,255,0.04)" />
                </svg>
            </div>
        </div>
    );
};

export default LandingPage;