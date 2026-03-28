// AdminLayout - sidebar and header shell for all admin pages
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Home,
    Package,
    ShoppingBag,
    CircleDollarSign,
    Settings,
    LogOut,
    ChevronRight,
    Menu,
    X,
    Bell,
    CheckCheck,
    Trash2,
} from 'lucide-react'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import logo from "../assets/aqualastech-logo-noBG.png"
import { useStation } from '../hooks/useStation'

// ── Admin Notification Types ──
interface AdminNotif {
    notification_id: number
    message: string
    notification_type: string
    is_read: boolean | number
    created_at: string
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

// Which page to navigate to when clicking a notification
function notifLink(type: string) {
    if (type === 'low_stock') return '/admin/inventory'
    return '/admin/orders'
}

function AdminNotifPanel({ notifications, unreadCount, onClose, onMarkAllRead, onMarkOne, onDelete, onMouseMove, panelRef, onNavigate }: {
    notifications: AdminNotif[]
    unreadCount: number
    onClose: () => void
    onMarkAllRead: () => void
    onMarkOne: (id: number) => void
    onDelete: (e: React.MouseEvent, id: number) => void
    onMouseMove: () => void
    panelRef?: React.RefObject<HTMLDivElement | null>
    onNavigate: (type: string) => void
}) {
    return createPortal(
        <>
            <div className="fixed inset-0 z-[199] bg-black/30" onClick={onClose} />
            <div
                ref={panelRef}
                className="fixed top-[56px] inset-x-4 sm:inset-x-auto sm:right-4 sm:w-80 bg-white rounded-2xl border border-gray-200 shadow-2xl z-[200] overflow-hidden animate-slide-down"
                onMouseMove={onMouseMove}
                onScroll={onMouseMove}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Bell size={14} className="text-[#0d2a4a]" />
                        <span className="text-sm font-black text-gray-800">Notifications</span>
                        {unreadCount > 0 && (
                            <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={onMarkAllRead}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#38bdf8] hover:text-[#0ea5e9] transition-colors">
                            <CheckCheck size={12} /> Mark all read
                        </button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                            <Bell size={24} className="opacity-30" />
                            <p className="text-xs">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.notification_id}
                                onClick={() => { onMarkOne(n.notification_id); onNavigate(n.notification_type); onClose() }}
                                className={`relative flex items-start gap-3 px-4 pt-3 pb-7 border-b border-gray-50 cursor-pointer transition-colors
                                    ${n.is_read ? 'hover:bg-gray-50' : 'bg-blue-50/60 hover:bg-blue-50'}`}>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs leading-relaxed ${n.is_read ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                                        {n.message}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                                </div>
                                <button
                                    onClick={e => onDelete(e, n.notification_id)}
                                    className="absolute bottom-2 right-3 p-1 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                                    <Trash2 size={11} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>,
        document.body
    )
}

const API = import.meta.env.VITE_API_URL

// Base nav items (visible to all admins)
const baseNavItems = [
    { label: 'Home', to: '/admin/dashboard', icon: Home },
    { label: 'Inventory', to: '/admin/inventory', icon: Package },
    { label: 'Orders', to: '/admin/orders', icon: ShoppingBag },
    { label: 'Point of Sale', to: '/admin/pos', icon: CircleDollarSign },
]

const settingsNavItem = { label: 'Settings', to: '/admin/settings', icon: Settings }

function useWindowSize() {
    const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
    useEffect(() => {
        const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight })
        window.addEventListener('resize', handler)
        window.addEventListener('orientationchange', handler)
        return () => {
            window.removeEventListener('resize', handler)
            window.removeEventListener('orientationchange', handler)
        }
    }, [])
    return size
}

export default function AdminLayout() {
    const { user, setUser } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const { w, h } = useWindowSize()

    const isMobile = w < 768
    const isTablet = w >= 768 && w < 1024
    const isDesktop = w >= 1024
    const isPhoneLandscape = isMobile && w > h

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    // Notifications
    const [notifOpen, setNotifOpen] = useState(false)
    const [notifications, setNotifications] = useState<AdminNotif[]>([])
    const notifPanelRef = useRef<HTMLDivElement>(null)
    const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const resetNotifTimer = useCallback(() => {
        if (notifTimerRef.current) clearTimeout(notifTimerRef.current)
        notifTimerRef.current = setTimeout(() => setNotifOpen(false), 10000)
    }, [])

    const unreadCount = notifications.filter(n => !n.is_read).length

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/orders/notifications`, { withCredentials: true })
            setNotifications(res.data)
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        fetchNotifications()
        const t = setInterval(fetchNotifications, 30000)
        return () => clearInterval(t)
    }, [fetchNotifications])

    useEffect(() => {
        if (notifOpen) resetNotifTimer()
        else if (notifTimerRef.current) clearTimeout(notifTimerRef.current)
        return () => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current) }
    }, [notifOpen, resetNotifTimer])

    const markAllRead = async () => {
        try {
            await axios.put(`${API}/orders/notifications/read-all`, {}, { withCredentials: true })
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        } catch { /* ignore */ }
    }

    const markOneRead = async (id: number) => {
        try {
            await axios.put(`${API}/orders/notifications/${id}/read`, {}, { withCredentials: true })
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n))
        } catch { /* ignore */ }
    }

    const deleteNotif = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        try {
            await axios.delete(`${API}/orders/notifications/${id}`, { withCredentials: true })
            setNotifications(prev => prev.filter(n => n.notification_id !== id))
        } catch { /* ignore */ }
    }

    useEffect(() => { setDrawerOpen(false) }, [location.pathname])

    const sidebarIconOnly = isTablet || (isDesktop && collapsed)
    const { station, loading: stationLoading } = useStation(user?.station_id)

    // Build nav items based on role
    const isSuperAdmin = user?.role === 'super_admin'
    const navItems = [...baseNavItems, settingsNavItem]

    const handleLogout = async () => {
        setLoggingOut(true)
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/logout`,
                {},
                { withCredentials: true }
            )
        } catch { /* proceed regardless */ } finally {
            setUser(null)
            navigate('/login')
        }
    }

    const initials = user?.full_name
        ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'AD'
    const avatarSrc = user?.profile_picture
        ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${API}${user.profile_picture}`)
        : null


    // LOGOUT MODAL
    const LogoutModal = () => (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={() => !loggingOut && setShowLogoutModal(false)}
            />
            <div className="relative z-10 w-full max-w-sm bg-white border border-gray-100 rounded-xl shadow-2xl p-6 flex flex-col gap-4 animate-scale-in">
                <button
                    onClick={() => setShowLogoutModal(false)}
                    disabled={loggingOut}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
                >
                    <X size={16} />
                </button>
                <div>
                    <h2 className="text-gray-800 font-bold text-xl">Log out?</h2>
                    <p className="text-gray-500 text-sm mt-1 leading-snug">
                        Are you sure you want to log out of your session?
                    </p>
                </div>
                <div className="flex gap-3 w-full">
                    <button
                        onClick={() => setShowLogoutModal(false)}
                        disabled={loggingOut}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                    >
                        No, Cancel
                    </button>
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex-1 py-2.5 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] active:scale-95 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loggingOut ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Logging out…
                            </>
                        ) : 'Yes, Log out'}
                    </button>
                </div>
            </div>
        </div>
    )

    // Nav links
    const NavLinks = ({ iconOnly = false, onClick }: { iconOnly?: boolean; onClick?: () => void }) => (
        <>
            {navItems.map(({ label, to, icon: Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === '/admin/dashboard'}
                    onClick={onClick}
                    title={iconOnly ? label : undefined}
                    className={({ isActive }) =>
                        `navItems flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150
                         ${iconOnly ? 'justify-center py-3 px-0 w-full' : 'px-3 py-2.5'}
                         ${isActive
                            ? 'bg-[#1a4a7a] text-white shadow-inner'
                            : 'text-blue-200 hover:bg-white/10 hover:text-white'
                        }`
                    }
                >
                    <Icon size={18} className="shrink-0" />
                    {!iconOnly && <span>{label}</span>}
                </NavLink>
            ))}
        </>
    )

    // Topbar
    const Topbar = () => (
        <header className="top-bar min-h-[52px] bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-3 min-w-0">
                {isMobile && (
                    <button
                        onClick={() => setDrawerOpen(o => !o)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                        aria-label="Toggle menu"
                    >
                        <Menu size={20} className="text-gray-600" />
                    </button>
                )}
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 leading-tight">Admin Panel</p>
                    <div className="hidden sm:block">
                        {stationLoading ? (
                            <div className="h-2.5 w-40 bg-gray-100 rounded animate-pulse mt-0.5" />
                        ) : station ? (
                            <p className="text-[10px] text-blue-500 font-medium leading-tight truncate">
                                {station.station_name}
                                <span className="text-gray-400 font-normal"> · {station.address}</span>
                            </p>
                        ) : (
                            <p className="text-[10px] text-gray-400 leading-tight">
                                Water Refilling Station Management
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => { setNotifOpen(o => !o); fetchNotifications() }}
                        className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-all"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {notifOpen && (
                        <AdminNotifPanel
                            notifications={notifications}
                            unreadCount={unreadCount}
                            onClose={() => setNotifOpen(false)}
                            onMarkAllRead={markAllRead}
                            onMarkOne={markOneRead}
                            onDelete={deleteNotif}
                            onMouseMove={resetNotifTimer}
                            panelRef={notifPanelRef}
                            onNavigate={type => navigate(notifLink(type))}
                        />
                    )}
                </div>
                <button
                    onClick={() => navigate('/admin/settings')}
                    title="Go to Settings"
                    className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#38bdf8] to-[#0369a1] flex items-center justify-center text-xs font-bold text-white select-none hover:opacity-80 active:scale-95 transition-all shrink-0"
                >
                    {avatarSrc
                        ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                        : initials}
                </button>
            </div>
        </header>
    )

    
    // MOBILE LAYOUT
    
    if (isMobile) {
        return (
            <div className="mobile-layout flex flex-col h-[100dvh] bg-[#f0f4f8] overflow-hidden">
                <Topbar />

                {drawerOpen && (
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDrawerOpen(false)} />
                )}

                <aside className={`
                    fixed left-0 top-0 h-full w-60 bg-[#0d2a4a] text-white z-50
                    flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
                    ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <img src={station?.image_path ? (station.image_path.startsWith('http') ? station.image_path : `${API}${station.image_path}`) : logo} alt="AquLasTech" className="w-8 h-8 rounded-full object-cover shrink-0 drop-shadow-lg overflow-hidden"
                            />
                            <span className="font-bold text-[14px] tracking-wide">
                                AquaLas<span className="text-[#38bdf8]">Tech</span>
                            </span>
                        </div>
                        <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                            <X size={16} className="text-blue-200" />
                        </button>
                    </div>

                    {/* Station badge */}
                    {user?.station_id && (
                        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-white/5 text-xs text-blue-200">
                            {stationLoading ? (
                                <div className="flex flex-col gap-1.5">
                                    <div className="h-3 w-28 bg-white/10 rounded animate-pulse" />
                                    <div className="h-2.5 w-36 bg-white/5 rounded animate-pulse" />
                                </div>
                            ) : station ? (
                                <>
                                    <p className="font-semibold text-white truncate">{station.station_name}</p>
                                    <p className="text-[10px] text-blue-300 truncate mt-0.5">{station.address}</p>
                                </>
                            ) : (
                                <span>Station #{user.station_id}</span>
                            )}
                        </div>
                    )}

                    {/* Role badge — shows super_admin label */}
                    {isSuperAdmin && (
                        <div className="mx-3 mt-2 px-3 py-1 rounded-lg bg-[#38bdf8]/10 text-[10px] text-[#38bdf8] font-semibold tracking-wide text-center">
                            SUPER ADMIN
                        </div>
                    )}

                    <nav className="flex flex-col gap-1 px-2 mt-3 flex-1 overflow-y-auto">
                        <NavLinks onClick={() => setDrawerOpen(false)} />
                    </nav>

                    <div className="logout px-2 pb-6 pt-3 flex flex-col gap-2 border-t border-white/10">
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-all w-full"
                        >
                            <LogOut size={18} className="shrink-0" />
                            <span>Logout</span>
                        </button>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[#38bdf8] to-[#0369a1] flex items-center justify-center text-[10px] font-bold shrink-0">
                                {avatarSrc
                                    ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                                    : initials}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-semibold text-white truncate">{user?.full_name ?? 'Admin'}</p>
                                <p className="text-[10px] text-blue-300 truncate capitalize">
                                    {user?.role === 'super_admin' ? 'Super Admin' : user?.role ?? 'admin'}
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className={"main-content flex-1 overflow-y-auto p-3 " + (drawerOpen ? "[&_.leaflet-pane]:!z-0 [&_.leaflet-top]:!z-0 [&_.leaflet-bottom]:!z-0" : "")}>
                    <Outlet />
                </main>

                {/* Bottom tab bar — Settings hidden on mobile if not super_admin */}
                <nav className={`
                    bottom-bar bg-[#0d2a4a] border-t border-white/10
                    flex items-center justify-around shrink-0
                    ${isPhoneLandscape ? 'py-1' : 'py-2 pb-[env(safe-area-inset-bottom,8px)]'}
                `}>
                    {navItems.map(({ label, to, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/admin/dashboard'}
                            className={({ isActive }) =>
                                `nav-items flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all min-w-[44px]
                                 ${isActive ? 'text-[#38bdf8]' : 'text-blue-300 hover:text-white'}`
                            }
                        >
                            <Icon size={isPhoneLandscape ? 16 : 20} />
                            {!isPhoneLandscape && (
                                <span className="text-[9px] font-medium leading-tight text-center">{label}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {showLogoutModal && <LogoutModal />}
            </div>
        )
    }

    
    // TABLET + DESKTOP LAYOUT
    
    return (
        <div className="flex h-[100dvh] bg-[#f0f4f8] overflow-hidden">
            <aside className={`
                flex flex-col justify-between bg-[#0d2a4a] text-white shrink-0
                transition-all duration-300 ease-in-out overflow-hidden
                ${sidebarIconOnly ? 'w-[64px]' : 'w-[220px]'}
            `}>
                <div>
                    <div className={`flex items-center gap-3 px-3 py-4 ${sidebarIconOnly ? 'justify-center' : ''}`}>
                        <img src={station?.image_path ? (station.image_path.startsWith('http') ? station.image_path : `${API}${station.image_path}`) : logo} alt="AquLasTech" className="w-8 h-8 object-contain shrink-0 drop-shadow-lg" />
                        {!sidebarIconOnly && (
                            <span className="font-bold text-[14px] tracking-wide whitespace-nowrap">
                                AquaLas<span className="text-[#38bdf8]">Tech</span>
                            </span>
                        )}
                    </div>

                    {/* Station badge */}
                    {!sidebarIconOnly && user?.station_id && (
                        <div className="mx-2 mb-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-blue-200">
                            {stationLoading ? (
                                <div className="flex flex-col gap-1.5">
                                    <div className="h-3 w-28 bg-white/10 rounded animate-pulse" />
                                    <div className="h-2.5 w-36 bg-white/5 rounded animate-pulse" />
                                </div>
                            ) : station ? (
                                <>
                                    <p className="font-semibold text-white truncate">{station.station_name}</p>
                                    <p className="text-[10px] text-blue-300 truncate mt-0.5">{station.address}</p>
                                </>
                            ) : (
                                <span>Station #{user.station_id}</span>
                            )}
                        </div>
                    )}

                    {/* Super admin badge */}
                    {!sidebarIconOnly && isSuperAdmin && (
                        <div className="mx-2 mb-3 px-3 py-1 rounded-lg bg-[#38bdf8]/10 text-[10px] text-[#38bdf8] font-semibold tracking-wide text-center">
                            SUPER ADMIN
                        </div>
                    )}

                    <nav className={`flex flex-col gap-1 px-2 mt-1 ${sidebarIconOnly ? 'items-center' : ''}`}>
                        <NavLinks iconOnly={sidebarIconOnly} />
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            title={sidebarIconOnly ? 'Logout' : undefined}
                            className={`flex items-center gap-3 rounded-xl text-sm font-medium w-full text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-150
                                ${sidebarIconOnly ? 'justify-center py-3 px-0' : 'px-3 py-2.5'}`}
                        >
                            <LogOut size={18} className="shrink-0" />
                            {!sidebarIconOnly && <span>Logout</span>}
                        </button>
                    </nav>
                </div>

                {isDesktop && (
                    <div className="px-2 pb-4">
                        <button
                            onClick={() => setCollapsed(c => !c)}
                            className="flex items-center justify-center w-full py-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-white/10 transition-all text-xs gap-1"
                        >
                            <ChevronRight size={13} className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
                            {!collapsed && <span>Collapse</span>}
                        </button>
                    </div>
                )}
            </aside>

            <div className="main-content flex flex-col flex-1 overflow-hidden min-w-0">
                <Topbar />
                <main className="content flex-1 overflow-y-auto p-4 md:p-5 lg:p-6">
                    <Outlet />
                </main>
            </div>

            {showLogoutModal && <LogoutModal />}
        </div>
    )
}