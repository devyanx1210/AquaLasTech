import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import {
    MapPin, Phone, Save, User, Mail, Lock,
    Eye, EyeOff, CheckCircle2, AlertCircle,
    Loader2, Navigation,
} from 'lucide-react'

type ToastType = 'success' | 'error'
interface ToastData { message: string; type: ToastType }

// ── Reverse geocode via OpenStreetMap Nominatim (same as AdminSettings) ────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        const a = data.address ?? {}
        const parts = [
            a.village || a.suburb || a.neighbourhood || a.hamlet,
            a.city || a.town || a.municipality,
            a.state || a.province || a.county,
            a.country,
        ].filter(Boolean)
        return parts.join(', ') || data.display_name || ''
    } catch {
        return ''
    }
}

// ── Toast (same as AdminSettings) ─────────────────────────────────────────
const Toast = ({ toast, onDone }: { toast: ToastData; onDone: () => void }) => {
    useEffect(() => {
        const t = setTimeout(onDone, 3500)
        return () => clearTimeout(t)
    }, [onDone])
    return (
        <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium
            ${toast.type === 'success'
                ? 'bg-white border-emerald-200 text-emerald-700 shadow-emerald-100'
                : 'bg-white border-red-200 text-red-600 shadow-red-100'}`}>
            {toast.type === 'success'
                ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                : <AlertCircle size={16} className="text-red-500 shrink-0" />}
            {toast.message}
        </div>
    )
}

// ── Section (same as AdminSettings) ───────────────────────────────────────
const Section = ({ title, subtitle, icon, children }: {
    title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode
}) => (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0d2a4a] flex items-center justify-center text-[#38bdf8] shrink-0">
                {icon}
            </div>
            <div>
                <h2 className="text-sm font-bold text-gray-800">{title}</h2>
                <p className="text-[10px] text-gray-400">{subtitle}</p>
            </div>
        </div>
        <div className="p-5">{children}</div>
    </div>
)

const inputCls = `w-full bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800
    placeholder:text-gray-300 outline-none px-4 py-2.5
    focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/15
    hover:border-gray-300 transition-all duration-200`

// ══════════════════════════════════════════════════════════════════════════
export default function CustomerSettings() {
    const { user, setUser } = useAuth()
    const API = import.meta.env.VITE_API_URL

    // ── Profile state ─────────────────────────────────────────────────────
    const [fullName, setFullName] = useState(user?.full_name ?? '')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState(user?.address ?? '')
    const [latitude, setLatitude] = useState<number | null>(
        user?.latitude != null ? parseFloat(String(user.latitude)) : null
    )
    const [longitude, setLongitude] = useState<number | null>(
        user?.longitude != null ? parseFloat(String(user.longitude)) : null
    )
    const [geocoding, setGeocoding] = useState(false)
    const [gettingLocation, setGettingLocation] = useState(false)
    const [savingProfile, setSavingProfile] = useState(false)

    // ── Password state ────────────────────────────────────────────────────
    const [currentPw, setCurrentPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [showCpw, setShowCpw] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)

    // ── Map refs (identical pattern to AdminSettings) ─────────────────────
    const mapInstanceRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const [mapReady, setMapReady] = useState(false)

    const [toast, setToast] = useState<ToastData | null>(null)
    const showToast = useCallback((message: string, type: ToastType) =>
        setToast({ message, type }), [])

    // ── Load fresh user on mount ──────────────────────────────────────────
    useEffect(() => {
        axios.get(`${API}/auth/me`, { withCredentials: true })
            .then(res => {
                const u = res.data.user
                setUser(u)
                setFullName(u.full_name ?? '')
                setPhone(u.phone_number ?? '')
                setAddress(u.address ?? '')
                setLatitude(u.latitude != null ? parseFloat(String(u.latitude)) : null)
                setLongitude(u.longitude != null ? parseFloat(String(u.longitude)) : null)
            })
            .catch(() => { })
    }, [])

    // ── Cleanup map on unmount ────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                try { mapInstanceRef.current.remove() } catch { }
                mapInstanceRef.current = null
            }
        }
    }, [])

    // ── Reverse geocode + update address (same as AdminSettings) ─────────
    const updateAddressFromCoords = useCallback(async (lat: number, lng: number) => {
        setGeocoding(true)
        setLatitude(lat)
        setLongitude(lng)
        const resolved = await reverseGeocode(lat, lng)
        if (resolved) setAddress(resolved)
        setGeocoding(false)
    }, [])

    // ── Init Leaflet via script tag (exact copy of AdminSettings initMap) ─
    const initMap = useCallback((node: HTMLDivElement | null) => {
        if (!node || mapInstanceRef.current) return

        // Destroy any stale Leaflet instance left on the DOM node
        if ((node as any)._leaflet_id) {
            try { (window as any).L?.map(node).remove() } catch { }
            delete (node as any)._leaflet_id
        }

        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => {
            const L = (window as any).L
            const defaultLat = latitude ?? 13.4417
            const defaultLng = longitude ?? 121.8769

            const map = L.map(node, { zoomControl: true }).setView([defaultLat, defaultLng], 14)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map)

            const icon = L.divIcon({
                className: '',
                html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#0d2a4a,#1a4a7a);transform:rotate(-45deg);border:3px solid #38bdf8;box-shadow:0 4px 12px rgba(13,42,74,0.35)"></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28],
            })

            const marker = L.marker([defaultLat, defaultLng], { icon, draggable: true }).addTo(map)

            marker.on('dragend', () => {
                const { lat, lng } = marker.getLatLng()
                updateAddressFromCoords(lat, lng)
            })

            map.on('click', (e: any) => {
                const { lat, lng } = e.latlng
                marker.setLatLng([lat, lng])
                updateAddressFromCoords(lat, lng)
            })

            mapInstanceRef.current = map
            markerRef.current = marker
            setMapReady(true)

            // Pan to saved coords if they exist
            if (latitude && longitude) {
                marker.setLatLng([latitude, longitude])
                map.setView([latitude, longitude], 15)
            }
        }
        document.head.appendChild(script)
    }, [])

    // ── GPS (same as AdminSettings handleGetLocation) ─────────────────────
    const handleGetLocation = () => {
        if (!navigator.geolocation) return showToast('Geolocation not supported', 'error')
        setGettingLocation(true)
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const { latitude: lat, longitude: lng } = coords
                if (mapReady && markerRef.current) {
                    markerRef.current.setLatLng([lat, lng])
                    mapInstanceRef.current?.setView([lat, lng], 16)
                }
                await updateAddressFromCoords(lat, lng)
                setGettingLocation(false)
                showToast('Location detected and address updated!', 'success')
            },
            () => {
                setGettingLocation(false)
                showToast('Could not get location. Allow GPS access.', 'error')
            }
        )
    }

    // ── Save profile ──────────────────────────────────────────────────────
    const handleSaveProfile = async () => {
        if (!fullName.trim()) { showToast('Name is required', 'error'); return }
        setSavingProfile(true)
        try {
            const res = await axios.put(`${API}/customer/profile`, {
                full_name: fullName.trim(),
                phone_number: phone.trim() || null,
                address: address.trim() || null,
                latitude,
                longitude,
            }, { withCredentials: true })
            setUser(res.data.user)
            showToast('Profile updated successfully!', 'success')
        } catch (err: any) {
            showToast(err.response?.data?.message ?? 'Failed to save', 'error')
        } finally {
            setSavingProfile(false)
        }
    }

    // ── Change password ───────────────────────────────────────────────────
    const handleSavePassword = async () => {
        if (!currentPw || !newPw || !confirmPw) { showToast('Fill in all password fields', 'error'); return }
        if (newPw.length < 6) { showToast('New password must be at least 6 characters', 'error'); return }
        if (newPw !== confirmPw) { showToast('Passwords do not match', 'error'); return }
        setSavingPassword(true)
        try {
            await axios.put(`${API}/customer/password`, {
                current_password: currentPw,
                new_password: newPw,
            }, { withCredentials: true })
            showToast('Password changed successfully!', 'success')
            setCurrentPw(''); setNewPw(''); setConfirmPw('')
        } catch (err: any) {
            showToast(err.response?.data?.message ?? 'Failed to change password', 'error')
        } finally {
            setSavingPassword(false)
        }
    }

    const initials = user?.full_name
        ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'CU'

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-5 pb-10">

            <div>
                <h1 className="text-xl font-bold text-gray-800">Settings</h1>
                <p className="text-xs text-gray-400 mt-0.5">Manage your account and delivery location</p>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#0369a1] flex items-center justify-center text-xl font-black text-white select-none">
                    {initials}
                </div>
                <div>
                    <p className="font-bold text-gray-800">{user?.full_name ?? 'Customer'}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                    <span className="text-[10px] font-semibold text-[#38bdf8] uppercase tracking-wider">Customer</span>
                </div>
            </div>

            {/* ── Profile & Delivery Info ── */}
            <Section
                title="Profile & Delivery Info"
                subtitle="Your name, phone, and delivery address"
                icon={<User size={16} />}
            >
                <div className="flex flex-col gap-4">

                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                        <div className="relative">
                            <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={fullName} onChange={e => setFullName(e.target.value)}
                                className={`${inputCls} pl-9`} placeholder="Your full name" />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                        <div className="relative">
                            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={user?.email ?? ''} readOnly
                                className={`${inputCls} pl-9 opacity-60 cursor-not-allowed`} />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</label>
                        <div className="relative">
                            <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={phone} onChange={e => setPhone(e.target.value)}
                                className={`${inputCls} pl-9`} placeholder="09XXXXXXXXX" />
                        </div>
                    </div>

                    {/* Address — auto-filled from map */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            Delivery Address
                            {geocoding && (
                                <span className="flex items-center gap-1 text-[10px] text-[#38bdf8] font-normal normal-case">
                                    <Loader2 size={10} className="animate-spin" /> Getting address from map…
                                </span>
                            )}
                        </label>
                        <div className="relative">
                            <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                disabled={geocoding}
                                className={`${inputCls} pl-9 ${geocoding ? 'opacity-60' : ''}`}
                                placeholder="Pin a location on the map below"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400">
                            Auto-filled when you pin a location on the map. You can also edit it manually.
                        </p>
                    </div>

                    {/* Map — exact same structure as AdminSettings */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Pin Your Location
                            </label>
                            <button
                                onClick={handleGetLocation}
                                disabled={gettingLocation || geocoding}
                                className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0d2a4a] hover:text-[#38bdf8] bg-gray-100 hover:bg-[#0d2a4a]/8 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                            >
                                {gettingLocation
                                    ? <><Loader2 size={12} className="animate-spin" /> Detecting…</>
                                    : <><Navigation size={12} /> Use My Location</>}
                            </button>
                        </div>

                        <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <div ref={initMap} style={{ height: '260px', width: '100%', background: '#f0f4f8' }} />
                            {!mapReady && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <Loader2 size={20} className="animate-spin" />
                                        <span className="text-xs">Loading map…</span>
                                    </div>
                                </div>
                            )}
                            {geocoding && mapReady && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow text-xs text-gray-600 border border-gray-200">
                                    <Loader2 size={11} className="animate-spin text-[#38bdf8]" />
                                    Fetching address…
                                </div>
                            )}
                        </div>

                        {/* Lat/Lng display */}
                        <div className="flex gap-3">
                            <div className="flex-1 flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Latitude</label>
                                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 font-mono">
                                    {latitude != null ? Number(latitude).toFixed(6) : '—'}
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Longitude</label>
                                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 font-mono">
                                    {longitude != null ? Number(longitude).toFixed(6) : '—'}
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400">
                            Click the map or drag the pin — address auto-updates from the pinned location.
                        </p>
                    </div>

                    <button onClick={handleSaveProfile} disabled={savingProfile || geocoding}
                        className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] active:scale-[0.98] text-white font-bold text-sm transition-all disabled:opacity-60 shadow-sm">
                        {savingProfile
                            ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                            : <><Save size={15} /> Save Profile</>}
                    </button>
                </div>
            </Section>

            {/* ── Change Password ── */}
            <Section
                title="Change Password"
                subtitle="Update your account password"
                icon={<Lock size={16} />}
            >
                <div className="flex flex-col gap-4">

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Password</label>
                        <div className="relative">
                            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type={showPw ? 'text' : 'password'}
                                value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                                className={`${inputCls} pl-9 pr-10`} placeholder="••••••••" />
                            <button onClick={() => setShowPw(s => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Password</label>
                        <div className="relative">
                            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type={showCpw ? 'text' : 'password'}
                                value={newPw} onChange={e => setNewPw(e.target.value)}
                                className={`${inputCls} pl-9 pr-10`} placeholder="Min. 6 characters" />
                            <button onClick={() => setShowCpw(s => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showCpw ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                        <div className="relative">
                            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="password"
                                value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                                className={`${inputCls} pl-9`} placeholder="Re-enter new password" />
                        </div>
                    </div>

                    <button onClick={handleSavePassword} disabled={savingPassword}
                        className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-[#0d2a4a] hover:bg-[#0d2a4a] text-[#0d2a4a] hover:text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60">
                        {savingPassword
                            ? <><Loader2 size={15} className="animate-spin" /> Changing…</>
                            : <><Lock size={15} /> Change Password</>}
                    </button>
                </div>
            </Section>

            {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
        </div>
    )
}