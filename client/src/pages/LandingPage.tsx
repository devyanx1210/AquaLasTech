import React, { useState } from "react";
// import logo from "../../public/assets/aqualastech-logo-noBG.png";
import logo from "../assets/aqualastech-logo-noBG.png"

// import water_bg from "../../public/assets/water-bg.jpg";
import water_bg from "../assets/water-bg.jpg"
import { FiPhone, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
    const navigate = useNavigate();
    const [bgLoaded, setBgLoaded] = useState(false); // added
    return (
        <div
            className="landing-page-main relative min-h-screen flex flex-col overflow-hidden"
            style={{ background: "linear-gradient(155deg, rgba(0,42,110,1) 0%, rgba(0,74,173,1) 35%, rgba(100,160,210,1) 70%, rgba(154,189,220,1) 100%)" }}
        >
            {/* 👇 Hidden img tag to preload the background */}
            <img
                src={water_bg}
                alt=""
                className="hidden"
                onLoad={() => setBgLoaded(true)}
            />

            {/* Background Image — fades in only after loaded */}
            <div
                className="water-bg absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{
                    backgroundImage: `url(${water_bg})`,
                    opacity: bgLoaded ? 0.12 : 0  // fades from 0 to 0.12
                }}
            />

            {/* Subtle radial glow */}
            <div className="glow absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(100,180,255,0.18) 0%, transparent 65%)" }}
            />

            {/* Decorative blurred orbs */}
            <div className="decors absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, #60b4ff, transparent)" }} />
            <div className="decors absolute bottom-[-100px] right-[-60px] w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, #a0d4ff, transparent)" }} />

            {/* ── Navbar ── */}
            <div
                className="navbar relative z-10 mx-3 mt-3 md:mx-6 md:mt-4 flex items-center justify-between px-4 md:px-8 h-16 md:h-20 rounded-2xl border border-white/30 shadow-xl"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
            >
                <div className="logo flex items-center gap-2.5">
                    <img
                        src={logo}
                        alt="logo"
                        className="h-9 w-9 md:h-12 md:w-12 object-contain drop-shadow-lg"
                    />
                    <span
                        className="app-name hidden sm:block font-bold text-white text-base md:text-lg tracking-tight"
                        style={{ textShadow: "0 1px 8px rgba(0,30,80,0.4)" }}
                    >
                        AquaLasTech
                    </span>
                </div>

                {/* Phone Number:
                    - mobile: stays in flow on the right (no absolute positioning)
                    - md+: absolutely centered */}
                <div
                    className="phone-right flex md:hidden items-center gap-1.5 text-sm font-medium"
                    style={{ color: "rgba(220,240,255,0.92)", textShadow: "0 1px 6px rgba(0,20,60,0.5)" }}
                >
                    <FiPhone size={15} className="flex-shrink-0" />
                    <span className="tracking-wide">09672534800</span>
                </div>

                {/* md+ layout: phone centered + auth buttons right */}
                <div className="phone-centered hidden md:flex items-center w-full absolute left-0 right-0 px-8 pointer-events-none justify-center">
                    <div
                        className="flex items-center gap-2 text-base font-medium pointer-events-auto"
                        style={{ color: "rgba(220,240,255,0.92)", textShadow: "0 1px 6px rgba(0,20,60,0.5)" }}
                    >
                        <FiPhone size={16} className="flex-shrink-0" />
                        <span className="tracking-wide">09672534800</span>
                    </div>
                </div>

                {/* Auth Buttons — md+ only */}
                <div className="hidden md:flex items-center gap-1 text-base font-semibold relative z-10">
                    <button
                        onClick={() => navigate("/login")}
                        className="px-3 py-1.5 rounded-xl transition-all hover:bg-white/15 active:scale-95"
                        style={{ color: "rgba(220,240,255,0.9)", textShadow: "0 1px 6px rgba(0,20,60,0.4)" }}
                    >
                        Log in
                    </button>
                    <span style={{ color: "rgba(180,210,255,0.5)" }}>|</span>
                    <button
                        onClick={() => navigate("/signup")}
                        className="px-3 py-1.5 rounded-xl transition-all hover:bg-white/15 active:scale-95"
                        style={{ color: "rgba(220,240,255,0.9)", textShadow: "0 1px 6px rgba(0,20,60,0.4)" }}
                    >
                        Sign up
                    </button>
                </div>
            </div>

            {/* ── Hero Section ── */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-12">

                {/* Main Heading */}
                <h1
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none"
                    style={{
                        color: "rgba(255,255,255,0.97)",
                        textShadow: "0 4px 24px rgba(0,30,90,0.5), 0 1px 2px rgba(0,10,40,0.3)"
                    }}
                >
                    AquaLasTech
                </h1>

                {/* Subtitle */}
                <p
                    className="mt-5 max-w-lg text-base md:text-xl lg:text-2xl leading-relaxed font-light"
                    style={{
                        color: "rgba(210,235,255,0.88)",
                        textShadow: "0 2px 12px rgba(0,20,70,0.45)"
                    }}
                >
                    Streamlining Water Orders,{" "}
                    <span style={{ color: "rgba(180,220,255,0.95)", fontWeight: 500 }}>
                        Enhancing Service Efficiency
                    </span>
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-6 md:gap-10 mt-8 mb-2">
                    {[
                        { label: "Orders Delivered", value: "10K+" },
                        { label: "Happy Customers", value: "500+" },
                        { label: "Uptime", value: "99.9%" },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col items-center">
                            <span
                                className="text-xl md:text-2xl font-bold"
                                style={{ color: "rgba(255,255,255,0.97)", textShadow: "0 2px 10px rgba(0,20,80,0.4)" }}
                            >
                                {value}
                            </span>
                            <span
                                className="text-[10px] md:text-xs mt-0.5 tracking-wide"
                                style={{ color: "rgba(190,220,255,0.75)" }}
                            >
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* CTA Button */}
                <button
                    onClick={() => navigate("/login")}
                    className="mt-8 flex items-center gap-3 px-8 py-4 rounded-2xl text-base md:text-lg font-semibold transition-all duration-200 active:scale-95 shadow-2xl group"
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

                {/* Subtext below CTA */}
                <p className="mt-3 text-xs md:text-sm" style={{ color: "rgba(180,215,255,0.65)" }}>
                    Digital Payment · Real-time tracking · Easy Order
                </p>
            </div>

            {/* Bottom wave decoration */}
            <div className="relative z-10 w-full flex-shrink-0" style={{ height: "60px" }}>
                <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
                    <path
                        d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
                        fill="rgba(255,255,255,0.06)"
                    />
                    <path
                        d="M0,45 C480,15 960,55 1440,40 L1440,60 L0,60 Z"
                        fill="rgba(255,255,255,0.04)"
                    />
                </svg>
            </div>
        </div>
    );
};

export default LandingPage;