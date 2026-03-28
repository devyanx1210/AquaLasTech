// SALogs - system admin log viewer with clear logs
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { ScrollText, RefreshCw, Loader2, LogIn, Building2, UserPlus, ShieldAlert, Trash2, X, Lock, AlertCircle } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

interface LogEntry {
    log_id: number
    event_type: string
    description: string
    ip_address: string | null
    created_at: string
    full_name: string | null
    email: string | null
    role: string | null
}

const EVENT_CFG: Record<string, { label: string; icon: any; color: string; bg: string; badge: string }> = {
    login: { label: 'Login', icon: LogIn, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-500' },
    station_created: { label: 'Station', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-500' },
    station_deleted: { label: 'Station Deleted', icon: Building2, color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-500' },
    admin_created: { label: 'Admin Created', icon: UserPlus, color: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-500' },
    logs_cleared: { label: 'Logs Cleared', icon: Trash2, color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-500' },
}

const getCfg = (type: string) =>
    EVENT_CFG[type] ?? { label: type, icon: ShieldAlert, color: 'text-gray-600', bg: 'bg-gray-50', badge: 'bg-gray-400' }

const fmtTs = (ts: string) => {
    const d = new Date(ts)
    return {
        date: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
    }
}

const FILTERS = ['all', 'login', 'station_created', 'station_deleted', 'admin_created'] as const
type Filter = typeof FILTERS[number]

export default function SALogs() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<Filter>('all')

    // Clear modal
    const [showClear, setShowClear] = useState(false)
    const [clearPassword, setClearPassword] = useState('')
    const [clearError, setClearError] = useState('')
    const [clearing, setClearing] = useState(false)

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API}/sysadmin/logs`, { withCredentials: true })
            setLogs(res.data)
        } catch (err) {
            console.error('[SALogs] fetch error:', err)
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    const handleClearLogs = async () => {
        if (!clearPassword) { setClearError('Password is required'); return }
        setClearing(true); setClearError('')
        try {
            await axios.delete(`${API}/sysadmin/logs`,
                { data: { password: clearPassword }, withCredentials: true })
            setShowClear(false)
            setClearPassword('')
            fetchLogs()
        } catch (err: any) {
            console.error('[SALogs] clear error:', err)
            setClearError(err.response?.data?.message || 'Failed to clear logs')
        } finally { setClearing(false) }
    }

    const displayed = filter === 'all' ? logs : logs.filter(l => l.event_type === filter)

    return (
        <div className="flex flex-col gap-5">

            {/* Header */}
            <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800">System Logs</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Login activity and system events</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Filter chips */}
                    <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm gap-0.5 flex-wrap">
                        {FILTERS.map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all
                                    ${filter === f ? 'bg-[#0d2a4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                {f === 'all' ? 'All' : getCfg(f).label}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchLogs}
                        className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                        <RefreshCw size={15} className="text-gray-500" />
                    </button>
                    <button onClick={() => { setShowClear(true); setClearPassword(''); setClearError('') }}
                        className="p-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 transition-all">
                        <Trash2 size={15} className="text-red-400" />
                    </button>
                </div>
            </div>

            {/* Log list */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                        <Loader2 size={18} className="animate-spin" /> Loading logs…
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-2">
                        <ScrollText size={32} />
                        <p className="text-sm font-medium">No events yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {displayed.map(log => {
                            const cfg = getCfg(log.event_type)
                            const Icon = cfg.icon
                            const { date, time } = fmtTs(log.created_at)
                            return (
                                <div key={log.log_id} className="flex items-start gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                        <Icon size={14} className={cfg.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-700 leading-snug break-words">{log.description}</p>
                                        {log.ip_address && (
                                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">IP: {log.ip_address}</p>
                                        )}
                                    </div>
                                    <div className="shrink-0 text-right ml-2">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${cfg.badge}`}>
                                            {cfg.label}
                                        </span>
                                        <p className="text-[10px] text-gray-500 mt-1 font-medium">{date}</p>
                                        <p className="text-[9px] text-gray-400">{time}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <p className="text-[10px] text-gray-400 text-center">Showing the last 200 events</p>

            {/* ── Clear Logs Modal ── */}
            {showClear && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowClear(false)} />
                    <div className="relative z-10 w-full sm:max-w-sm mx-0 sm:mx-4 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-red-500 px-5 py-4 flex items-center justify-between">
                            <p className="text-white font-bold text-sm">Clear All Logs</p>
                            <button onClick={() => setShowClear(false)} className="text-white/70 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="px-5 py-4 flex flex-col gap-3">
                            <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-100 rounded-xl p-3">
                                <AlertCircle size={14} className="text-orange-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-orange-700">This will permanently delete all system logs. This action cannot be undone.</p>
                            </div>
                            <p className="text-xs text-gray-500">Enter your system admin password to confirm.</p>
                            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-red-400 transition-colors">
                                <span className="px-3 text-gray-300"><Lock size={13} /></span>
                                <input type="password" placeholder="Your password"
                                    value={clearPassword}
                                    onChange={e => setClearPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleClearLogs()}
                                    className="flex-1 py-2.5 pr-3 text-xs text-gray-800 bg-transparent focus:outline-none" />
                            </div>
                            {clearError && <p className="text-xs text-red-500 text-center">{clearError}</p>}
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setShowClear(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleClearLogs} disabled={clearing}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                                    {clearing ? <><Loader2 size={12} className="animate-spin" /> Clearing…</> : <><Trash2 size={12} /> Clear Logs</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
