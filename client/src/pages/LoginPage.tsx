import { useState } from "react";
// import logo from "../../src/assets/aqualastech-logo-noBG.png";
import logo from "../assets/aqualastech-logo-noBG.png"
import { FiMail, FiLock, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import InputField from "../components/ui/InputField";
import WaterLoader from "../components/ui/WaterLoader";



const WaterDropLogo = () => (
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-50 to-blue-200 p-1 flex items-center justify-center shadow-sm">
        <img src={logo} alt="logo" className="w-full h-full object-contain" />
    </div>
);

export default function LoginPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useAuth(); // 👈 get setUser from context

    const handle = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.email || !form.password) {
            setError("All fields are required");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const res = await axios.post(
                "http://localhost:8080/auth/login",
                form,
                { withCredentials: true } // 👈 sends/receives cookie
            );

            if (res.data.Status === "Success") {
                setUser(res.data.user); // 👈 store user in context
                setForm({ email: "", password: "" });

                // Redirect based on role
                const role = res.data.user.role;
                navigate(role === "admin" ? "/admin/dashboard" : "/customer/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="login h-screen flex flex-col overflow-hidden"
            style={{ background: "linear-gradient(135deg, #a8c8f0 0%, #4a7fd4 40%, #2355b0 100%)" }}
        >
            <WaterLoader isLoading={loading} message="Signing in..." /> {/* 👈 add this */}

            <header className="login-navbar relative bg-white shadow-sm px-4 sm:px-8 py-2.5 flex items-center gap-2.5 flex-shrink-0">
                <WaterDropLogo />
                <span className="font-bold text-gray-800 text-base sm:text-lg tracking-tight">AquaLasTech</span>
                <button className="absolute right-5 text-gray-400 hover:text-red-400 transition" onClick={() => navigate("/")}>
                    <FiX size={18} />
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-3 overflow-auto">
                <div className="text-center mb-3 sm:mb-4 px-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight"
                        style={{ textShadow: "0 2px 14px rgba(0,20,80,0.25)" }}>
                        Welcome to AquaLasTech
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm md:text-base text-blue-100 italic font-medium">
                        Smart Water Ordering &amp; Inventory Management System
                    </p>
                </div>

                <div className="w-full max-w-[340px] sm:max-w-sm md:max-w-md bg-white rounded-2xl shadow-2xl px-5 sm:px-7 md:px-8 py-5 sm:py-7">
                    <div className="flex flex-col items-center mb-4 sm:mb-5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-50 via-cyan-100 to-blue-300 flex items-center justify-center shadow-md mb-2">
                            <img src={logo} alt="logo" className="w-full h-full object-contain p-2" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">Login</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
                        <InputField icon={<FiMail size={16} />} placeholder="Email" type="email"
                            value={form.email} onChange={handle("email")} required />
                        <InputField icon={<FiLock size={16} />} placeholder="Password" type="password"
                            showToggle show={showPw} onToggle={() => setShowPw(!showPw)}
                            value={form.password} onChange={handle("password")} required />

                        <div className="flex justify-end mt-1">
                            <span onClick={() => navigate("/forgot-password")}
                                className="text-xs sm:text-sm text-blue-500 hover:underline font-medium cursor-pointer">
                                Forgot Password?
                            </span>
                        </div>

                        <div className="h-5 text-red-500 text-xs justify-center align-middle flex">{error}</div>

                        <button type="submit" disabled={loading}
                            className="w-full mt-3 sm:mt-4 py-3 rounded-xl font-bold text-white text-sm sm:text-[15px] shadow-lg active:scale-95 hover:brightness-110 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(90deg,#5060f0,#3b5de7)" }}>
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p className="text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                        Don't have an account?{" "}
                        <span onClick={() => navigate("/signup")} className="text-blue-500 font-semibold hover:underline cursor-pointer">
                            Sign up
                        </span>
                    </p>
                </div>
            </main>

            <footer className="text-center py-2 text-xs text-blue-100 flex-shrink-0">
                © 2026 RAMNify Dev. All rights reserved.
            </footer>
        </div>
    );
}