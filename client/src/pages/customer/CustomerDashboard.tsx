import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    MapPin, Droplets, CheckCircle2, AlertCircle,
    Loader2, RefreshCw, ChevronRight, Navigation,
    Store, AlertTriangle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
interface Station {
    station_id: number
    station_name: string
    address: string
    latitude: number | null
    longitude: number | null
    image_path: string | null
    total_stock: number
    distance_km?: number
}

// ── Haversine ──────────────────────────────────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Station Card ───────────────────────────────────────────────────────────
function StationCard({ station, selected, onSelect, API }: {
    station: Station; selected: boolean
    onSelect: (s: Station) => void; API: string
}) {
    const hasStock = Number(station.total_stock) > 0
    const imgSrc = station.image_path
        ? station.image_path.startsWith('http')
            ? station.image_path
            : `${API}${station.image_path}`
        : null

    return (
        <div
            onClick={() => hasStock && onSelect(station)}
            className={`
                rounded-2xl border overflow-hidden shadow-sm transition-all duration-200
                ${hasStock
                    ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'
                    : 'opacity-60 cursor-not-allowed'}
                ${selected
                    ? 'border-[#0d2a4a] ring-2 ring-[#0d2a4a]/20'
                    : 'border-gray-200 bg-white hover:border-[#38bdf8]/60'}
            `}
        >
            {/* Banner */}
            <div className="relative w-full h-32 overflow-hidden bg-gradient-to-br from-[#1a4a7a] to-[#38bdf8]">
                {imgSrc ? (
                    <img src={imgSrc} alt={station.station_name}
                        className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                        <svg className="absolute bottom-0 w-full" viewBox="0 0 400 80" preserveAspectRatio="none">
                            <path d="M0,40 C100,10 300,70 400,40 L400,80 L0,80 Z" fill="rgba(255,255,255,0.12)" />
                            <path d="M0,55 C80,30 320,75 400,50 L400,80 L0,80 Z" fill="rgba(255,255,255,0.08)" />
                        </svg>
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center z-10">
                            <Droplets size={28} className="text-white" />
                        </div>
                    </div>
                )}

                {/* Stock badge */}
                <div className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-lg
                    ${hasStock ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {hasStock ? `${station.total_stock} in stock` : 'Out of stock'}
                </div>

                {/* Distance badge */}
                {station.distance_km !== undefined && (
                    <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/40 text-white backdrop-blur-sm flex items-center gap-1">
                        <Navigation size={9} />
                        {station.distance_km < 1
                            ? `${Math.round(station.distance_km * 1000)}m`
                            : `${station.distance_km.toFixed(1)}km`}
                    </div>
                )}

                {/* Selected indicator — small badge, doesn't block image */}
                {selected && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#38bdf8] flex items-center justify-center shadow-lg">
                        <CheckCircle2 size={13} className="text-white" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className={`px-4 py-3 ${selected ? 'bg-[#0d2a4a]' : 'bg-white'}`}>
                <p className={`text-sm font-bold leading-tight mb-1 ${selected ? 'text-white' : 'text-gray-800'}`}>
                    {station.station_name}
                </p>
                <p className={`text-[11px] flex items-start gap-1 mb-3 leading-tight ${selected ? 'text-blue-200' : 'text-gray-400'}`}>
                    <MapPin size={10} className="shrink-0 mt-0.5" />
                    {station.address}
                </p>
                <div className={`w-full py-2 rounded-xl text-xs font-bold text-center transition-all
                    ${selected
                        ? 'bg-[#38bdf8] text-[#0d2a4a]'
                        : hasStock
                            ? 'bg-[#0d2a4a]/8 text-[#0d2a4a] border border-[#0d2a4a]/15 hover:bg-[#0d2a4a] hover:text-white'
                            : 'bg-gray-100 text-gray-400'}`}>
                    {selected ? 'Station Selected ✓' : hasStock ? 'Select Station' : 'Unavailable'}
                </div>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════
export default function CustomerDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const API = import.meta.env.VITE_API_URL

    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedStation, setSelectedStation] = useState<Station | null>(null)
    // Always show all stations — "nearby" is just a sorted bonus when address is set
    const [showAll, setShowAll] = useState(false)

    const hasAddress = Boolean(user?.address?.trim())
    const userLat = user?.latitude != null ? Number(user.latitude) : null
    const userLng = user?.longitude != null ? Number(user.longitude) : null

    // ── Fetch all active stations ─────────────────────────────────────────
    const fetchStations = useCallback(async () => {
        setLoading(true); setError('')
        try {
            const res = await axios.get(`${API}/stations/customer/list`, { withCredentials: true })
            setStations(res.data)
        } catch {
            setError('Failed to load stations. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [API])

    useEffect(() => { fetchStations() }, [fetchStations])

    // ── Attach distances and sort ─────────────────────────────────────────
    const stationsWithDistance: Station[] = stations.map(s => ({
        ...s,
        distance_km:
            userLat !== null && userLng !== null && s.latitude && s.longitude
                ? haversine(userLat, userLng, Number(s.latitude), Number(s.longitude))
                : undefined,
    })).sort((a, b) => {
        if (a.distance_km !== undefined && b.distance_km !== undefined)
            return a.distance_km - b.distance_km
        if (a.distance_km !== undefined) return -1
        if (b.distance_km !== undefined) return 1
        return a.station_name.localeCompare(b.station_name)
    })

    // Nearby = within 10km with stock — top 3
    const nearbyStations = stationsWithDistance.filter(
        s => Number(s.total_stock) > 0 &&
            (s.distance_km === undefined || s.distance_km <= 10)
    ).slice(0, 3)

    // ── Display logic ─────────────────────────────────────────────────────
    // If no address set OR showAll clicked → show ALL stations
    // If address set and not showAll → show nearby (top 3 within 10km)
    const displayedStations = (!hasAddress || showAll || nearbyStations.length === 0)
        ? stationsWithDistance
        : nearbyStations

    const isShowingNearby = hasAddress && !showAll && nearbyStations.length > 0

    const handleSelect = (station: Station) =>
        setSelectedStation(s => s?.station_id === station.station_id ? null : station)

    return (
        <div className="flex flex-col gap-5 pb-24 lg:pb-10">

            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Choose a Water Station</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {hasAddress
                            ? 'Showing nearest stations with available stock'
                            : 'All available water refilling stations'}
                    </p>
                </div>

                {/* Location pill */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-sm">
                    <MapPin size={13} className={hasAddress ? 'text-[#38bdf8]' : 'text-gray-300'} />
                    <div>
                        <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider leading-none">
                            {hasAddress ? 'Your Location' : 'No Location Set'}
                        </p>
                        <p className="text-xs font-bold text-gray-700 leading-tight max-w-[150px] truncate">
                            {hasAddress ? user!.address! : 'Set in Settings'}
                        </p>
                    </div>
                </div>
            </div>

            {/* No address banner — soft suggestion, not a blocker */}
            {!hasAddress && (
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-blue-50 border border-blue-100">
                    <AlertTriangle size={15} className="text-blue-400 shrink-0" />
                    <p className="text-xs text-blue-700 flex-1">
                        Set your address in <strong>Settings</strong> to see the nearest station to you.
                    </p>
                    <button
                        onClick={() => navigate('/customer/settings')}
                        className="shrink-0 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap"
                    >
                        Settings <ChevronRight size={12} />
                    </button>
                </div>
            )}

            {/* Section header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Store size={15} className="text-[#0d2a4a]" />
                    <span className="text-sm font-bold text-gray-700">
                        {isShowingNearby
                            ? `Nearby Stations (${nearbyStations.length})`
                            : `All Stations (${stationsWithDistance.length})`}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchStations} title="Refresh"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {/* Always show See All / Show Nearby toggle when address is set */}
                    {hasAddress && nearbyStations.length > 0 && (
                        <button
                            onClick={() => setShowAll(s => !s)}
                            className="text-xs font-bold text-[#0d2a4a] hover:text-[#38bdf8] transition-colors flex items-center gap-1"
                        >
                            {showAll ? 'Show Nearby' : `See All (${stationsWithDistance.length})`}
                            <ChevronRight size={12} className={`transition-transform ${showAll ? 'rotate-90' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                            <div className="h-32 bg-gray-100" />
                            <div className="p-4 bg-white flex flex-col gap-2">
                                <div className="h-3 bg-gray-100 rounded w-3/4" />
                                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                                <div className="h-8 bg-gray-100 rounded-xl mt-1" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <AlertCircle size={28} className="text-red-400" />
                    <p className="text-sm text-red-500 font-medium">{error}</p>
                    <button onClick={fetchStations} className="text-xs text-[#0d2a4a] font-semibold hover:underline">
                        Try again
                    </button>
                </div>
            ) : displayedStations.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Droplets size={32} className="text-gray-300" />
                    <p className="text-sm text-gray-500 font-medium">No stations available right now.</p>
                    <button onClick={fetchStations}
                        className="text-xs text-[#0d2a4a] font-bold hover:underline flex items-center gap-1">
                        Refresh <RefreshCw size={11} />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedStations.map(station => (
                        <StationCard
                            key={station.station_id}
                            station={station}
                            selected={selectedStation?.station_id === station.station_id}
                            onSelect={handleSelect}
                            API={API}
                        />
                    ))}
                </div>
            )}

            {/* Mobile sticky bottom bar */}
            {selectedStation && (
                <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl">
                    <div className="flex items-center gap-3 max-w-lg mx-auto">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Selected</p>
                            <p className="text-sm font-bold text-gray-800 truncate">{selectedStation.station_name}</p>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.setItem('selected_station', JSON.stringify(selectedStation))
                                navigate('/customer/orders')
                            }}
                            className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white font-bold text-sm transition-all active:scale-95 shadow-md"
                        >
                            Order Now <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop bottom bar */}
            {selectedStation && (
                <div className="hidden lg:flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#0d2a4a] shadow-lg">
                    <CheckCircle2 size={18} className="text-[#38bdf8] shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-300">Selected station</p>
                        <p className="text-sm font-bold text-white truncate">{selectedStation.station_name}</p>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.setItem('selected_station', JSON.stringify(selectedStation))
                            navigate('/customer/orders')
                        }}
                        className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0d2a4a] font-black text-sm transition-all active:scale-95"
                    >
                        Order Now <ChevronRight size={15} />
                    </button>
                </div>
            )}
        </div>
    )
}