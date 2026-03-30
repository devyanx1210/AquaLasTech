// SAStations - all stations with super admin + create/delete
import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react'
import axios from 'axios'
import {
    Building2, Plus, Loader2, X, CheckCircle2, AlertCircle,
    MapPin, Phone, User, Mail, Lock, Navigation, Trash2, Search, Wrench,
} from 'lucide-react'

const LocationMap = lazy(() => import('../../components/LocationMap'))

const API = import.meta.env.VITE_API_URL

interface Station {
    station_id: number
    station_name: string
    address: string
    contact_number: string
    latitude: number | null
    longitude: number | null
    status: string
    created_at: string
    admin_name: string | null
    admin_email: string | null
}

interface ToastData { message: string; type: 'success' | 'error' }

const Toast = ({ toast, onDone }: { toast: ToastData; onDone: () => void }) => {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
            ${toast.type === 'success' ? 'bg-white text-emerald-700' : 'bg-white border border-red-200 text-red-600'}`}>
            {toast.type === 'success'
                ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                : <AlertCircle size={16} className="text-red-500 shrink-0" />}
            {toast.message}
        </div>
    )
}

const Field = ({
    icon, label, placeholder, value, onChange, type = 'text', required = false, hint
}: {
    icon: React.ReactNode; label: string; placeholder: string
    value: string; onChange: (v: string) => void
    type?: string; required?: boolean; hint?: string
}) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#38bdf8] transition-colors">
            <span className="px-3 text-gray-300">{icon}</span>
            <input type={type} placeholder={placeholder} value={value}
                onChange={e => onChange(e.target.value)}
                className="flex-1 py-2.5 pr-3 text-xs text-gray-800 bg-transparent focus:outline-none" />
        </div>
        {hint && <p className="text-[10px] text-gray-400 mt-1 pl-1">{hint}</p>}
    </div>
)

const emptyForm = {
    station_name: '', contact_number: '',
    latitude: '', longitude: '', address: '',
    admin_name: '', admin_email: '', admin_password: '',
    admin_address: '', admin_complete_address: '',
}

// Reverse geocode via OpenStreetMap Nominatim (free, no API key)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        return data.display_name || ''
    } catch { return '' }
}

interface NominatimResult {
    place_id: number
    display_name: string
    lat: string
    lon: string
}

// Forward geocode — returns up to 5 suggestions for a query string
async function searchAddress(query: string): Promise<NominatimResult[]> {
    if (query.trim().length < 4) return []
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=0`,
            { headers: { 'Accept-Language': 'en' } }
        )
        return await res.json()
    } catch { return [] }
}

export default function SAStations() {
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<ToastData | null>(null)
    const [formError, setFormError] = useState('')
    const [gettingLocation, setGettingLocation] = useState(false)
    const [geocoding, setGeocoding] = useState(false)
    const [form, setForm] = useState(emptyForm)

    const [deleteTarget, setDeleteTarget] = useState<Station | null>(null)
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteError, setDeleteError] = useState('')
    const [deleting, setDeleting] = useState(false)

    const [togglingMaintenance, setTogglingMaintenance] = useState(false)
    const [maintenanceConfirm, setMaintenanceConfirm] = useState<{ enable: boolean } | null>(null)
    const [maintenancePassword, setMaintenancePassword] = useState('')
    const [maintenanceError, setMaintenanceError] = useState('')

    const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
    const [searching, setSearching] = useState(false)
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const set = (field: keyof typeof emptyForm) => (v: string) =>
        setForm(f => ({ ...f, [field]: v }))

    const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type })

    const fetchStations = useCallback(async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API}/sysadmin/stations`, { withCredentials: true })
            setStations(res.data)
        } catch (err) {
            console.error('[SAStations] fetch error:', err)
            showToast('Failed to load stations', 'error')
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchStations() }, [fetchStations])

    // Called when map is clicked or location is obtained — fills lat, lng, and address
    const applyCoords = async (lat: number, lng: number) => {
        setForm(f => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }))
        setGeocoding(true)
        const addr = await reverseGeocode(lat, lng)
        setForm(f => ({ ...f, address: addr }))
        setGeocoding(false)
    }

    const handleGetLocation = () => {
        if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return }
        setGettingLocation(true)
        navigator.geolocation.getCurrentPosition(
            async pos => {
                await applyCoords(pos.coords.latitude, pos.coords.longitude)
                setGettingLocation(false)
            },
            () => { showToast('Could not get location', 'error'); setGettingLocation(false) }
        )
    }

    const handleAddressInput = (value: string) => {
        setForm(f => ({ ...f, address: value }))
        setSuggestions([])
        if (searchTimer.current) clearTimeout(searchTimer.current)
        if (value.trim().length < 4) { setSearching(false); return }
        setSearching(true)
        searchTimer.current = setTimeout(async () => {
            const results = await searchAddress(value)
            setSuggestions(results)
            setSearching(false)
        }, 400)
    }

    const pickSuggestion = (s: NominatimResult) => {
        setSuggestions([])
        setSearching(false)
        applyCoords(parseFloat(s.lat), parseFloat(s.lon))
        setForm(f => ({ ...f, address: s.display_name }))
    }

    const handleCreate = async () => {
        const { station_name, contact_number, latitude, longitude, address,
            admin_name, admin_email, admin_password, admin_address } = form
        if (!station_name.trim() || !contact_number.trim()) {
            setFormError('Station name and contact number are required'); return
        }
        if (!latitude || !longitude) {
            setFormError('Please pin the station location on the map'); return
        }
        if (!address.trim()) {
            setFormError('Address is required — pick a location on the map'); return
        }
        if (!admin_name.trim() || !admin_email.trim() || !admin_password.trim()) {
            setFormError('Super admin name, email, and password are required'); return
        }
        if (!admin_address.trim()) {
            setFormError('Super admin address is required'); return
        }
        setSaving(true); setFormError('')
        try {
            await axios.post(`${API}/sysadmin/stations`, form, { withCredentials: true })
            showToast('Station and super admin created', 'success')
            setShowCreate(false)
            setForm(emptyForm)
            fetchStations()
        } catch (err: any) {
            console.error('[SAStations] create error:', err)
            setFormError(err.response?.data?.message || 'Failed to create station')
        } finally { setSaving(false) }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        if (!deletePassword) { setDeleteError('Password is required'); return }
        setDeleting(true); setDeleteError('')
        try {
            await axios.delete(`${API}/sysadmin/stations/${deleteTarget.station_id}`,
                { data: { password: deletePassword }, withCredentials: true })
            showToast(`"${deleteTarget.station_name}" deleted`, 'success')
            setDeleteTarget(null); setDeletePassword('')
            fetchStations()
        } catch (err: any) {
            console.error('[SAStations] delete error:', err)
            setDeleteError(err.response?.data?.message || 'Failed to delete station')
        } finally { setDeleting(false) }
    }

    const handleToggleMaintenance = async () => {
        if (!maintenanceConfirm) return
        if (!maintenancePassword) { setMaintenanceError('Password is required'); return }
        setTogglingMaintenance(true); setMaintenanceError('')
        try {
            await axios.put(`${API}/sysadmin/maintenance`,
                { maintenance: maintenanceConfirm.enable, password: maintenancePassword },
                { withCredentials: true })
            showToast(maintenanceConfirm.enable ? 'System set to maintenance mode' : 'System is back online', 'success')
            setMaintenanceConfirm(null); setMaintenancePassword('')
            fetchStations()
        } catch (err: any) {
            setMaintenanceError(err.response?.data?.message || 'Failed to update maintenance status')
        } finally { setTogglingMaintenance(false) }
    }

    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric'
    })
    const fmtCoords = (lat: number | null, lng: number | null) =>
        lat != null && lng != null
            ? `${parseFloat(String(lat)).toFixed(4)}, ${parseFloat(String(lng)).toFixed(4)}`
            : null

    const mapLat = form.latitude ? parseFloat(form.latitude) : null
    const mapLng = form.longitude ? parseFloat(form.longitude) : null

    const systemInMaintenance = stations.length > 0 && stations.every(s => Number(s.status) === 3)

    return (
        <div className="flex flex-col gap-5">
            {toast && <Toast toast={toast} onDone={() => setToast(null)} />}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800">Stations</h1>
                    <p className="text-xs text-gray-400 mt-0.5">All registered water refilling stations</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* System-wide maintenance toggle */}
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all
                        ${systemInMaintenance ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                        <Wrench size={13} className={systemInMaintenance ? 'text-amber-500' : 'text-gray-400'} />
                        <span className="text-xs font-semibold text-gray-600 hidden sm:inline">Maintenance</span>
                        <button
                            onClick={() => { setMaintenanceConfirm({ enable: !systemInMaintenance }); setMaintenancePassword(''); setMaintenanceError('') }}
                            disabled={togglingMaintenance || loading}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50
                                ${systemInMaintenance ? 'bg-amber-400' : 'bg-gray-300'}`}
                            title={systemInMaintenance ? 'Turn off maintenance mode' : 'Turn on maintenance mode'}
                        >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200
                                ${systemInMaintenance ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                            {togglingMaintenance && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 size={10} className="animate-spin text-white" />
                                </span>
                            )}
                        </button>
                    </div>
                    <button onClick={() => { setShowCreate(true); setFormError('') }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0d2a4a] text-white text-xs font-bold hover:bg-[#1a3f6f] transition-all shadow-sm">
                        <Plus size={14} /> New Station
                    </button>
                </div>
            </div>

            {/* Maintenance banner */}
            {systemInMaintenance && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                    <Wrench size={14} className="text-amber-500 shrink-0" />
                    System-wide maintenance is active — all customers are seeing the maintenance page.
                </div>
            )}

            {/* Station Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                    <Loader2 size={18} className="animate-spin" /> Loading stations…
                </div>
            ) : stations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-2">
                    <Building2 size={32} />
                    <p className="text-sm font-medium">No stations yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {stations.map(s => {
                        const coords = fmtCoords(s.latitude, s.longitude)
                        const statusNum = Number(s.status)
                        const isMaintenance = statusNum === 3
                        const isClosed = statusNum === 2
                        return (
                            <div key={s.station_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-[#0d2a4a]/10 flex items-center justify-center shrink-0">
                                            <Building2 size={16} className="text-[#0d2a4a]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-800 truncate">{s.station_name}</p>
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold
                                                ${isMaintenance ? 'bg-amber-100 text-amber-600'
                                                : isClosed ? 'bg-gray-100 text-gray-400'
                                                : 'bg-emerald-50 text-emerald-600'}`}>
                                                {isMaintenance ? 'maintenance' : isClosed ? 'closed' : 'open'}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => { setDeleteTarget(s); setDeletePassword(''); setDeleteError('') }}
                                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all shrink-0">
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                                    <div className="flex items-start gap-2">
                                        <MapPin size={12} className="text-gray-300 mt-0.5 shrink-0" />
                                        <span className="break-words">{s.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={12} className="text-gray-300 shrink-0" />
                                        <span>{s.contact_number}</span>
                                    </div>
                                    {coords && (
                                        <div className="flex items-center gap-2">
                                            <Navigation size={12} className="text-gray-300 shrink-0" />
                                            <span className="font-mono text-[10px]">{coords}</span>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-300">{fmtDate(s.created_at)}</p>
                                </div>

                                <div className="border-t border-gray-100 pt-3">
                                    {s.admin_name ? (
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-[#38bdf8]/15 flex items-center justify-center shrink-0">
                                                <User size={12} className="text-[#38bdf8]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-700 truncate">{s.admin_name}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{s.admin_email}</p>
                                            </div>
                                            <span className="ml-auto shrink-0 text-[9px] font-bold text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded-full">
                                                SUPER ADMIN
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-300 italic">No super admin assigned</p>
                                    )}
                                </div>

                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Create Modal ── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
                    <div className="relative z-10 w-full sm:max-w-lg mx-0 sm:mx-4 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

                        <div className="bg-[#0d2a4a] px-5 py-4 flex items-center justify-between shrink-0 rounded-t-2xl">
                            <div>
                                <p className="text-white font-bold text-sm">New Station</p>
                                <p className="text-white/50 text-[10px]">Creates the station and its super admin account</p>
                            </div>
                            <button onClick={() => setShowCreate(false)} className="text-white/50 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="px-5 py-4 flex flex-col gap-5 overflow-y-auto">

                            {/* ── Station Info ── */}
                            <div className="flex flex-col gap-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Station Information</p>
                                <Field icon={<Building2 size={13} />} label="Station Name" placeholder="e.g. AquaLas Station 1"
                                    value={form.station_name} onChange={set('station_name')} required />
                                <Field icon={<Phone size={13} />} label="Contact Number" placeholder="e.g. 09xx-xxx-xxxx"
                                    value={form.contact_number} onChange={set('contact_number')} required />
                            </div>

                            {/* ── Station Location ── */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Station Location <span className="text-red-400 normal-case font-bold">*</span>
                                    </p>
                                    <button onClick={handleGetLocation} disabled={gettingLocation || geocoding}
                                        className="flex items-center gap-1.5 text-[10px] font-bold text-[#38bdf8] hover:text-[#0ea5e9] transition-colors disabled:opacity-50">
                                        {gettingLocation
                                            ? <><Loader2 size={11} className="animate-spin" /> Getting…</>
                                            : <><Navigation size={11} /> Use My Location</>}
                                    </button>
                                </div>

                                {/* Map — click to pin location */}
                                <Suspense fallback={
                                    <div className="h-52 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 text-xs gap-2">
                                        <Loader2 size={14} className="animate-spin" /> Loading map…
                                    </div>
                                }>
                                    <LocationMap
                                        latitude={mapLat}
                                        longitude={mapLng}
                                        onPick={(lat, lng) => applyCoords(lat, lng)}
                                    />
                                </Suspense>

                                <p className="text-[10px] text-gray-400 text-center -mt-1">
                                    Click the map to pin, or search by address below
                                </p>

                                {/* Address — type to search OR click map to auto-fill */}
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Address <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#38bdf8] transition-colors">
                                        <span className="px-3 text-gray-300">
                                            {geocoding || searching
                                                ? <Loader2 size={13} className="animate-spin" />
                                                : <Search size={13} />}
                                        </span>
                                        <input type="text"
                                            placeholder="Type to search, or click the map"
                                            value={form.address}
                                            onChange={e => handleAddressInput(e.target.value)}
                                            className="flex-1 py-2.5 pr-3 text-xs text-gray-800 bg-transparent focus:outline-none" />
                                        {form.address && (
                                            <button onClick={() => { setForm(f => ({ ...f, address: '' })); setSuggestions([]) }}
                                                className="px-2.5 text-gray-300 hover:text-gray-500">
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                    {/* Suggestions dropdown */}
                                    {suggestions.length > 0 && (
                                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                            {suggestions.map(s => (
                                                <button key={s.place_id}
                                                    onClick={() => pickSuggestion(s)}
                                                    className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-[#38bdf8]/10 flex items-start gap-2 border-b border-gray-50 last:border-0 transition-colors">
                                                    <MapPin size={11} className="text-[#38bdf8] mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2">{s.display_name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {mapLat && mapLng && (
                                        <p className="text-[10px] text-gray-400 mt-1 pl-1 font-mono">
                                            {mapLat.toFixed(6)}, {mapLng.toFixed(6)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ── Super Admin ── */}
                            <div className="flex flex-col gap-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Super Admin Account</p>
                                <Field icon={<User size={13} />} label="Full Name" placeholder="Admin full name"
                                    value={form.admin_name} onChange={set('admin_name')} required />
                                <Field icon={<Mail size={13} />} label="Email" placeholder="admin@email.com"
                                    value={form.admin_email} onChange={set('admin_email')} type="email" required />
                                <Field icon={<Lock size={13} />} label="Password" placeholder="Strong password"
                                    value={form.admin_password} onChange={set('admin_password')} type="password" required />
                                <Field icon={<MapPin size={13} />} label="Address" placeholder="Street, Barangay, Municipality"
                                    value={form.admin_address} onChange={set('admin_address')} required
                                    hint="Main address (from GPS or typed)" />
                                <Field icon={<MapPin size={13} />} label="Complete Address" placeholder="Unit no., landmark, additional details"
                                    value={form.admin_complete_address} onChange={set('admin_complete_address')}
                                    hint="Additional details (optional)" />
                            </div>

                            {formError && <p className="text-xs text-red-500 text-center">{formError}</p>}

                            <button onClick={handleCreate} disabled={saving}
                                className="w-full py-2.5 rounded-xl bg-[#0d2a4a] text-white text-xs font-bold hover:bg-[#1a3f6f] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving
                                    ? <><Loader2 size={13} className="animate-spin" /> Creating…</>
                                    : 'Create Station & Super Admin'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Maintenance Confirm Modal ── */}
            {maintenanceConfirm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMaintenanceConfirm(null)} />
                    <div className="relative z-10 w-full sm:max-w-sm mx-0 sm:mx-4 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
                        <div className={`px-5 py-4 flex items-center justify-between ${maintenanceConfirm.enable ? 'bg-amber-500' : 'bg-[#0d2a4a]'}`}>
                            <div className="flex items-center gap-2">
                                <Wrench size={15} className="text-white" />
                                <p className="text-white font-bold text-sm">
                                    {maintenanceConfirm.enable ? 'Enable Maintenance Mode?' : 'Disable Maintenance Mode?'}
                                </p>
                            </div>
                            <button onClick={() => setMaintenanceConfirm(null)} className="text-white/70 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="px-5 py-4 flex flex-col gap-3">
                            <p className="text-sm text-gray-700">
                                {maintenanceConfirm.enable
                                    ? 'This will put all stations into maintenance mode. All customers will see the maintenance page.'
                                    : 'This will bring all stations back online. Customers will regain access.'}
                            </p>
                            <p className="text-xs text-gray-500">Enter your system admin password to confirm.</p>
                            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-amber-400 transition-colors">
                                <span className="px-3 text-gray-300"><Lock size={13} /></span>
                                <input type="password" placeholder="Your password"
                                    value={maintenancePassword}
                                    onChange={e => setMaintenancePassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleToggleMaintenance()}
                                    className="flex-1 py-2.5 pr-3 text-xs text-gray-800 bg-transparent focus:outline-none" />
                            </div>
                            {maintenanceError && <p className="text-xs text-red-500 text-center">{maintenanceError}</p>}
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setMaintenanceConfirm(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleToggleMaintenance} disabled={togglingMaintenance}
                                    className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5
                                        ${maintenanceConfirm.enable ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#0d2a4a] hover:bg-[#1a3f6f]'}`}>
                                    {togglingMaintenance
                                        ? <><Loader2 size={12} className="animate-spin" /> Applying…</>
                                        : maintenanceConfirm.enable ? 'Enable Maintenance' : 'Bring Back Online'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative z-10 w-full sm:max-w-sm mx-0 sm:mx-4 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-red-500 px-5 py-4 flex items-center justify-between">
                            <p className="text-white font-bold text-sm">Delete Station</p>
                            <button onClick={() => setDeleteTarget(null)} className="text-white/70 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="px-5 py-4 flex flex-col gap-3">
                            <p className="text-sm text-gray-700">
                                You are about to delete <span className="font-bold">"{deleteTarget.station_name}"</span>.
                                This will also remove all its products and inventory.
                            </p>
                            <p className="text-xs text-gray-500">Enter your system admin password to confirm.</p>
                            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-red-400 transition-colors">
                                <span className="px-3 text-gray-300"><Lock size={13} /></span>
                                <input type="password" placeholder="Your password"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleDelete()}
                                    className="flex-1 py-2.5 pr-3 text-xs text-gray-800 bg-transparent focus:outline-none" />
                            </div>
                            {deleteError && <p className="text-xs text-red-500 text-center">{deleteError}</p>}
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setDeleteTarget(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleDelete} disabled={deleting}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                                    {deleting
                                        ? <><Loader2 size={12} className="animate-spin" /> Deleting…</>
                                        : <><Trash2 size={12} /> Delete</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
