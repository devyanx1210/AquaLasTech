// SystemAdminLayout - responsive shell for the system admin area
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, ScrollText, LogOut, Droplets, Menu, X, CreditCard } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'
import logo from '../assets/aqualastech-logo-noBG.png'

const API = import.meta.env.VITE_API_URL

const navItems = [
    { label: 'Stations', to: '/sysadmin/stations', icon: Building2 },
    { label: 'Payments', to: '/sysadmin/payments', icon: CreditCard },
    { label: 'Logs', to: '/sysadmin/logs', icon: ScrollText },
]

export default function SystemAdminLayout() {
    const { user, setUser } = useAuth()
    const navigate = useNavigate()
    const [loggingOut, setLoggingOut] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)

    const handleLogout = async () => {
        setLoggingOut(true)
        try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }) } catch { }
        localStorage.removeItem('authToken')
        setUser(null)
        navigate('/login')
    }

    const NavLinks = ({ onNav }: { onNav?: () => void }) => (
        <>
            {navItems.map(({ label, to, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={onNav}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all
                        ${isActive ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : 'text-white/60 hover:text-white hover:bg-white/10'}`
                    }>
                    <Icon size={15} /> {label}
                </NavLink>
            ))}
        </>
    )

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">

            {/* ── Desktop sidebar (md+) ── */}
            <aside className="hidden md:flex w-56 shrink-0 bg-[#0d2a4a] flex-col">
                <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
                    <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/20 flex items-center justify-center shrink-0">
                        <img src={logo} alt="logo" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-white font-black text-sm leading-tight truncate">AquaLasTech</p>
                        <p className="text-[#38bdf8] text-[10px] font-semibold truncate">System Admin</p>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                    <NavLinks />
                </nav>
                <div className="px-3 py-4 border-t border-white/10">
                    <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-[#38bdf8]/20 flex items-center justify-center shrink-0">
                            <Droplets size={13} className="text-[#38bdf8]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-[11px] font-bold truncate">{user?.full_name}</p>
                            <p className="text-white/40 text-[10px] truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} disabled={loggingOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50">
                        <LogOut size={14} /> {loggingOut ? 'Logging out…' : 'Logout'}
                    </button>
                </div>
            </aside>

            {/* ── Mobile top bar (< md) ── */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#0d2a4a] flex items-center justify-between px-4 py-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#38bdf8]/20 flex items-center justify-center">
                        <img src={logo} alt="logo" className="w-4 h-4 object-contain" />
                    </div>
                    <div>
                        <p className="text-white font-black text-xs leading-tight">AquaLasTech</p>
                        <p className="text-[#38bdf8] text-[9px] font-semibold">System Admin</p>
                    </div>
                </div>
                <button onClick={() => setDrawerOpen(true)} className="text-white/70 hover:text-white p-1">
                    <Menu size={20} />
                </button>
            </div>

            {/* ── Mobile drawer overlay ── */}
            {drawerOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
                    <div className="relative w-64 bg-[#0d2a4a] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <img src={logo} alt="logo" className="w-6 h-6 object-contain" />
                                <p className="text-white font-black text-sm">AquaLasTech</p>
                            </div>
                            <button onClick={() => setDrawerOpen(false)} className="text-white/50 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                            <NavLinks onNav={() => setDrawerOpen(false)} />
                        </nav>
                        <div className="px-3 py-4 border-t border-white/10">
                            <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
                                <div className="w-7 h-7 rounded-full bg-[#38bdf8]/20 flex items-center justify-center shrink-0">
                                    <Droplets size={13} className="text-[#38bdf8]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white text-[11px] font-bold truncate">{user?.full_name}</p>
                                    <p className="text-white/40 text-[10px] truncate">{user?.email}</p>
                                </div>
                            </div>
                            <button onClick={handleLogout} disabled={loggingOut}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50">
                                <LogOut size={14} /> {loggingOut ? 'Logging out…' : 'Logout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-6">
                <Outlet />
            </main>
        </div>
    )
}
