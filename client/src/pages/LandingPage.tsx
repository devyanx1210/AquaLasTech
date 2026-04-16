// LandingPage - public marketing page with hero, features, and CTA sections
import React, { useState, useEffect, useRef } from "react";
import "./LandingPage.css";
import logo from "../assets/aqualastech-logo-noBG.png";
import altFont from "../assets/ALT_FONT.png";
import teamLogo from "../assets/team-logo.png";
import water_bg from "../assets/water-bg.jpg";
import {
    FiArrowRight, FiMapPin, FiPackage, FiUsers,
    FiBarChart2, FiShield, FiList, FiShoppingCart,
    FiMail, FiPhone, FiFacebook,
} from "react-icons/fi";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// CONFIG — values from environment variables
const FB_PAGE_URL = import.meta.env.VITE_FB_PAGE_URL as string;
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL as string;
const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE as string;

// Scroll reveal hook
function useVisible(threshold = 0.12) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, visible };
}

// Feature data
const FEATURES = [
    { icon: FiList, title: "Smart Order Management", desc: "Admins get a clear, organized view of all orders: confirmed, preparing, out for delivery, and completed. Customers enjoy real-time status updates on every order they place." },
    { icon: FiPackage, title: "Inventory & Restock Alerts", desc: "Track water supply levels at a glance. Automatic low-stock alerts notify admins before supplies run out, keeping deliveries on time and customers satisfied." },
    { icon: FiShoppingCart, title: "Built-in Point of Sale", desc: "Process walk-in transactions instantly with the built-in POS, supporting cash and GCash payments with automatic inventory deduction and receipt printing." },
    { icon: FiUsers, title: "Customer Management", desc: "Manage customer profiles, saved delivery addresses, and full order history in one place, making repeat orders faster and personalized service easier." },
    { icon: FiBarChart2, title: "Reports & Analytics", desc: "View and generate sales reports covering all orders processed by your station. Get a full picture of your station's activity to help you run things more efficiently." },
    { icon: FiShield, title: "Secure & Reliable", desc: "Role-based access keeps admin and customer data separate and safe. Built on secure authentication and a reliable infrastructure designed for daily station operations." },
];

// Feature card
function FeatureCard({ icon: Icon, title, desc, delay, index }: {
    icon: React.ElementType; title: string; desc: string; delay: number; index: number;
}) {
    const { ref, visible } = useVisible(0.08);
    return (
        <div
            ref={ref}
            className="feature-card"
            style={{
                transitionDelay: `${delay}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0) scale(1)" : "translateY(36px) scale(0.96)",
                transition: "opacity 0.65s ease, transform 0.65s cubic-bezier(.22,1,.36,1)",
                animationDelay: `${index * 0.45}s`,
            }}
        >
            <div className="card-shimmer" />
            <div className="card-glow" />
            <div className="card-icon-wrap"><Icon size={20} /></div>
            <h3 className="card-title">{title}</h3>
            <p className="card-desc">{desc}</p>
        </div>
    );
}

// PAGE
const LandingPage = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [bgLoaded, setBgLoaded] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const featuresRef = useRef<HTMLDivElement>(null);
    const { ref: aboutRef, visible: aboutVisible } = useVisible(0.08);
    const { ref: ctaRef, visible: ctaVisible } = useVisible(0.12);

    // Already logged in — skip landing page, go straight to their dashboard
    if (!loading && user) {
        const dest = user.role === "sys_admin" ? "/sysadmin"
            : user.role === "super_admin" ? "/admin/dashboard"
            : user.role === "admin" ? "/admin/inventory"
            : "/customer/dashboard";
        return <Navigate to={dest} replace />;
    }

    const logoFallback = (
        <h1 className="tracking-tight leading-none text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5.5rem]"
            style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, background: "linear-gradient(90deg, #1de9b6 0%, #29b6f6 50%, #1565c0 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            AquaLasTech
        </h1>
    );

    return (
        <div className="lp-root">
            <img src={water_bg} alt="" className="hidden" onLoad={() => setBgLoaded(true)} />

            {/* HERO */}
            <div className="hero-section">
                <div className="absolute inset-0"
                    style={{ background: "linear-gradient(155deg,#000d2e 0%,#001a5c 40%,#002a7a 70%,#003d99 100%)" }} />
                <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                    style={{ backgroundImage: `url(${water_bg})`, opacity: bgLoaded ? 0.20 : 0 }} />
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse 80% 55% at 65% 45%,rgba(56,189,248,0.18) 0%,transparent 60%)" }} />
                <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ background: "radial-gradient(circle,#60b4ff,transparent)" }} />
                <div className="absolute -bottom-20 -right-16 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
                    style={{ background: "radial-gradient(circle,#a0d4ff,transparent)" }} />
                <div className="hero-bottom-fade" />

                {/* Navbar */}
                <nav className="hero-nav relative z-20 mx-3 mt-3 sm:mx-5 sm:mt-4
                    flex items-center justify-between px-3 sm:px-6 md:px-8
                    h-11 sm:h-14 md:h-16 rounded-2xl border border-white/20 shadow-xl shrink-0"
                    style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
                        <img src={logo} alt="logo" className="h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 object-contain drop-shadow-lg shrink-0" />
                        <span className="font-bold text-white text-xs sm:text-base md:text-lg tracking-tight truncate"
                            style={{ textShadow: "0 1px 8px rgba(0,30,80,0.4)" }}>AquaLas<span style={{ color: "#38bdf8" }}>Tech</span></span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button onClick={() => navigate("/login")}
                            className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/30 whitespace-nowrap
                            text-[11px] sm:text-sm font-semibold bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                            style={{ color: "rgba(220,240,255,0.95)" }}>Log in</button>
                        <button onClick={() => navigate("/signup")}
                            className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-white/30 whitespace-nowrap
                            text-[11px] sm:text-sm font-semibold bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                            style={{ color: "rgba(220,240,255,0.95)" }}>Sign up</button>
                    </div>
                </nav>

                {/* Hero body */}
                <div className="hero-body relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-32"
                    style={{ animation: "heroIn 0.85s cubic-bezier(.22,1,.36,1) forwards" }}>
                    <div className="hero-left flex flex-col items-center">

                        {logoError ? logoFallback : (
                            <img
                                src={altFont}
                                alt="AquaLasTech"
                                className="object-contain drop-shadow-2xl alt-font-img"
                                style={{ width: "min(95vw, 1000px)", maxHeight: "560px", objectFit: "contain", marginTop: "-160px", marginBottom: "-200px", filter: "brightness(1.3) saturate(1.4)" }}
                                onError={() => setLogoError(true)}
                            />
                        )}
                        <p className="mt-2 w-full text-[11px] sm:text-sm md:text-lg leading-relaxed font-light sm:whitespace-nowrap"
                            style={{ color: "rgba(210,235,255,0.82)" }}>
                            Streamlining Water Orders,{" "}
                            <span style={{ color: "rgba(147,210,255,0.95)", fontWeight: 600 }}>
                                Enhancing Service Efficiency
                            </span>
                        </p>
                    </div>
                    <div className="hero-right flex flex-col items-center mt-6">
                        <button onClick={() => navigate("/login")} className="cta-btn-hero group">
                            Order Water Now
                            <FiArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </button>
                        <button
                            onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
                            className="scroll-cue flex flex-col items-center gap-1.5 mt-9"
                            style={{ color: "rgba(180,215,255,0.40)" }}>
                            <span className="text-[10px] font-semibold tracking-widest uppercase">Explore Features</span>
                            <div className="w-5 h-8 rounded-full border-2 border-current flex items-start justify-center pt-1.5">
                                <div className="w-1 h-1.5 rounded-full bg-current animate-bounce" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* FEATURES */}
            <div className="features-section">
                <div
                    ref={aboutRef}
                    className="max-w-4xl mx-auto px-6 pt-16 pb-12 md:pt-20 md:pb-14 text-center"
                    style={{
                        opacity: aboutVisible ? 1 : 0,
                        transform: aboutVisible ? "translateY(0)" : "translateY(24px)",
                        transition: "opacity 0.7s ease, transform 0.7s ease",
                    }}
                >
                    <p className="text-[11px] font-bold tracking-widest uppercase mb-3"
                        style={{ color: "rgba(255,255,255,0.75)" }}>The All-in-One Platform</p>
                    <h2 className="font-black text-white text-3xl md:text-5xl leading-tight mb-5"
                        style={{ textShadow: "0 2px 16px rgba(0,40,90,0.30)" }}>
                        Everything you need for<br />
                        <span style={{ color: "#b8eaff" }}>Efficient Water Station</span> Management
                    </h2>
                    <p className="text-sm md:text-base leading-relaxed max-w-2xl mx-auto"
                        style={{ color: "rgba(10,50,90,0.82)" }}>
                        The all-in-one ordering and inventory management solution designed for water
                        refilling stations in Boac, Marinduque. Automate orders, manage inventory,
                        and enhance your operational efficiency with ease.
                    </p>
                    <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
                        {[
                            { icon: FiMapPin, text: "Supports Geolocation feature" },
                            { icon: FiShield, text: "Locally tailored for Boac, Marinduque" },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-2 text-sm font-medium"
                                style={{ color: "rgba(10,50,90,0.72)" }}>
                                <Icon size={13} style={{ color: "#0971b8" }} />{text}
                            </div>
                        ))}
                    </div>
                </div>

                <div ref={featuresRef} className="max-w-5xl mx-auto px-5 pb-6">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "18px" }}>
                        {FEATURES.map((f, i) => (
                            <FeatureCard key={f.title} {...f} delay={i * 85} index={i} />
                        ))}
                    </div>
                </div>

                {/* Wave → CTA */}
                <div className="wave-divider" style={{ marginTop: "52px" }}>
                    <svg viewBox="0 0 1440 110" preserveAspectRatio="none" style={{ width: "100%", height: "110px" }}>
                        <path d="M0,55 C240,95 480,15 720,60 C960,105 1200,25 1440,60 L1440,110 L0,110 Z"
                            fill="rgba(255,255,255,0.14)">
                            <animateTransform attributeName="transform" type="translate"
                                values="-80 0; 80 0; -80 0" dur="7s" repeatCount="indefinite" />
                        </path>
                        <path d="M0,70 C360,35 720,95 1080,55 C1260,35 1380,65 1440,70 L1440,110 L0,110 Z"
                            fill="rgba(255,255,255,0.22)">
                            <animateTransform attributeName="transform" type="translate"
                                values="60 0; -60 0; 60 0" dur="5.5s" repeatCount="indefinite" />
                        </path>
                    </svg>
                </div>
            </div>

            {/* CTA - section carries background; footer wave is pinned to bottom */}
            <div
                className="cta-section"
                style={{
                    position: "relative",
                    /* bottom padding creates space for the pinned wave
                       so it doesn't cover the button */
                    paddingBottom: "100px",
                }}
            >
                {/* CTA card */}
                <div
                    ref={ctaRef}
                    className="relative overflow-hidden mx-4 md:mx-8 lg:mx-auto lg:max-w-5xl rounded-3xl"
                    style={{
                        opacity: ctaVisible ? 1 : 0,
                        transform: ctaVisible ? "scale(1)" : "scale(0.96)",
                        transition: "opacity 0.7s ease, transform 0.7s ease",
                    }}
                >
                    <div className="relative z-10 text-center px-6 py-14 md:py-20">

                        {/* Heading */}
                        <h2
                            className="font-black leading-[1.05] mb-5"
                            style={{
                                fontSize: "clamp(2.4rem, 7vw, 5.5rem)",
                                background: "linear-gradient(135deg, #0d2a4a 0%, #0e6ba8 40%, #38bdf8 75%, #7dd3fc 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            Start Your Smart<br />Water Business Today
                        </h2>

                        <p className="text-base md:text-xl mb-4 max-w-xl mx-auto font-light"
                            style={{ color: "rgba(10,50,90,0.65)" }}>
                            Join water refilling stations in Boac, Marinduque that are already
                            growing faster with AquaLasTech.
                        </p>

                        <p className="font-bold text-base md:text-lg mb-10"
                            style={{ color: "#0070cc" }}>Free · Powerful · Easy</p>

                        {/* Button */}
                        <a
                            href={FB_PAGE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-3 px-10 md:px-14 py-4 md:py-5
                                rounded-2xl font-black text-base md:text-lg
                                bg-[#0d2a4a] text-white hover:bg-[#1a4a7a] active:scale-95 transition-all no-underline"
                            style={{ boxShadow: "0 14px 40px rgba(0,30,100,0.25)" }}
                        >
                            Get Started
                            <FiArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-200" />
                        </a>

                        <p className="mt-4 text-xs md:text-sm" style={{ color: "rgba(10,50,90,0.40)" }}>
                            Message us on Facebook to register your station
                        </p>
                    </div>
                </div>

                {/* Wave pinned to section bottom - fill matches footer bg (#0d2a4a) */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 5 }}>
                    <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ width: "100%", height: "100px", display: "block" }}>
                        <path d="M0,40 C300,85 700,5 1050,60 C1250,85 1380,35 1440,55 L1440,100 L0,100 Z"
                            fill="#0d2a4a" opacity="0.45" />
                        <path d="M0,58 C360,15 820,90 1120,45 C1300,18 1410,65 1440,60 L1440,100 L0,100 Z"
                            fill="#0d2a4a" opacity="0.65" />
                        <path d="M0,72 C420,35 950,95 1440,65 L1440,100 L0,100 Z"
                            fill="#0d2a4a" />
                    </svg>
                </div>
            </div>

            {/* FOOTER — zero gap, starts flush */}
            <footer className="footer-section" style={{ marginTop: 0 }}>
                <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

                    {/* Brand + contact */}
                    <div className="flex items-start gap-3">
                        <img src={logo} alt="logo" className="h-9 w-9 object-contain opacity-90 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-black text-white text-base leading-tight">AquaLasTech</p>
                            <p className="text-[11px] mt-0.5" style={{ color: "rgba(180,215,255,0.50)" }}>
                                Streamlining Water Orders, Enhancing Service Efficiency
                            </p>
                            <div className="flex flex-col gap-1.5 mt-3">
                                <a href={`tel:${CONTACT_PHONE}`}
                                    className="flex items-center gap-2 text-xs no-underline hover:text-white transition-colors"
                                    style={{ color: "rgba(180,215,255,0.65)" }}>
                                    <FiPhone size={12} style={{ color: "#38bdf8", flexShrink: 0 }} />{CONTACT_PHONE}
                                </a>
                                <a href={`mailto:${CONTACT_EMAIL}`}
                                    className="flex items-center gap-2 text-xs no-underline hover:text-white transition-colors"
                                    style={{ color: "rgba(180,215,255,0.65)" }}>
                                    <FiMail size={12} style={{ color: "#38bdf8", flexShrink: 0 }} />{CONTACT_EMAIL}
                                </a>
                                <a href={FB_PAGE_URL} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs no-underline hover:text-white transition-colors"
                                    style={{ color: "rgba(180,215,255,0.65)" }}>
                                    <FiFacebook size={12} style={{ color: "#38bdf8", flexShrink: 0 }} />Facebook Page
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                            style={{ color: "rgba(180,215,255,0.40)" }}>Quick Links</p>
                        <button onClick={() => navigate("/login")}
                            className="text-left text-sm font-medium hover:text-white transition-colors"
                            style={{ color: "rgba(180,215,255,0.65)" }}>Log In</button>
                        <button onClick={() => navigate("/signup")}
                            className="text-left text-sm font-medium hover:text-white transition-colors"
                            style={{ color: "rgba(180,215,255,0.65)" }}>Sign Up</button>
                        <a href={FB_PAGE_URL} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium hover:text-white transition-colors no-underline"
                            style={{ color: "rgba(180,215,255,0.65)" }}>Get Started</a>
                    </div>

                    {/* Copyright */}
                    <div className="flex flex-col items-start md:items-end gap-2">
                        <p className="text-[10px]" style={{ color: "rgba(180,215,255,0.35)" }}>
                            © {new Date().getFullYear()} AquaLasTech · Boac, Marinduque
                        </p>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10"
                            style={{ background: "rgba(255,255,255,0.05)" }}>
                            <span className="text-[10px] font-medium" style={{ color: "rgba(180,215,255,0.45)" }}>
                                Powered by
                            </span>
                            <div className="flex items-center gap-1.5">
                                <img src={teamLogo} alt="Ramnify"
                                    className="w-5 h-5 rounded-md object-cover shrink-0" />
                                <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.70)" }}>Ramnify</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
