import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useStation } from '../../hooks/useStation'
import axios from 'axios'
import {
    MapPin,
    Phone,
    Building2,
    Save,
    UserPlus,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Navigation,
    Lock,
    Mail,
    User,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
interface StationForm {
    station_name: string
    address: string
    contact_number: string
    latitude: number | null
    longitude: number | null
}

interface AdminForm {
    full_name: string
    email: string
    password: string
    confirm: string
}

type ToastType = 'success' | 'error'
interface ToastData { message: string; type: ToastType }

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ toast, onDone }: { toast: ToastData; onDone: () => void }) => {
    useEffect(() => {
        const t = setTimeout(onDone, 3500)
        return () => clearTimeout(t)
    }, [onDone])

    return (
        <div className={`
            fixed bottom-6 right-6 z-[999] flex items-center gap-3
            px-4 py-3 rounded-xl shadow-xl border text-sm font-medium
            ${toast.type === 'success'
                ? 'bg-white border-emerald-200 text-emerald-700 shadow-emerald-100'
                : 'bg-white border-red-200 text-red-600 shadow-red-100'}
        `}>
            {toast.type === 'success'
                ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                : <AlertCircle size={16} className="text-red-500 shrink-0" />}
            {toast.message}
        </div>
    )
}

// ── Field ──────────────────────────────────────────────────────────────────
const Field = ({
    label, icon, error, className = '', ...props
}: {
    label: string
    icon?: React.ReactNode
    error?: string
    className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {label}
        </label>
        <div className="relative">
            {icon && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {icon}
                </span>
            )}
            <input
                {...props}
                className={`
                    w-full bg-gray-50 border rounded-xl text-sm text-gray-800
                    placeholder:text-gray-300 outline-none
                    focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/15
                    transition-all duration-200
                    ${icon ? 'pl-10 pr-4 py-2.5' : 'px-4 py-2.5'}
                    ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}
                    disabled:opacity-40 disabled:cursor-not-allowed
                `}
            />
        </div>
        {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
)

// ── Section card ───────────────────────────────────────────────────────────
const Section = ({ title, subtitle, icon, children }: {
    title: string
    subtitle: string
    icon: React.ReactNode
    children: React.ReactNode
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

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════
export default function AdminSettings() {
    const { user } = useAuth()
    const { station, loading: stationLoading } = useStation(user?.station_id)

    // ── Station form ─────────────────────────────────────────────────────
    const [stationForm, setStationForm] = useState<StationForm>({
        station_name: '', address: '', contact_number: '',
        latitude: null, longitude: null,
    })
    const [stationErrors, setStationErrors] = useState<Partial<Record<keyof StationForm, string>>>({})
    const [savingStation, setSavingStation] = useState(false)

    // ── Admin form ───────────────────────────────────────────────────────
    const [adminForm, setAdminForm] = useState<AdminForm>({
        full_name: '', email: '', password: '', confirm: '',
    })
    const [adminErrors, setAdminErrors] = useState<Partial<Record<keyof AdminForm, string>>>({})
    const [savingAdmin, setSavingAdmin] = useState(false)
    const [showPw, setShowPw] = useState(false)
    const [showCpw, setShowCpw] = useState(false)

    // ── Map ──────────────────────────────────────────────────────────────
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const [mapReady, setMapReady] = useState(false)
    const [gettingLocation, setGettingLocation] = useState(false)

    // ── Toast ────────────────────────────────────────────────────────────
    const [toast, setToast] = useState<ToastData | null>(null)
    const showToast = useCallback((message: string, type: ToastType) => setToast({ message, type }), [])

    // ── Populate form from station ────────────────────────────────────────
    useEffect(() => {
        if (station) {
            setStationForm({
                station_name: station.station_name ?? '',
                address: station.address ?? '',
                contact_number: station.contact_number ?? '',
                latitude: (station as any).latitude != null ? parseFloat((station as any).latitude) : null,
                longitude: (station as any).longitude != null ? parseFloat((station as any).longitude) : null,
            })
        }
    }, [station])

    // ── Load Leaflet ──────────────────────────────────────────────────────
    useEffect(() => {
        if (mapReady || !mapRef.current) return

        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => {
            const L = (window as any).L
            const defaultLat = stationForm.latitude ?? 13.4417
            const defaultLng = stationForm.longitude ?? 121.8769

            const map = L.map(mapRef.current, { zoomControl: true }).setView([defaultLat, defaultLng], 14)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map)

            const icon = L.divIcon({
                className: '',
                html: `<div style="
                    width:28px;height:28px;border-radius:50% 50% 50% 0;
                    background:linear-gradient(135deg,#0d2a4a,#1a4a7a);
                    transform:rotate(-45deg);
                    border:3px solid #38bdf8;
                    box-shadow:0 4px 12px rgba(13,42,74,0.35)
                "></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28],
            })

            const marker = L.marker([defaultLat, defaultLng], { icon, draggable: true }).addTo(map)

            marker.on('dragend', () => {
                const { lat, lng } = marker.getLatLng()
                setStationForm(f => ({ ...f, latitude: lat, longitude: lng }))
            })

            map.on('click', (e: any) => {
                const { lat, lng } = e.latlng
                marker.setLatLng([lat, lng])
                setStationForm(f => ({ ...f, latitude: lat, longitude: lng }))
            })

            mapInstanceRef.current = map
            markerRef.current = marker
            setMapReady(true)
        }
        document.head.appendChild(script)
    }, [mapRef.current])

    // ── Sync marker on load ───────────────────────────────────────────────
    useEffect(() => {
        if (!mapReady || !markerRef.current || !stationForm.latitude || !stationForm.longitude) return
        markerRef.current.setLatLng([stationForm.latitude, stationForm.longitude])
        mapInstanceRef.current?.setView([stationForm.latitude, stationForm.longitude], 15)
    }, [mapReady])

    // ── GPS ───────────────────────────────────────────────────────────────
    const handleGetLocation = () => {
        if (!navigator.geolocation) return showToast('Geolocation not supported', 'error')
        setGettingLocation(true)
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const { latitude, longitude } = coords
                setStationForm(f => ({ ...f, latitude, longitude }))
                if (mapReady && markerRef.current) {
                    markerRef.current.setLatLng([latitude, longitude])
                    mapInstanceRef.current?.setView([latitude, longitude], 16)
                }
                setGettingLocation(false)
                showToast('Location detected!', 'success')
            },
            () => {
                setGettingLocation(false)
                showToast('Could not get location. Allow GPS access.', 'error')
            }
        )
    }

    // ── Validate + save station ───────────────────────────────────────────
    const validateStation = () => {
        const errs: Partial<Record<keyof StationForm, string>> = {}
        if (!stationForm.station_name.trim()) errs.station_name = 'Station name is required'
        if (!stationForm.address.trim()) errs.address = 'Address is required'
        if (!stationForm.contact_number.trim()) errs.contact_number = 'Contact number is required'
        setStationErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleSaveStation = async () => {
        if (!validateStation()) return
        setSavingStation(true)
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/settings/station/${user?.station_id}`,
                stationForm,
                { withCredentials: true }
            )
            showToast('Station updated successfully!', 'success')
        } catch (err: any) {
            showToast(err.response?.data?.message ?? 'Failed to update station', 'error')
        } finally {
            setSavingStation(false)
        }
    }

    // ── Validate + create admin ───────────────────────────────────────────
    const validateAdmin = () => {
        const errs: Partial<Record<keyof AdminForm, string>> = {}
        if (!adminForm.full_name.trim()) errs.full_name = 'Name is required'
        if (!adminForm.email.trim()) errs.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(adminForm.email)) errs.email = 'Invalid email'
        if (!adminForm.password) errs.password = 'Password is required'
        else if (adminForm.password.length < 6) errs.password = 'At least 6 characters'
        if (adminForm.password !== adminForm.confirm) errs.confirm = 'Passwords do not match'
        setAdminErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleCreateAdmin = async () => {
        if (!validateAdmin()) return
        setSavingAdmin(true)
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/settings/create-admin`,
                {
                    full_name: adminForm.full_name,
                    email: adminForm.email,
                    password: adminForm.password,
                    station_id: user?.station_id,
                },
                { withCredentials: true }
            )
            showToast(`Admin "${adminForm.full_name}" created!`, 'success')
            setAdminForm({ full_name: '', email: '', password: '', confirm: '' })
        } catch (err: any) {
            showToast(err.response?.data?.message ?? 'Failed to create admin', 'error')
        } finally {
            setSavingAdmin(false)
        }
    }

    // ── Skeleton ──────────────────────────────────────────────────────────
    if (stationLoading) {
        return (
            <div className="flex flex-col gap-4 animate-pulse max-w-2xl mx-auto">
                {[180, 220, 340].map((h, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm" style={{ height: h }} />
                ))}
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-5 pb-10">

            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold text-gray-800">Settings</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                    Manage your station details and admin accounts
                </p>
            </div>

            {/* ── SECTION 1: Station Details ─────────────────────────────── */}
            <Section
                title="Station Details"
                subtitle="Update your water refilling station information"
                icon={<Building2 size={16} />}
            >
                <div className="flex flex-col gap-4">
                    <Field
                        label="Station Name"
                        icon={<Building2 size={14} />}
                        placeholder="e.g. Agua Pura Station"
                        value={stationForm.station_name}
                        onChange={e => setStationForm(f => ({ ...f, station_name: e.target.value }))}
                        error={stationErrors.station_name}
                    />
                    <Field
                        label="Address"
                        icon={<MapPin size={14} />}
                        placeholder="e.g. Brgy. Laylay, Boac, Marinduque"
                        value={stationForm.address}
                        onChange={e => setStationForm(f => ({ ...f, address: e.target.value }))}
                        error={stationErrors.address}
                    />
                    <Field
                        label="Contact Number"
                        icon={<Phone size={14} />}
                        placeholder="e.g. 09672534800"
                        value={stationForm.contact_number}
                        onChange={e => setStationForm(f => ({ ...f, contact_number: e.target.value }))}
                        error={stationErrors.contact_number}
                    />

                    {/* ── Map ───────────────────────────────────────────── */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Station Location
                            </label>
                            <button
                                onClick={handleGetLocation}
                                disabled={gettingLocation}
                                className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0d2a4a] hover:text-[#38bdf8] bg-gray-100 hover:bg-[#0d2a4a]/8 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                            >
                                {gettingLocation
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : <Navigation size={12} />}
                                {gettingLocation ? 'Detecting…' : 'Use My Location'}
                            </button>
                        </div>

                        {/* Map container */}
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <div ref={mapRef} style={{ height: '260px', width: '100%', background: '#f0f4f8' }} />
                            {!mapReady && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <Loader2 size={20} className="animate-spin" />
                                        <span className="text-xs">Loading map…</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Lat / Lng */}
                        <div className="flex gap-3">
                            <Field
                                label="Latitude"
                                placeholder="—"
                                value={stationForm.latitude?.toFixed(6) ?? ''}
                                onChange={e => setStationForm(f => ({ ...f, latitude: parseFloat(e.target.value) || null }))}
                                className="flex-1"
                            />
                            <Field
                                label="Longitude"
                                placeholder="—"
                                value={stationForm.longitude?.toFixed(6) ?? ''}
                                onChange={e => setStationForm(f => ({ ...f, longitude: parseFloat(e.target.value) || null }))}
                                className="flex-1"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400">
                            Click on the map or drag the pin to set your station's exact location.
                        </p>
                    </div>

                    {/* Save */}
                    <button
                        onClick={handleSaveStation}
                        disabled={savingStation}
                        className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] active:scale-[0.98] text-white font-bold text-sm transition-all disabled:opacity-60 shadow-sm"
                    >
                        {savingStation
                            ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                            : <><Save size={15} /> Save Station Details</>}
                    </button>
                </div>
            </Section>

            {/* ── SECTION 2: Create Admin ────────────────────────────────── */}
            <Section
                title="Create Admin Account"
                subtitle={`New admin will be assigned to ${station?.station_name ?? 'this station'}`}
                icon={<UserPlus size={16} />}
            >
                <div className="flex flex-col gap-4">

                    {/* Station badge */}
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500">
                        <Building2 size={13} className="text-[#38bdf8] shrink-0" />
                        <span>
                            Will be assigned to{' '}
                            <span className="text-gray-800 font-semibold">
                                {station?.station_name ?? `Station #${user?.station_id}`}
                            </span>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                            label="Full Name"
                            icon={<User size={14} />}
                            placeholder="e.g. Juan dela Cruz"
                            value={adminForm.full_name}
                            onChange={e => setAdminForm(f => ({ ...f, full_name: e.target.value }))}
                            error={adminErrors.full_name}
                            className="sm:col-span-2"
                        />
                        <Field
                            label="Email Address"
                            icon={<Mail size={14} />}
                            type="email"
                            placeholder="admin@example.com"
                            value={adminForm.email}
                            onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))}
                            error={adminErrors.email}
                            className="sm:col-span-2"
                        />

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Lock size={14} />
                                </span>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    value={adminForm.password}
                                    onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))}
                                    className={`
                                        w-full bg-gray-50 border rounded-xl text-sm text-gray-800
                                        placeholder:text-gray-300 outline-none pl-10 pr-10 py-2.5
                                        focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/15
                                        transition-all duration-200
                                        ${adminErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}
                                    `}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            {adminErrors.password && (
                                <p className="text-[10px] text-red-500 font-medium">{adminErrors.password}</p>
                            )}
                        </div>

                        {/* Confirm password */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Lock size={14} />
                                </span>
                                <input
                                    type={showCpw ? 'text' : 'password'}
                                    placeholder="Re-enter password"
                                    value={adminForm.confirm}
                                    onChange={e => setAdminForm(f => ({ ...f, confirm: e.target.value }))}
                                    className={`
                                        w-full bg-gray-50 border rounded-xl text-sm text-gray-800
                                        placeholder:text-gray-300 outline-none pl-10 pr-10 py-2.5
                                        focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/15
                                        transition-all duration-200
                                        ${adminErrors.confirm ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}
                                    `}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCpw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showCpw ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            {adminErrors.confirm && (
                                <p className="text-[10px] text-red-500 font-medium">{adminErrors.confirm}</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleCreateAdmin}
                        disabled={savingAdmin}
                        className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-[#0d2a4a] hover:bg-[#0d2a4a] text-[#0d2a4a] hover:text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                        {savingAdmin
                            ? <><Loader2 size={15} className="animate-spin" /> Creating…</>
                            : <><UserPlus size={15} /> Create Admin</>}
                    </button>
                </div>
            </Section>

            {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
        </div>
    )
}