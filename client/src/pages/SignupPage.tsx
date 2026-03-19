// SignupPage - registers new customers and links them to a water station
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiX } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import logo from "../assets/aqualastech-logo-noBG.png"
import WaterLoader from "../components/ui/WaterLoader";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import InputField from "../components/ui/InputField";

export default function SignupPage() {
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showCpw, setShowCpw] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const handle = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password || !form.confirm) return;
        if (form.password !== form.confirm) { setError("Confirm password unmatched"); return; }
        setError(""); setLoading(true);
        try {
            await axios.post("http://localhost:8080/auth/signup", {
                name: form.name, email: form.email, password: form.password
            });
            const loginRes = await axios.post("http://localhost:8080/auth/login",
                { email: form.email, password: form.password }, { withCredentials: true });
            if (loginRes.data.Status === "Success") {
                setUser(loginRes.data.user);
                setForm({ name: "", email: "", password: "", confirm: "" });
                const role = loginRes.data.user.role;
                navigate(role === "admin" ? "/admin/dashboard" : "/customer/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden"
            style={{ background: "linear-gradient(135deg, #a8c8f0 0%, #4a7fd4 40%, #2355b0 100%)" }}>
            <WaterLoader isLoading={loading} message="Creating your account..." />

            {/* Navbar */}
            <header className="bg-white shadow-sm px-4 sm:px-8 py-2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-100 to-blue-200 p-1.5 flex items-center justify-center">
                        <img src={logo} alt="logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-gray-800 text-base tracking-tight">AquaLasTech</span>
                </div>
                <button onClick={() => navigate("/")}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all active:scale-95">
                    <FiX size={18} />
                </button>
            </header>

            {/* Main — portrait: stacked center, [@media(max-height:500px)_and_(orientation:landscape)]: side by side */}
            <main className="flex-1 min-h-0 flex flex-col items-center px-4 py-4 overflow-y-auto justify-center
                             [@media(max-height:500px)_and_(orientation:landscape)]:flex-row [@media(max-height:500px)_and_(orientation:landscape)]:items-center [@media(max-height:500px)_and_(orientation:landscape)]:gap-8 [@media(max-height:500px)_and_(orientation:landscape)]:px-10 [@media(max-height:500px)_and_(orientation:landscape)]:py-3">

                {/* Heading */}
                <div className="text-center [@media(max-height:500px)_and_(orientation:landscape)]:text-left [@media(max-height:500px)_and_(orientation:landscape)]:flex-1 mb-3 [@media(max-height:500px)_and_(orientation:landscape)]:mb-0">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow">
                        Welcome to AquaLasTech
                    </h1>
                    <p className="mt-0.5 text-xs sm:text-sm text-blue-100 italic font-medium">
                        Smart Water Ordering &amp; Inventory Management System
                    </p>
                </div>

                {/* Card */}
                <div className="w-full max-w-[320px] sm:max-w-sm [@media(max-height:500px)_and_(orientation:landscape)]:flex-1 [@media(max-height:500px)_and_(orientation:landscape)]:max-w-sm bg-white rounded-2xl shadow-2xl px-5 sm:px-7 py-4 max-h-[85vh] overflow-y-auto">

                    <div className="flex flex-col items-center mb-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-50 to-blue-200 p-2 shadow-md mb-1 flex items-center justify-center">
                            <img src={logo} alt="logo" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Sign Up</h2>
                        <p className="text-xs text-gray-500">Create your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2">
                        <InputField icon={<FiUser size={16} />} placeholder="Full Name"
                            value={form.name} onChange={handle("name")} required />
                        <InputField icon={<FiMail size={16} />} placeholder="Email" type="email"
                            value={form.email} onChange={handle("email")} required />
                        <InputField icon={<FiLock size={16} />} placeholder="Password"
                            showToggle show={showPw} onToggle={() => setShowPw(!showPw)}
                            value={form.password} onChange={handle("password")} required />
                        <InputField icon={<FiLock size={16} />} placeholder="Confirm Password"
                            showToggle show={showCpw} onToggle={() => setShowCpw(!showCpw)}
                            value={form.confirm} onChange={handle("confirm")} required />

                        <div className="h-4 text-red-500 text-xs flex justify-center">{error}</div>

                        <button type="submit" disabled={loading}
                            className="w-full py-2.5 rounded-xl font-bold text-white text-sm shadow-lg transition-all active:scale-95 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(90deg, #4f6ef7, #3b5de7)" }}>
                            {loading ? "Creating account..." : "Sign Up"}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-2.5">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">OR</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <button className="w-full flex items-center justify-center gap-2.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all active:scale-95 text-sm font-medium text-gray-700 shadow-sm">
                        <FcGoogle size={18} /> Continue with Google
                    </button>

                    <p className="text-center text-xs text-gray-500 mt-2.5">
                        Already have an account?{" "}
                        <span onClick={() => navigate("/login")} className="text-blue-500 font-semibold hover:underline cursor-pointer">
                            Log In
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