// LoginPage - authenticates existing users and redirects by role
import { useState } from "react";
import logo from "../assets/aqualastech-logo-noBG.png"
import { FiMail, FiLock, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import InputField from "../components/ui/InputField";
import WaterLoader from "../components/ui/WaterLoader";

const WaterDropLogo = () => (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-50 to-blue-200 p-1 flex items-center justify-center shadow-sm">
        <img src={logo} alt="logo" className="w-full h-full object-contain" />
    </div>
);

export default function LoginPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const handle = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password) { setError("All fields are required"); return; }
        setError(""); setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, form, { withCredentials: true });
            if (res.data.Status === "Success") {
                setUser(res.data.user);
                setForm({ email: "", password: "" });
                const role = res.data.user.role;
                navigate(role === "sys_admin" ? "/sysadmin" : (role === "admin" || role === "super_admin") ? "/admin/dashboard" : "/customer/dashboard");
            }
        } catch (err: unknown) {
            setError(axios.isAxiosError(err) ? err.response?.data?.message || "Server error" : "Server error");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden"
            style={{ background: "linear-gradient(135deg, #a8c8f0 0%, #4a7fd4 40%, #2355b0 100%)" }}>
            <WaterLoader isLoading={loading} message="Signing in..." />

            {/* Navbar */}
            <header className="bg-white shadow-sm px-4 sm:px-8 py-2 flex items-center gap-2.5 flex-shrink-0 relative">
                <WaterDropLogo />
                <span className="font-bold text-gray-800 text-base tracking-tight">AquaLasTech</span>
                <button className="absolute right-5 text-gray-400 hover:text-red-400 transition" onClick={() => navigate("/")}>
                    <FiX size={18} />
                </button>
            </header>

            {/* Main — portrait: stacked center, [@media(max-height:500px)_and_(orientation:landscape)]: side by side */}
            <main className="flex-1 min-h-0 flex flex-col items-center px-4 py-4 overflow-y-auto justify-center
                             [@media(max-height:500px)_and_(orientation:landscape)]:flex-row [@media(max-height:500px)_and_(orientation:landscape)]:items-center [@media(max-height:500px)_and_(orientation:landscape)]:gap-8 [@media(max-height:500px)_and_(orientation:landscape)]:px-10 [@media(max-height:500px)_and_(orientation:landscape)]:py-3">

                {/* Heading */}
                <div className="text-center [@media(max-height:500px)_and_(orientation:landscape)]:text-left [@media(max-height:500px)_and_(orientation:landscape)]:flex-1 mb-3 [@media(max-height:500px)_and_(orientation:landscape)]:mb-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white drop-shadow">
                        Welcome to AquaLasTech
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-blue-100 italic font-medium">
                        Smart Water Ordering &amp; Inventory Management System
                    </p>
                </div>

                {/* Card */}
                <div className="w-full max-w-[320px] sm:max-w-sm [@media(max-height:500px)_and_(orientation:landscape)]:flex-1 [@media(max-height:500px)_and_(orientation:landscape)]:max-w-sm bg-white rounded-2xl shadow-2xl px-5 sm:px-7 py-4 sm:py-5 max-h-[85vh] overflow-y-auto">
                    <div className="flex flex-col items-center mb-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-50 via-cyan-100 to-blue-300 flex items-center justify-center shadow-md mb-1.5">
                            <img src={logo} alt="logo" className="w-full h-full object-contain p-2" />
                        </div>
                        <h2 className="text-lg font-extrabold text-gray-900">Login</h2>
                        <p className="text-xs text-gray-500">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2">
                        <InputField icon={<FiMail size={16} />} placeholder="Email" type="email"
                            value={form.email} onChange={handle("email")} required />
                        <InputField icon={<FiLock size={16} />} placeholder="Password" type="password"
                            showToggle show={showPw} onToggle={() => setShowPw(!showPw)}
                            value={form.password} onChange={handle("password")} required />

                        <div className="flex justify-end">
                            <span onClick={() => navigate("/forgot-password")}
                                className="text-xs text-blue-500 hover:underline font-medium cursor-pointer">
                                Forgot Password?
                            </span>
                        </div>

                        <div className="h-4 text-red-500 text-xs flex justify-center items-center">{error}</div>

                        <button type="submit" disabled={loading}
                            className="w-full py-2.5 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(90deg,#5060f0,#3b5de7)" }}>
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-500 mt-3">
                        Don't have an account?{" "}
                        <span onClick={() => navigate("/signup")} className="text-blue-500 font-semibold hover:underline cursor-pointer">
                            Sign up
                        </span>
                    </p>
                </div>
            </main>

            <footer className="text-center py-1.5 text-xs text-blue-100 flex-shrink-0">
                © 2026 RAMNify Dev. All rights reserved.
            </footer>
        </div>
    );
}