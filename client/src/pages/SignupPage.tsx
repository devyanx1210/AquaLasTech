import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiX } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
// import logo from "../../public/assets/aqualastech-logo-noBG.png";
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

    // 👇 only this changed
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name || !form.email || !form.password || !form.confirm) return;

        if (form.password !== form.confirm) {
            setError("Confirm password unmatched");
            return;
        }

        setError("");
        setLoading(true);

        try {
            // Step 1: Create account — server hardcodes role as "customer"
            await axios.post("http://localhost:8080/auth/signup", {
                name: form.name,
                email: form.email,
                password: form.password  // confirm is NOT sent
            });

            // Step 2: Auto-login to get httpOnly cookie + role
            const loginRes = await axios.post(
                "http://localhost:8080/auth/login",
                { email: form.email, password: form.password },
                { withCredentials: true }
            );

            if (loginRes.data.Status === "Success") {
                setUser(loginRes.data.user);
                setForm({ name: "", email: "", password: "", confirm: "" });

                // Step 3: Redirect by role — always "customer" from signup
                const role = loginRes.data.user.role;
                navigate(role === "admin" ? "/admin/dashboard" : "/customer/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div
            className="main-signup-container h-screen flex flex-col overflow-hidden"
            style={{
                background: "linear-gradient(135deg, #a8c8f0 0%, #4a7fd4 40%, #2355b0 100%)"
            }}
        >
            <WaterLoader isLoading={loading} message="Creating your account..." />

            {/* Navbar */}
            <header className="nav-bar-signup bg-white shadow-sm px-4 sm:px-8 py-2.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-100 to-blue-200 p-1.5 flex items-center justify-center flex-shrink-0">
                        <img src={logo} alt="logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-gray-800 text-base sm:text-lg tracking-tight">
                        AquaLasTech
                    </span>
                </div>

                <button
                    onClick={() => navigate("/")}
                    className="close-btn-signup w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all active:scale-95"
                    title="Close"
                >
                    <FiX size={20} />
                </button>
            </header>

            {/* Main Content */}
            <main className="main-signup flex-1 flex flex-col items-center justify-center px-4 py-3 overflow-auto">
                <div className="text-center mb-3 sm:mb-4">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white drop-shadow">
                        Welcome to AquaLasTech
                    </h1>
                    <p className="mt-0.5 text-xs sm:text-sm text-blue-100 italic font-medium">
                        Smart Water Ordering &amp; Inventory Management System
                    </p>
                </div>

                {/* Signup Card */}
                <div className="card-signup w-full max-w-xs sm:max-w-sm md:max-w-md bg-white rounded-2xl shadow-2xl px-5 sm:px-8 py-4 sm:py-6">

                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-3 sm:mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-50 to-blue-200 p-2 shadow-md mb-1.5 flex items-center justify-center">
                            <img src={logo} alt="logo" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">
                            Sign Up
                        </h2>
                        <p className="text-xs text-gray-500">
                            Create your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="signup-form space-y-2 sm:space-y-2.5">
                        <InputField
                            icon={<FiUser size={16} />}
                            placeholder="Full Name"
                            value={form.name}
                            onChange={handle("name")}
                            required
                        />
                        <InputField
                            icon={<FiMail size={16} />}
                            placeholder="Email"
                            type="email"
                            value={form.email}
                            onChange={handle("email")}
                            required
                        />
                        <InputField
                            icon={<FiLock size={16} />}
                            placeholder="Password"
                            showToggle
                            show={showPw}
                            onToggle={() => setShowPw(!showPw)}
                            value={form.password}
                            onChange={handle("password")}
                            required
                        />
                        <InputField
                            icon={<FiLock size={16} />}
                            placeholder="Confirm Password"
                            showToggle
                            show={showCpw}
                            onToggle={() => setShowCpw(!showCpw)}
                            value={form.confirm}
                            onChange={handle("confirm")}
                            required
                        />

                        <div className="signup-error-message h-5 text-red-500 text-xs">{error}</div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="signup-btn w-full mt-3 sm:mt-4 py-2.5 rounded-xl font-bold text-white text-sm sm:text-base shadow-lg transition-all active:scale-95 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(90deg, #4f6ef7, #3b5de7)" }}
                        >
                            {loading ? "Creating account..." : "Sign Up"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">OR</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Google Button */}
                    <button className="google-btn w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all active:scale-95 text-sm font-medium text-gray-700 shadow-sm">
                        <FcGoogle size={18} />
                        Continue with Google
                    </button>

                    {/* Login Link */}
                    <p className="login-link text-center text-xs sm:text-sm text-gray-500 mt-3">
                        Already have an account?{" "}
                        <span
                            className="text-blue-500 font-semibold hover:underline cursor-pointer"
                            onClick={() => navigate("/login")}
                        >
                            Log In
                        </span>
                    </p>
                </div>
            </main>

            <footer className="footer-signup text-center py-2 text-xs text-blue-100 flex-shrink-0">
                © 2026 RAMNify Dev. All rights reserved.
            </footer>
        </div>
    );
}