import React, { useState } from "react";
import logo from "../assets/aqualastech-logo-noBG.png"
import water_bg from "../assets/water-bg.jpg"
import { FiPhone, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
    const navigate = useNavigate();
    const [bgLoaded, setBgLoaded] = useState(false);

    return (
        <div
            className="landing-page-main relative min-h-[100dvh] flex flex-col overflow-x-hidden"
            style={{ background: "linear-gradient(155deg, rgba(0,42,110,1) 0%, rgba(0,74,173,1) 35%, rgba(100,160,210,1) 70%, rgba(154,189,220,1) 100%)" }}
        >
            {/* Preload bg */}
            <img src={water_bg} alt="" className="hidden" onLoad={() => setBgLoaded(true)} />

            {/* Background image */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 pointer-events-none"
                style={{ backgroundImage: `url(${water_bg})`, opacity: bgLoaded ? 0.12 : 0 }}
            />

            {/* Radial glow */}
            <div className="radial-glow absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(100,180,255,0.18) 0%, transparent 65%)" }} />

            {/* Orbs */}
            <div className="orbs absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, #60b4ff, transparent)" }} />
            <div className="absolute bottom-[-100px] right-[-60px] w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, #a0d4ff, transparent)" }} />

            {/* ── Navbar ── */}
            <div
                className="nav-bar relative z-10 mx-3 mt-3 md:mx-6 md:mt-4 flex items-center justify-between px-4 md:px-8
                           h-14 landscape:h-12 md:h-20 rounded-2xl border border-white/30 shadow-xl shrink-0"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
            >
                {/* Logo */}
                <div className="logo flex items-center gap-2.5">
                    <img src={logo} alt="logo"
                        className="h-8 w-8 landscape:h-7 landscape:w-7 md:h-12 md:w-12 object-contain drop-shadow-lg" />
                    <span className="hidden sm:block font-bold text-white text-base md:text-lg tracking-tight"
                        style={{ textShadow: "0 1px 8px rgba(0,30,80,0.4)" }}>
                        AquaLasTech
                    </span>
                </div>

                {/* Phone — mobile (non-md) */}
                <div className="flex md:hidden items-center gap-1.5 text-sm font-medium"
                    style={{ color: "rgba(220,240,255,0.92)", textShadow: "0 1px 6px rgba(0,20,60,0.5)" }}>
                    <FiPhone size={14} className="flex-shrink-0" />
                    <span className="tracking-wide text-xs landscape:text-[11px]">09672534800</span>
                </div>

                {/* Phone centered + auth — md+ */}
                <div className="hidden md:flex items-center w-full absolute left-0 right-0 px-8 pointer-events-none justify-center">
                    <div className="flex items-center gap-2 text-base font-medium pointer-events-auto"
                        style={{ color: "rgba(220,240,255,0.92)", textShadow: "0 1px 6px rgba(0,20,60,0.5)" }}>
                        <FiPhone size={16} className="flex-shrink-0" />
                        <span className="tracking-wide">09672534800</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-1 text-base font-semibold relative z-10">
                    <button onClick={() => navigate("/login")}
                        className="px-3 py-1.5 rounded-xl transition-all hover:bg-white/15 active:scale-95"
                        style={{ color: "rgba(220,240,255,0.9)" }}>
                        Log in
                    </button>
                    <span style={{ color: "rgba(180,210,255,0.5)" }}>|</span>
                    <button onClick={() => navigate("/signup")}
                        className="px-3 py-1.5 rounded-xl transition-all hover:bg-white/15 active:scale-95"
                        style={{ color: "rgba(220,240,255,0.9)" }}>
                        Sign up
                    </button>
                </div>
            </div>

            {/* ── Hero ── */}
            {/*
                Portrait phone : py-12, large stacked layout
                Landscape phone: py-4, compressed — two-column feel via tighter spacing
                Tablet/desktop : py-12+ as before
            */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center
                            px-6 py-12 landscape:py-4 md:py-16 min-h-0">

                {/* Heading */}
                <h1
                    className="font-bold tracking-tight leading-none
                               text-5xl landscape:text-3xl md:text-7xl lg:text-8xl"
                    style={{
                        color: "rgba(255,255,255,0.97)",
                        textShadow: "0 4px 24px rgba(0,30,90,0.5), 0 1px 2px rgba(0,10,40,0.3)"
                    }}
                >
                    AquaLasTech
                </h1>

                {/* Subtitle */}
                <p
                    className="mt-3 landscape:mt-2 max-w-lg leading-relaxed font-light
                               text-base landscape:text-sm md:text-xl lg:text-2xl"
                    style={{ color: "rgba(210,235,255,0.88)", textShadow: "0 2px 12px rgba(0,20,70,0.45)" }}
                >
                    Streamlining Water Orders,{" "}
                    <span style={{ color: "rgba(180,220,255,0.95)", fontWeight: 500 }}>
                        Enhancing Service Efficiency
                    </span>
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-6 md:gap-10 mt-6 landscape:mt-3 mb-2">
                    {[
                        { label: "Orders Delivered", value: "10K+" },
                        { label: "Happy Customers", value: "500+" },
                        { label: "Uptime", value: "99.9%" },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col items-center">
                            <span className="font-bold text-xl landscape:text-base md:text-2xl"
                                style={{ color: "rgba(255,255,255,0.97)", textShadow: "0 2px 10px rgba(0,20,80,0.4)" }}>
                                {value}
                            </span>
                            <span className="text-[10px] mt-0.5 tracking-wide"
                                style={{ color: "rgba(190,220,255,0.75)" }}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={() => navigate("/login")}
                    className="mt-6 landscape:mt-3 flex items-center gap-3
                               px-8 landscape:px-6 py-4 landscape:py-2.5
                               rounded-2xl text-base md:text-lg font-semibold
                               transition-all duration-200 active:scale-95 shadow-2xl group"
                    style={{
                        background: "rgba(255,255,255,0.18)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        color: "rgba(255,255,255,0.97)",
                        textShadow: "0 1px 6px rgba(0,20,60,0.4)",
                        boxShadow: "0 8px 32px rgba(0,40,120,0.25), inset 0 1px 0 rgba(255,255,255,0.2)"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.26)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
                >
                    Order Water Now
                    <FiArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
                </button>

                {/* Subtext */}
                <p className="mt-3 landscape:mt-1.5 text-xs md:text-sm"
                    style={{ color: "rgba(180,215,255,0.65)" }}>
                    Digital Payment · Real-time tracking · Easy Order
                </p>

                {/* Mobile-only login/signup buttons (portrait + landscape) */}
                <div className="flex md:hidden items-center gap-3 mt-5 landscape:mt-3">
                    <button onClick={() => navigate("/login")}
                        className="px-5 py-2 rounded-xl border border-white/30 text-sm font-semibold
                                   bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                        style={{ color: "rgba(220,240,255,0.95)" }}>
                        Log in
                    </button>
                    <button onClick={() => navigate("/signup")}
                        className="px-5 py-2 rounded-xl border border-white/30 text-sm font-semibold
                                   bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                        style={{ color: "rgba(220,240,255,0.95)" }}>
                        Sign up
                    </button>
                </div>
            </div>

            {/* ── Wave — hidden in landscape to save vertical space ── */}
            <div className="relative z-10 w-full shrink-0 landscape:hidden" style={{ height: "60px" }}>
                <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
                        fill="rgba(255,255,255,0.06)" />
                    <path d="M0,45 C480,15 960,55 1440,40 L1440,60 L0,60 Z"
                        fill="rgba(255,255,255,0.04)" />
                </svg>
            </div>
        </div>
    );
};

export default LandingPage;