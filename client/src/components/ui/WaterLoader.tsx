// WaterLoader - animated water-drop loading spinner
import { useEffect, useState } from "react";

type WaterLoaderProps = {
    isLoading: boolean;
    message?: string;
};

export default function WaterLoader({ isLoading, message = "Loading..." }: WaterLoaderProps) {
    const [visible, setVisible] = useState(isLoading);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
        } else {
            // Delay unmount so fade-out animation plays first
            const timer = setTimeout(() => setVisible(false), 600);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 20, 60, 0.82)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                opacity: isLoading ? 1 : 0,
                transition: "opacity 0.6s ease",
                pointerEvents: isLoading ? "all" : "none",
            }}
        >
            {/* Ripple rings */}
            <div style={{ position: "relative", width: 100, height: 100 }}>
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            border: "2px solid rgba(100, 180, 255, 0.4)",
                            animation: `ripple 2s ease-out infinite`,
                            animationDelay: `${i * 0.6}s`,
                        }}
                    />
                ))}

                {/* Water orb */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgba(0,80,180,0.9), rgba(0,140,255,0.7))",
                        border: "2px solid rgba(100,200,255,0.5)",
                        boxShadow: "0 0 30px rgba(0,140,255,0.4), inset 0 0 20px rgba(0,60,140,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }}
                >
                    {/* Wave 1 */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: "-50%",
                            width: "200%",
                            height: "60%",
                            background: "rgba(0, 160, 255, 0.5)",
                            borderRadius: "40%",
                            animation: "wave 2s linear infinite",
                        }}
                    />
                    {/* Wave 2 */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: "-50%",
                            width: "200%",
                            height: "55%",
                            background: "rgba(0, 120, 220, 0.4)",
                            borderRadius: "45%",
                            animation: "wave 2.5s linear infinite reverse",
                        }}
                    />

                    {/* Water drop SVG */}
                    <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                            position: "relative",
                            zIndex: 1,
                            filter: "drop-shadow(0 2px 6px rgba(0,80,200,0.6))"
                        }}
                    >
                        <path
                            d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0C19 9.5 12 2 12 2Z"
                            fill="rgba(255,255,255,0.92)"
                        />
                        <path
                            d="M9 15.5C9.5 17 10.8 18 12 18"
                            stroke="rgba(0,100,200,0.6)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>

            {/* Floating bubbles */}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            bottom: "-20px",
                            left: `${10 + i * 11}%`,
                            width: `${6 + (i % 3) * 4}px`,
                            height: `${6 + (i % 3) * 4}px`,
                            borderRadius: "50%",
                            background: "rgba(100, 200, 255, 0.25)",
                            border: "1px solid rgba(150, 220, 255, 0.4)",
                            animation: `floatUp ${3 + (i % 3)}s ease-in infinite`,
                            animationDelay: `${i * 0.4}s`,
                        }}
                    />
                ))}
            </div>

            {/* Message */}
            <p
                style={{
                    marginTop: 24,
                    color: "rgba(180, 220, 255, 0.9)",
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textShadow: "0 2px 8px rgba(0,30,80,0.8)",
                    animation: "pulse 2s ease-in-out infinite",
                }}
            >
                {message}
            </p>

            {/* Bouncing dots */}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "rgba(100, 180, 255, 0.8)",
                            animation: "bounce 1.2s ease-in-out infinite",
                            animationDelay: `${i * 0.2}s`,
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes ripple {
                    0%   { transform: scale(1);   opacity: 0.6; }
                    100% { transform: scale(2.2); opacity: 0; }
                }
                @keyframes wave {
                    0%   { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes floatUp {
                    0%   { transform: translateY(0) scale(1);        opacity: 0.7; }
                    80%  { opacity: 0.4; }
                    100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0.5; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-6px); }
                }
            `}</style>
        </div>
    );
}