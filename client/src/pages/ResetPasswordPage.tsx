// ResetPasswordPage - lets users set a new password via a reset token from email
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import axios from "axios"
import { FiLock, FiX } from "react-icons/fi"
import logo from "../assets/aqualastech-logo-noBG.png"
import InputField from "../components/ui/InputField"
import WaterLoader from "../components/ui/WaterLoader"

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token") ?? ""

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPw, setShowPw] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPassword || !confirmPassword) { setError("Both fields are required"); return }
        if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return }
        if (newPassword !== confirmPassword) { setError("Passwords do not match"); return }
        if (!token) { setError("Invalid reset link"); return }

        setError(""); setLoading(true)
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
                token,
                new_password: newPassword,
            })
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
            <WaterLoader isLoading={loading} message="Resetting password..." />

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
                        <h2 className="text-lg font-extrabold text-gray-900">Reset Password</h2>
                        <p className="text-xs text-gray-500 text-center mt-1">Enter your new password below.</p>
                    </div>

                    {!token ? (
                        <div className="text-center space-y-4">
                            <div className="bg-red-50 rounded-xl p-4">
                                <p className="text-sm text-red-700 font-medium">Invalid reset link</p>
                                <p className="text-xs text-red-500 mt-1">Please request a new password reset.</p>
                            </div>
                            <button onClick={() => navigate("/forgot-password")}
                                className="w-full py-2.5 rounded-xl font-bold text-white text-sm shadow-lg hover:brightness-110 transition-all"
                                style={{ background: "linear-gradient(90deg,#5060f0,#3b5de7)" }}>
                                Request Reset Link
                            </button>
                        </div>
                    ) : success ? (
                        <div className="text-center space-y-4">
                            <div className="bg-green-50 rounded-xl p-4">
                                <p className="text-sm text-green-700 font-medium">Password reset successfully!</p>
                                <p className="text-xs text-green-600 mt-1">You can now log in with your new password.</p>
                            </div>
                            <button onClick={() => navigate("/login")}
                                className="w-full py-2.5 rounded-xl font-bold text-white text-sm shadow-lg hover:brightness-110 transition-all"
                                style={{ background: "linear-gradient(90deg,#5060f0,#3b5de7)" }}>
                                Go to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <InputField icon={<FiLock size={16} />} placeholder="New Password" type="password"
                                showToggle show={showPw} onToggle={() => setShowPw(!showPw)}
                                value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} required />

                            <InputField icon={<FiLock size={16} />} placeholder="Confirm New Password" type="password"
                                showToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
                                value={confirmPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} required />

                            <div className="h-4 text-red-500 text-xs flex justify-center items-center">{error}</div>

                            <button type="submit" disabled={loading}
                                className="w-full py-2.5 rounded-xl font-bold text-white text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ background: "linear-gradient(90deg,#5060f0,#3b5de7)" }}>
                                Reset Password
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
