// SAPayments - tracks software subscription/payment status of registered stations
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
    CreditCard, Plus, RefreshCw, Loader2, X,
    CheckCircle2, Clock, AlertTriangle, XCircle,
    Building2, Pencil, Trash2, CalendarDays, TrendingUp,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL

// Plan type: 1=monthly, 2=annual, 3=one_time
// Payment status: 1=active, 2=pending, 3=overdue, 4=expired
const PLAN_LABELS: Record<number, string> = { 1: 'Monthly', 2: 'Annual', 3: 'One-Time' }
const STATUS_CFG: Record<number, { label: string; color: string; bg: string; border: string; icon: any }> = {
    1: { label: 'Active',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
    2: { label: 'Pending',  color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: Clock },
    3: { label: 'Overdue',  color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     icon: AlertTriangle },
    4: { label: 'Expired',  color: 'text-gray-500',    bg: 'bg-gray-100',   border: 'border-gray-200',    icon: XCircle },
}

interface Subscription {
    subscription_id: number
    station_id: number
    station_name: string
    plan_type: number
    amount: number
    payment_status: number
    start_date: string
    end_date: string | null
    notes: string | null
    recorded_by_name: string | null
    created_at: string
}

interface Station { station_id: number; station_name: string }

interface ToastData { message: string; type: 'success' | 'error' }
const Toast = ({ toast, onDone }: { toast: ToastData; onDone: () => void }) => {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
    return (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-md text-sm font-medium
            ${toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-white text-[#0d2a4a]'}`}>
            {toast.message}
        </div>
    )
}

const fmt = (n: number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

const emptyForm = {
    station_id: '',
    plan_type: '1',
    amount: '',
    payment_status: '1',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    notes: '',
}

export default function SAPayments() {
    const [subs, setSubs] = useState<Subscription[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<ToastData | null>(null)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editTarget, setEditTarget] = useState<Subscription | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null)
    const [deleting, setDeleting] = useState(false)

    const notify = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type })

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const [subsRes, stationsRes] = await Promise.all([
                axios.get(`${API}/sysadmin/subscriptions`, { withCredentials: true }),
                axios.get(`${API}/sysadmin/stations`, { withCredentials: true }),
            ])
            setSubs(subsRes.data)
            setStations(stationsRes.data)
        } catch {
            notify('Failed to load data', 'error')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    const openAdd = () => {
        setEditTarget(null)
        setForm(emptyForm)
        setFormError('')
        setShowModal(true)
    }

    const openEdit = (s: Subscription) => {
        setEditTarget(s)
        setForm({
            station_id: String(s.station_id),
            plan_type: String(s.plan_type),
            amount: String(s.amount),
            payment_status: String(s.payment_status),
            start_date: s.start_date?.slice(0, 10) ?? '',
            end_date: s.end_date?.slice(0, 10) ?? '',
            notes: s.notes ?? '',
        })
        setFormError('')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.station_id || !form.amount || !form.start_date) {
            setFormError('Station, amount, and start date are required')
            return
        }
        setSaving(true); setFormError('')
        try {
            const payload = {
                station_id: parseInt(form.station_id),
                plan_type: parseInt(form.plan_type),
                amount: parseFloat(form.amount),
                payment_status: parseInt(form.payment_status),
                start_date: form.start_date,
                end_date: form.end_date || null,
                notes: form.notes || null,
            }
            if (editTarget) {
                await axios.put(`${API}/sysadmin/subscriptions/${editTarget.subscription_id}`, payload, { withCredentials: true })
                notify('Subscription updated')
            } else {
                await axios.post(`${API}/sysadmin/subscriptions`, payload, { withCredentials: true })
                notify('Subscription recorded')
            }
            setShowModal(false)
            fetchAll()
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Server error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await axios.delete(`${API}/sysadmin/subscriptions/${deleteTarget.subscription_id}`, { withCredentials: true })
            notify('Record deleted')
            setDeleteTarget(null)
            fetchAll()
        } catch {
            notify('Failed to delete', 'error')
        } finally {
            setDeleting(false)
        }
    }

    // Summary counts
    const active  = subs.filter(s => s.payment_status === 1).length
    const pending = subs.filter(s => s.payment_status === 2).length
    const overdue = subs.filter(s => s.payment_status === 3).length
    const totalRevenue = subs.filter(s => s.payment_status === 1).reduce((sum, s) => sum + Number(s.amount), 0)

    const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
            {children}
        </div>
    )
    const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#38bdf8] transition-colors"

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-black text-[#0d2a4a] flex items-center gap-2">
                        <CreditCard size={20} className="text-[#38bdf8]" /> Station Payments
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">Track software subscription and one-time payments per station</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAll} disabled={loading}
                        className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-[#38bdf8] hover:border-[#38bdf8] transition-all disabled:opacity-40">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={openAdd}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#0d2a4a] hover:bg-[#163a5f] transition-all">
                        <Plus size={13} /> Record Payment
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Total Revenue', value: fmt(totalRevenue), sub: 'from active subscriptions', icon: TrendingUp, color: 'text-[#38bdf8]', gradient: 'bg-[#0d2a4a]', style: { backgroundImage: 'radial-gradient(ellipse at top right, #1a4a7a 0%, #0d2a4a 60%)' }, dark: true },
                    { label: 'Active',         value: active,           sub: 'stations paid & active',    icon: CheckCircle2, color: 'text-emerald-500', gradient: 'bg-white', style: { backgroundImage: 'radial-gradient(ellipse at bottom left, #bbf7d0 0%, #ffffff 60%)' }, dark: false },
                    { label: 'Pending',        value: pending,          sub: 'awaiting payment',          icon: Clock,        color: 'text-amber-500',   gradient: 'bg-white', style: { backgroundImage: 'radial-gradient(ellipse at bottom left, #fde68a 0%, #ffffff 60%)' }, dark: false },
                    { label: 'Overdue',        value: overdue,          sub: 'missed payments',           icon: AlertTriangle, color: 'text-red-500',    gradient: 'bg-white', style: { backgroundImage: 'radial-gradient(ellipse at bottom left, #fecaca 0%, #ffffff 60%)' }, dark: false },
                ].map(({ label, value, sub, icon: Icon, color, gradient, style, dark }, i) => (
                    <div key={label} className={`${gradient} rounded-2xl p-4 flex flex-col gap-2 border ${dark ? 'border-[#1a4a7a]' : 'border-gray-100'} shadow-md hover:shadow-lg transition-all`}
                        style={{ ...style, animationDelay: `${i * 60}ms` }}>
                        <div className="flex items-center justify-between">
                            <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-white/50' : 'text-gray-400'}`}>{label}</p>
                            <Icon size={16} className={color} />
                        </div>
                        <p className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-800'}`}>{value}</p>
                        <p className={`text-[10px] ${dark ? 'text-[#38bdf8]' : 'text-gray-400'}`}>{sub}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400">
                        <Loader2 size={20} className="animate-spin mr-2" /> Loading…
                    </div>
                ) : subs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                        <CreditCard size={32} className="opacity-30" />
                        <p className="text-sm font-medium">No payment records yet</p>
                        <button onClick={openAdd} className="text-xs text-[#38bdf8] hover:underline font-semibold mt-1">
                            + Record the first payment
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    {['Station', 'Plan', 'Amount', 'Status', 'Period', 'Notes', ''].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {subs.map(s => {
                                    const cfg = STATUS_CFG[s.payment_status] ?? STATUS_CFG[2]
                                    const Icon = cfg.icon
                                    return (
                                        <tr key={s.subscription_id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-[#0d2a4a]/5 flex items-center justify-center shrink-0">
                                                        <Building2 size={13} className="text-[#0d2a4a]/50" />
                                                    </div>
                                                    <span className="font-semibold text-[#0d2a4a] leading-tight">{s.station_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold text-[10px]">
                                                    {PLAN_LABELS[s.plan_type] ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-[#0d2a4a]">{fmt(s.amount)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                                                    <Icon size={10} /> {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <CalendarDays size={11} className="text-gray-300 shrink-0" />
                                                    <span>{fmtDate(s.start_date)}</span>
                                                    {s.end_date && <><span className="text-gray-300">→</span><span>{fmtDate(s.end_date)}</span></>}
                                                    {!s.end_date && s.plan_type === 3 && <span className="text-sky-500 font-semibold ml-1">Lifetime</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 max-w-[160px] truncate">{s.notes ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <button onClick={() => openEdit(s)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#38bdf8] hover:bg-sky-50 transition-all">
                                                        <Pencil size={12} />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(s)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h2 className="font-black text-sm text-[#0d2a4a]">
                                {editTarget ? 'Edit Subscription' : 'Record Payment'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
                            {/* Station */}
                            <Field label="Station *">
                                <select value={form.station_id} onChange={e => setForm(f => ({ ...f, station_id: e.target.value }))}
                                    className={inputCls} disabled={!!editTarget}>
                                    <option value="">Select station…</option>
                                    {stations.map(s => (
                                        <option key={s.station_id} value={s.station_id}>{s.station_name}</option>
                                    ))}
                                </select>
                            </Field>

                            {/* Plan type */}
                            <Field label="Plan Type *">
                                <div className="grid grid-cols-3 gap-2">
                                    {([['1', 'Monthly'], ['2', 'Annual'], ['3', 'One-Time']] as const).map(([val, lbl]) => (
                                        <button key={val} type="button"
                                            onClick={() => setForm(f => ({ ...f, plan_type: val }))}
                                            className={`py-2 rounded-xl text-xs font-bold border transition-all
                                                ${form.plan_type === val
                                                    ? 'bg-[#0d2a4a] text-white border-[#0d2a4a]'
                                                    : 'border-gray-200 text-gray-500 hover:border-[#38bdf8]'}`}>
                                            {lbl}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            {/* Amount */}
                            <Field label="Amount (₱) *">
                                <input type="number" min="0" step="0.01" placeholder="0.00"
                                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                    className={inputCls} />
                            </Field>

                            {/* Status */}
                            <Field label="Payment Status *">
                                <div className="grid grid-cols-2 gap-2">
                                    {([['1', 'Active'], ['2', 'Pending'], ['3', 'Overdue'], ['4', 'Expired']] as const).map(([val, lbl]) => (
                                        <button key={val} type="button"
                                            onClick={() => setForm(f => ({ ...f, payment_status: val }))}
                                            className={`py-2 rounded-xl text-xs font-bold border transition-all
                                                ${form.payment_status === val
                                                    ? 'bg-[#0d2a4a] text-white border-[#0d2a4a]'
                                                    : 'border-gray-200 text-gray-500 hover:border-[#38bdf8]'}`}>
                                            {lbl}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Start Date *">
                                    <input type="date" value={form.start_date}
                                        onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                                        className={inputCls} />
                                </Field>
                                <Field label={form.plan_type === '3' ? 'End Date (optional)' : 'End Date'}>
                                    <input type="date" value={form.end_date}
                                        onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                                        className={inputCls} />
                                </Field>
                            </div>
                            {form.plan_type === '3' && !form.end_date && (
                                <p className="text-[10px] text-sky-500 font-semibold -mt-1">No end date = Lifetime access</p>
                            )}

                            {/* Notes */}
                            <Field label="Notes (optional)">
                                <textarea rows={2} placeholder="e.g. Paid via GCash, ref# 12345"
                                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    className={`${inputCls} resize-none`} />
                            </Field>

                            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}
                        </div>

                        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
                            <button onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0d2a4a] hover:bg-[#163a5f] transition-all disabled:opacity-50 flex items-center gap-1.5">
                                {saving && <Loader2 size={12} className="animate-spin" />}
                                {editTarget ? 'Save Changes' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                <Trash2 size={16} className="text-red-500" />
                            </div>
                            <div>
                                <p className="font-black text-sm text-[#0d2a4a]">Delete record?</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Remove payment record for <span className="font-semibold text-[#0d2a4a]">{deleteTarget.station_name}</span>? This cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-1.5">
                                {deleting && <Loader2 size={12} className="animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
        </div>
    )
}
