// ForgotPasswordPage - lets users request a password reset link via email
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { FiMail, FiX, FiArrowLeft } from "react-icons/fi"
import logo from "../assets/aqualastech-logo-noBG.png"
import InputField from "../components/ui/InputField"
import WaterLoader from "../components/ui/WaterLoader"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) { setError("Email is required"); return }
        setError(""); setLoading(true)
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email })
            setSuccess(true)
        } catch (err: any) {
            setError(err.response?.data?.message || "Server error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden"
            style={{ background: "linear-gradient(135deg, #a8c8f0 0%, #4a7fd4 40%, #2355b0 100%)" }}>
            <WaterLoader isLoading={loading} message="Sending reset link..." />

            {/* Navbar */}
            <header className="bg-white shadow-sm px-4 sm:px-8 py-2 flex items-center gap-2.5 flex-shrink-0 relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-50 to-blue-200 p-1 flex items-center justify-center shadow-sm">
                    <img src={logo} alt="logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-gray-800 text-base tracking-tight">AquaLasTech</span>
                <button className="absolute right-5 text-gray-400 hover:text-red-400 transition" onClick={() => navigate("/")}>
                    <FiX size={18} />
                </button>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-4">
                <div className="w-full max-w-[320px] sm:max-w-sm bg-white rounded-2xl shadow-2xl px-5 sm:px-7 py-6">
                    <div className="flex flex-col items-center mb-4">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-50 via-cyan-100 to-blue-300 flex items-center justify-center shadow-md mb-1.5">
                            <img src={logo} alt="logo" className="w-full h-full object-contain p-2" />
                        </div>
                        <h2 className="text-lg font-extrabold text-gray-900">Forgot Password</h2>
                        <p className="text-xs text-gray-500 text-center mt-1">
                            Enter your email and we'll send you a reset link.
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="bg-green-50 rounded-xl p-4">
                                <p className="text-sm text-green-700 font-medium">Reset link sent!</p>
                                <p className="text-xs text-green-600 mt-1">
                                    Check your email inbox. The link expires in 15 minutes.
                                </p>
                            </div>
                            <button onClick={() => navigate("/login")}
                                className="w-full py-2.5 rounded-xl font-bold text-white text-sm shadow-lg hover:brightness-110 transition-all"
                                style={{ background: "linear-gradient(90deg,#5060f0,#3b5de7)" }}>
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <InputField icon={<FiMail size={16} />} placeholder="Email" type="email"
                                value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />

                            <div className="h-4 text-red-500 text-xs flex justify-center items-center">{error}</div>

                            <button type="submit" disabled={loading}
                                className="w-full py-2.5 rounded-xl font-bold text-white text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ background: "linear-gradient(90deg,#5060f0,#3b5de7)" }}>
                                Send Reset Link
                            </button>

                            <button type="button" onClick={() => navigate("/login")}
                                className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition mt-1">
                                <FiArrowLeft size={13} /> Back to Login
                            </button>
                        </form>
                    )}
                </div>
            </main>

            <footer className="text-center py-1.5 text-xs text-blue-100 flex-shrink-0">
                © 2026 RAMNify Dev. All rights reserved.
            </footer>
        </div>
    )
}
