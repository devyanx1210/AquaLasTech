// CustomerOrder - place new water delivery orders and track their status
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    ShoppingCart, Minus, Plus, Trash2, ArrowLeft,
    Droplets, MapPin, CheckCircle2, AlertCircle,
    Loader2, Upload, X, ChevronRight, Smartphone,
    Banknote, Package, RefreshCw, Clock, Truck,
    XCircle, RotateCcw, History, Zap,
    Maximize2, Download,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL

// Types
interface Product {
    product_id: number
    product_name: string
    description: string
    price: number
    unit: string
    image_url: string | null
    quantity: number
}
interface CartItem extends Product { qty: number }
interface Station {
    station_id: number
    station_name: string
    address: string
    image_path: string | null
    contact_number: string | null
    qr_code_path: string | null
}
interface CustomerOrder {
    order_id: number
    order_reference: string
    total_amount: number
    payment_mode: string
    order_status: string
    payment_status: string
    proof_image_path: string | null
    station_name: string
    station_address: string
    item_count: number
    created_at: string
    return_status?: string | null
    return_reason?: string | null
    verified_by_name?: string | null
    return_processed_by_name?: string | null
    items?: OrderItem[]
}
interface OrderItem {
    order_item_id: number
    product_name: string
    unit: string
    image_url: string | null
    quantity: number
    price_snapshot: number
}

type View = 'products' | 'cart'
type PaymentMode = 'gcash' | 'cash_on_delivery' | 'cash_on_pickup'
type ToastType = 'success' | 'error'
type PanelTab = 'active' | 'history'

// Status config
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: any; btnBg: string }> = {
    confirmed: { label: 'Confirmed', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400', icon: CheckCircle2, btnBg: 'bg-blue-600' },
    out_for_delivery: { label: 'Out for Delivery', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-400', icon: Truck, btnBg: 'bg-purple-600' },
    delivered: { label: 'Delivered', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2, btnBg: 'bg-emerald-600' },
    cancelled: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400', icon: XCircle, btnBg: 'bg-red-500' },
    returned: { label: 'Returned', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-400', icon: RotateCcw, btnBg: 'bg-orange-500' },
}

const PAYMENT_LABEL: Record<string, string> = {
    gcash: 'GCash',
    cash_on_delivery: 'Cash on Delivery',
    cash_on_pickup: 'Cash on Pickup',
    cash: 'Cash',
}

// currency formatter
const fmt = (n: number) => `₱${Number(n).toFixed(2)}`
const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}
const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// Quantity input that allows free typing without snapping back
function QtyInput({ value, max, size, onChange }: { value: number; max: number; size: 'sm' | 'xs'; onChange: (v: number) => void }) {
    const [raw, setRaw] = useState(String(value))
    useEffect(() => { setRaw(String(value)) }, [value])
    return (
        <input
            type="number"
            inputMode="numeric"
            value={raw}
            onChange={e => {
                setRaw(e.target.value)
                const n = parseInt(e.target.value)
                if (!isNaN(n) && n >= 1) onChange(Math.min(n, max))
            }}
            onBlur={() => {
                const n = parseInt(raw)
                if (isNaN(n) || n < 1) setRaw(String(value))
                else onChange(Math.min(n, max))
            }}
            className={`text-center font-black text-gray-800 bg-transparent border-none outline-none
                [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none
                ${size === 'sm' ? 'w-10 text-sm' : 'w-8 text-sm'}`}
        />
    )
}

// Toast
function Toast({ msg, type, onDone }: { msg: string; type: ToastType; onDone: () => void }) {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
    return (
        <div className={`fixed bottom-24 lg:bottom-6 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium max-w-xs
            ${type === 'success' ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-600'}`}>
            {type === 'success' ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" /> : <AlertCircle size={15} className="text-red-500 shrink-0" />}
            {msg}
        </div>
    )
}

// Status Timeline (horizontal steps)
function StatusTimeline({ status }: { status: string }) {
    const steps = ['confirmed', 'out_for_delivery', 'delivered']
    if (status === 'cancelled' || status === 'returned') {
        const cfg = STATUS_CFG[status]
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white ${cfg.btnBg}`}>
                <cfg.icon size={13} /> Order {cfg.label}
            </div>
        )
    }
    const currentIdx = steps.indexOf(status)
    return (
        <div className="flex items-center gap-1 w-full">
            {steps.map((step, i) => {
                const done = i <= currentIdx
                const current = i === currentIdx
                const cfg = STATUS_CFG[step]
                return (
                    <div key={step} className="flex items-center flex-1 min-w-0">
                        <div className="flex flex-col items-center gap-1 min-w-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all
                                ${current ? 'bg-[#0d2a4a] ring-2 ring-[#38bdf8]/40 shadow-md' : done ? 'bg-[#38bdf8]' : 'bg-gray-200'}`}>
                                <cfg.icon size={11} className={done ? 'text-white' : 'text-gray-400'} />
                            </div>
                            <p className={`text-[8px] font-bold text-center leading-tight max-w-[44px] truncate
                                ${current ? 'text-[#0d2a4a]' : done ? 'text-[#38bdf8]' : 'text-gray-300'}`}>
                                {cfg.label.replace('Out for ', '')}
                            </p>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${i < currentIdx ? 'bg-[#38bdf8]' : 'bg-gray-200'}`} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// Order Detail Modal
// Replaces inline expand — opens as a proper full modal with scroll
function OrderDetailModal({ order, onClose, onCancel, onReturn }: {
    order: CustomerOrder
    onClose: () => void
    onCancel: (o: CustomerOrder) => void
    onReturn: (o: CustomerOrder) => void
}) {
    const cfg = STATUS_CFG[order.order_status] ?? STATUS_CFG.confirmed
    const canCancel = order.order_status === 'confirmed'
    const canReturn = order.order_status === 'delivered'
    const isReturned = order.order_status === 'returned'

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Sheet — slides up on mobile, centered on desktop */}
            <div
                className="relative z-10 w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]"
                onTouchStart={e => (e.currentTarget.dataset.touchY = String(e.touches[0].clientY))}
                onTouchEnd={e => {
                    const startY = Number(e.currentTarget.dataset.touchY)
                    if (e.changedTouches[0].clientY - startY > 80) onClose()
                }}
            >

                {/* Handle bar (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <p className="text-[10px] text-gray-400 font-mono tracking-wider">{order.order_reference}</p>
                        <h3 className="text-sm font-black text-gray-800 mt-0.5">{order.station_name}</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(order.created_at)}</p>
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-all shrink-0 ml-3">
                        <X size={16} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">

                    {/* Status badge + timeline */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white ${cfg.btnBg}`}>
                                <cfg.icon size={12} /> {cfg.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold text-white
                                ${order.payment_status === 'verified' ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                                {order.payment_status === 'verified'
                                    ? <><CheckCircle2 size={11} /> Paid</>
                                    : <><Clock size={11} /> Payment Pending</>}
                            </span>
                            <span className="ml-auto text-base font-black text-[#0d2a4a]">{fmt(order.total_amount)}</span>
                        </div>
                        {order.order_status !== 'cancelled' && order.order_status !== 'returned' && (
                            <div className="bg-gray-50 rounded-2xl p-3">
                                <StatusTimeline status={order.order_status} />
                            </div>
                        )}
                    </div>

                    {/* Payment mode */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="text-gray-400">Payment:</span>
                        <span className="font-bold text-gray-700">{PAYMENT_LABEL[order.payment_mode] ?? order.payment_mode}</span>
                    </div>

                    {/* Items */}
                    {order.items && order.items.length > 0 && (
                        <div className="flex flex-col gap-1 rounded-2xl overflow-hidden border border-gray-100">
                            <div className="px-4 py-2 bg-[#e8f4fd]">
                                <p className="text-[10px] font-bold text-[#0d2a4a]/60 uppercase tracking-wider">Items Ordered</p>
                            </div>
                            {order.items.map(item => {
                                const imgSrc = item.image_url
                                    ? item.image_url.startsWith('http') ? item.image_url : `${API}${item.image_url}`
                                    : null
                                return (
                                    <div key={item.order_item_id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 bg-white">
                                        <div className="w-10 h-10 rounded-xl bg-[#e8f4fd] flex items-center justify-center shrink-0 overflow-hidden">
                                            {imgSrc
                                                ? <img src={imgSrc} alt={item.product_name} className="w-full h-full object-cover" />
                                                : <Droplets size={14} className="text-[#38bdf8]" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800 truncate">{item.product_name}</p>
                                            <p className="text-[10px] text-gray-400">{item.unit} · {fmt(item.price_snapshot)} each</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-black text-[#0d2a4a]">{fmt(item.price_snapshot * item.quantity)}</p>
                                            <p className="text-[10px] text-gray-400">×{item.quantity}</p>
                                        </div>
                                    </div>
                                )
                            })}
                            <div className="flex justify-between items-center px-4 py-3 bg-[#0d2a4a]">
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Total</p>
                                <p className="text-sm font-black text-white">{fmt(order.total_amount)}</p>
                            </div>
                        </div>
                    )}

                    {/* Payment verified by */}
                    {order.verified_by_name && order.payment_status === 'verified' && (
                        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50 text-xs">
                            <span className="text-gray-400">GCash verified by</span>
                            <span className="font-semibold text-emerald-700">{order.verified_by_name}</span>
                        </div>
                    )}

                    {/* Return reviewed by */}
                    {order.return_processed_by_name && order.return_status && order.return_status !== 'pending' && (
                        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                            <span className="text-gray-400">Return {order.return_status === 'approved' ? 'approved' : 'rejected'} by</span>
                            <span className="font-semibold text-gray-700">{order.return_processed_by_name}</span>
                        </div>
                    )}

                    {/* Return status banner */}
                    {isReturned && order.return_status && (
                        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold border
                            ${order.return_status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                order.return_status === 'rejected' ? 'bg-red-50 text-red-500 border-red-200' :
                                    'bg-orange-50 text-orange-500 border-orange-200'}`}>
                            <RotateCcw size={13} />
                            <div>
                                <p className="font-black">Return {order.return_status === 'pending' ? 'Under Review' :
                                    order.return_status === 'approved' ? 'Approved' : 'Rejected'}</p>
                                {order.return_reason && (
                                    <p className="font-normal text-[10px] mt-0.5 opacity-80">"{order.return_reason}"</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer actions — sticky */}
                {(canCancel || canReturn) && (
                    <div className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
                        {canCancel && (
                            <button
                                onClick={() => { onCancel(order); onClose() }}
                                className="flex-1 flex items-center justify-center py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all active:scale-95">
                                Cancel Order
                            </button>
                        )}
                        {canReturn && (
                            <button
                                onClick={() => { onReturn(order); onClose() }}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-500 text-sm font-bold transition-all active:scale-95">
                                Request Return
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// Order Card (compact list item — tap to open modal)
function OrderCard({ order, onOpen, onDelete }: {
    order: CustomerOrder
    onOpen: () => void
    onDelete?: (o: CustomerOrder) => void
}) {
    const cfg = STATUS_CFG[order.order_status] ?? STATUS_CFG.confirmed

    return (
        <div
            onClick={onOpen}
            className="relative w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.98] cursor-pointer"
        >
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <cfg.icon size={15} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-800 font-mono leading-tight">{order.order_reference}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{order.station_name} · {timeAgo(order.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xs font-black text-[#0d2a4a]">{fmt(order.total_amount)}</p>
                    <p className="text-[10px] text-gray-400">{order.item_count} item(s)</p>
                </div>
                <ChevronRight size={13} className="text-gray-300 shrink-0 ml-1" />
            </div>

            {/* Status strip */}
            <div className="px-4 pb-5">
                {order.order_status === 'cancelled' || order.order_status === 'returned' ? (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white ${cfg.btnBg}`}>
                        <cfg.icon size={10} /> {cfg.label}
                        {order.order_status === 'returned' && order.return_status && order.return_status !== 'pending' && (
                            <span className="opacity-70"> · {order.return_status}</span>
                        )}
                    </span>
                ) : (
                    <StatusTimeline status={order.order_status} />
                )}
            </div>

            {/* Cancel hint when confirmed */}
            {order.order_status === 'confirmed' && (
                <div className="mx-4 mb-3 flex items-center gap-1.5 text-[10px] text-red-400 font-semibold">
                    <XCircle size={10} /> Tap to view · Can still cancel
                </div>
            )}
            {/* Return hint when delivered */}
            {order.order_status === 'delivered' && (
                <div className="mx-4 mb-3 flex items-center gap-1.5 text-[10px] text-orange-400 font-semibold">
                    <RotateCcw size={10} /> Tap to view · Return available
                </div>
            )}
            {/* Return pending */}
            {order.order_status === 'returned' && order.return_status === 'pending' && (
                <div className="mx-4 mb-3 flex items-center gap-1.5 text-[10px] text-orange-500 font-semibold animate-pulse">
                    <RotateCcw size={10} /> Return under review
                </div>
            )}
            {/* Delete button — history orders only */}
            {onDelete && (
                <button
                    onClick={e => { e.stopPropagation(); onDelete(order) }}
                    className="absolute bottom-3 right-3 p-1.5 rounded-lg text-red-400 hover:bg-red-50 active:scale-95 transition-all"
                >
                    <Trash2 size={13} />
                </button>
            )}
        </div>
    )
}

// Cancel Modal (with reason field, no admin approval needed)
function CancelModal({ order, onClose, onConfirm }: {
    order: CustomerOrder
    onClose: () => void
    onConfirm: (reason: string) => Promise<void>
}) {
    const [reason, setReason] = useState('')
    const [busy, setBusy] = useState(false)

    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full sm:max-w-sm bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl p-6 flex flex-col gap-4">
                {/* Handle */}
                <div className="flex justify-center -mt-2 mb-1 sm:hidden">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                        <XCircle size={20} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-800">Cancel Order</h3>
                        <p className="text-[11px] text-gray-400 font-mono">{order.order_reference}</p>
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Reason for cancellation <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="e.g. Changed my mind, ordered by mistake..."
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-red-300 outline-none text-sm resize-none transition-all"
                    />
                </div>
                <p className="text-[10px] text-gray-400 -mt-2">
                    Your order will be cancelled immediately and stock will be restored.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} disabled={busy}
                        className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
                        Keep Order
                    </button>
                    <button
                        onClick={async () => {
                            if (!reason.trim()) return
                            setBusy(true)
                            await onConfirm(reason)
                            setBusy(false)
                        }}
                        disabled={busy || !reason.trim()}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Confirm Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

// Return Modal
function ReturnModal({ order, onClose, onConfirm }: {
    order: CustomerOrder
    onClose: () => void
    onConfirm: (reason: string) => Promise<void>
}) {
    const [reason, setReason] = useState('')
    const [busy, setBusy] = useState(false)

    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full sm:max-w-sm bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl p-6 flex flex-col gap-4">
                <div className="flex justify-center -mt-2 mb-1 sm:hidden">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                        <RotateCcw size={20} className="text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-800">Request Return</h3>
                        <p className="text-[11px] text-gray-400 font-mono">{order.order_reference}</p>
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Reason for return <span className="text-orange-400">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Describe why you want to return this order..."
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-orange-300 outline-none text-sm resize-none transition-all"
                    />
                </div>
                <p className="text-[10px] text-gray-400 -mt-2">
                    Your return request will be reviewed by the station admin.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} disabled={busy}
                        className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
                        Back
                    </button>
                    <button
                        onClick={async () => {
                            if (!reason.trim()) return
                            setBusy(true)
                            await onConfirm(reason)
                            setBusy(false)
                        }}
                        disabled={busy || !reason.trim()}
                        className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                        Submit Return
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function CustomerOrder() {
    const navigate = useNavigate()

    const [station, setStation] = useState<Station | null>(() => {
        try { return JSON.parse(localStorage.getItem('selected_station') || 'null') }
        catch { return null }
    })

    // Re-fetch station from API on mount to always get fresh data (e.g. contact_number)
    useEffect(() => {
        const cached = localStorage.getItem('selected_station')
        if (!cached) return
        try {
            const s = JSON.parse(cached)
            if (!s?.station_id) return
            axios.get(`${API}/stations/${s.station_id}`, { withCredentials: true })
                .then(res => {
                    const fresh = { ...s, ...res.data }
                    setStation(fresh)
                    localStorage.setItem('selected_station', JSON.stringify(fresh))
                })
                .catch(() => { })
        } catch { }
    }, [])

    // Products + Cart
    const [products, setProducts] = useState<Product[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [view, setView] = useState<View>('products')
    const [loadingProds, setLoadingProds] = useState(true)
    const [placing, setPlacing] = useState(false)
    const [payMode, setPayMode] = useState<PaymentMode>('gcash')
    const [receipt, setReceipt] = useState<File | null>(null)
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
    const [receiptExpanded, setReceiptExpanded] = useState(false)
    const [qrExpanded, setQrExpanded] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    // Orders panel
    const [showOrdersPanel, setShowOrdersPanel] = useState(false)
    const [orders, setOrders] = useState<CustomerOrder[]>([])
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [panelTab, setPanelTab] = useState<PanelTab>('active')
    const [detailOrder, setDetailOrder] = useState<CustomerOrder | null>(null)
    const [cancelTarget, setCancelTarget] = useState<CustomerOrder | null>(null)
    const [returnTarget, setReturnTarget] = useState<CustomerOrder | null>(null)

    // Toast
    const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null)
    const showToast = useCallback((msg: string, type: ToastType) => setToast({ msg, type }), [])

    // Fetch products
    const fetchProducts = useCallback(async () => {
        if (!station) return
        setLoadingProds(true)
        try {
            const res = await axios.get(`${API}/customer/products/${station.station_id}`, { withCredentials: true })
            setProducts(res.data)
        } catch { showToast('Failed to load products', 'error') }
        finally { setLoadingProds(false) }
    }, [station])

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        setLoadingOrders(true)
        try {
            const res = await axios.get(`${API}/customer/orders`, { withCredentials: true })
            setOrders(res.data)
        } catch { }
        finally { setLoadingOrders(false) }
    }, [])

    // Fetch order detail (with items) when tapped
    const openOrderDetail = useCallback(async (order: CustomerOrder) => {
        // Show immediately with what we have, then enrich with items
        setDetailOrder(order)
        if (!order.items) {
            try {
                const res = await axios.get(`${API}/customer/orders/${order.order_id}`, { withCredentials: true })
                setDetailOrder(d => d?.order_id === order.order_id ? { ...d, ...res.data } : d)
                setOrders(prev => prev.map(o => o.order_id === order.order_id ? { ...o, ...res.data } : o))
            } catch { }
        }
    }, [])

    useEffect(() => { fetchProducts() }, [fetchProducts])
    useEffect(() => { fetchOrders() }, [fetchOrders])

    // Auto-refresh active orders every 30s
    useEffect(() => {
        const t = setInterval(fetchOrders, 30000)
        return () => clearInterval(t)
    }, [fetchOrders])

    // Cart helpers
    const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
    const cartItemCount = cart.reduce((s, i) => s + i.qty, 0)

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product_id === product.product_id)
            if (existing) {
                if (existing.qty >= product.quantity) { showToast('Not enough stock', 'error'); return prev }
                return prev.map(i => i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i)
            }
            if (product.quantity < 1) { showToast('Out of stock', 'error'); return prev }
            return [...prev, { ...product, qty: 1 }]
        })
    }

    const updateQty = (product_id: number, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.product_id !== product_id) return i
            const next = i.qty + delta
            if (next <= 0) return { ...i, qty: 0 }
            if (next > i.quantity) { showToast('Not enough stock', 'error'); return i }
            return { ...i, qty: next }
        }).filter(i => i.qty > 0))
    }

    const setQtyDirect = (product_id: number, value: number, maxQty: number) => {
        if (value > maxQty) { showToast('Not enough stock', 'error'); value = maxQty }
        setCart(prev => prev.map(i => i.product_id === product_id ? { ...i, qty: value } : i))
    }

    const removeFromCart = (product_id: number) =>
        setCart(prev => prev.filter(i => i.product_id !== product_id))
    const getQtyInCart = (product_id: number) =>
        cart.find(i => i.product_id === product_id)?.qty ?? 0

    // Receipt
    const handleReceiptPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setReceipt(file)
        setReceiptPreview(URL.createObjectURL(file))
    }

    // Place order
    const handlePlaceOrder = async () => {
        if (cart.length === 0) { showToast('Your cart is empty', 'error'); return }
        if (payMode === 'gcash' && !receipt) { showToast('Please upload your GCash receipt', 'error'); return }
        if (!station) { showToast('No station selected', 'error'); return }
        setPlacing(true)
        try {
            const formData = new FormData()
            formData.append('station_id', String(station.station_id))
            formData.append('payment_mode', payMode)
            formData.append('total_amount', String(cartTotal))
            formData.append('items', JSON.stringify(
                cart.map(i => ({ product_id: i.product_id, quantity: i.qty, unit_price: i.price }))
            ))
            if (receipt) formData.append('receipt', receipt)
            await axios.post(`${API}/customer/orders`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            showToast('Order placed!', 'success')
            setCart([])
            setReceipt(null)
            setReceiptPreview(null)
            setView('products')
            await Promise.all([fetchOrders(), fetchProducts()])
            setShowOrdersPanel(true)
            setPanelTab('active')
        } catch (err: any) {
            showToast(err.response?.data?.message ?? 'Failed to place order', 'error')
        } finally {
            setPlacing(false)
        }
    }

    // Cancel order
    const handleCancel = async (reason: string) => {
        if (!cancelTarget) return
        try {
            await axios.put(`${API}/customer/orders/${cancelTarget.order_id}/cancel`,
                { reason }, { withCredentials: true })
            showToast('Order cancelled', 'success')
            setCancelTarget(null)
            await fetchOrders()
        } catch (err: any) {
            showToast(err.response?.data?.message ?? 'Failed to cancel', 'error')
        }
    }

    // Delete history order
    const handleDeleteOrder = async (order: CustomerOrder) => {
        try {
            await axios.delete(`${API}/customer/orders/${order.order_id}`, { withCredentials: true })
            showToast('Order removed from history', 'success')
            setOrders(prev => prev.filter(o => o.order_id !== order.order_id))
        } catch (err: any) {
            showToast(err.response?.data?.message ?? 'Failed to delete order', 'error')
        }
    }

    // Return request
    const handleReturn = async (reason: string) => {
        if (!returnTarget) return
        try {
            await axios.post(`${API}/customer/orders/${returnTarget.order_id}/return`,
                { reason }, { withCredentials: true })
            showToast('Return request submitted', 'success')
            setReturnTarget(null)
            await fetchOrders()
        } catch (err: any) {
            showToast(err.response?.data?.message ?? 'Failed to submit return', 'error')
        }
    }

    // Filter orders
    const activeOrders = orders.filter(o => !['delivered', 'cancelled', 'returned'].includes(o.order_status))
    const historyOrders = orders.filter(o => ['delivered', 'cancelled', 'returned'].includes(o.order_status))
    const displayOrders = panelTab === 'active' ? activeOrders : historyOrders

    // No station selected
    if (!station) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Droplets size={28} className="text-[#38bdf8]" />
                </div>
                <div>
                    <p className="font-bold text-gray-800 text-lg">No Station Selected</p>
                    <p className="text-sm text-gray-400 mt-1">Go back to the dashboard and pick a water station first.</p>
                </div>
                <button onClick={() => navigate('/customer/dashboard')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0d2a4a] text-white font-bold text-sm hover:bg-[#1a4a7a] transition-all">
                    <ArrowLeft size={15} /> Go to Dashboard
                </button>
            </div>
        )
    }

    // Station banner
    const StationBanner = () => (
        <div className="relative w-full rounded-2xl overflow-hidden mb-5 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d2a4a] to-[#1a4a7a]" />
            {station.image_path && (
                <img src={station.image_path.startsWith('http') ? station.image_path : `${API}${station.image_path}`}
                    className="absolute inset-0 w-full h-full object-cover opacity-20" alt="" />
            )}
            <div className="relative z-10 flex items-center gap-4 px-5 py-4">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Droplets size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-black text-white text-sm leading-tight">{station.station_name}</p>
                    <p className="text-blue-200 text-[11px] flex items-center gap-1 mt-0.5 truncate">
                        <MapPin size={9} />{station.address}
                    </p>
                </div>
                <button onClick={() => { localStorage.removeItem('selected_station'); navigate('/customer/dashboard') }}
                    className="ml-auto shrink-0 text-[10px] font-bold text-blue-300 hover:text-white flex items-center gap-1 transition-colors">
                    Change <ChevronRight size={11} />
                </button>
            </div>
        </div>
    )


    return (
        <div className="flex flex-col gap-5 pb-24 lg:pb-10">
            <StationBanner />

            <div className="flex flex-col lg:flex-row gap-5">

                {/* ══ LEFT: Products / Cart — hidden on mobile when orders panel open */}
                <div className={`flex-1 min-w-0 flex flex-col gap-4 ${showOrdersPanel ? 'hidden lg:flex' : 'flex'}`}>

                    {view === 'products' ? (
                        <>
                            {/* Products header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-black text-gray-800">Available Items</h2>
                                    <p className="text-[11px] text-gray-400">{products.length} products</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={fetchProducts}
                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
                                        <RefreshCw size={13} className={loadingProds ? 'animate-spin' : ''} />
                                    </button>
                                    {/* My Orders button */}
                                    <button onClick={() => setShowOrdersPanel(p => !p)}
                                        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border
                                            ${showOrdersPanel
                                                ? 'bg-[#0d2a4a] text-white border-[#0d2a4a]'
                                                : 'bg-white text-[#0d2a4a] border-gray-200 hover:border-[#0d2a4a]'}`}>
                                        <History size={13} />
                                        <span className="hidden sm:inline">My Orders</span>
                                        {activeOrders.length > 0 && (
                                            <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center shadow
                                                ${showOrdersPanel ? 'bg-[#38bdf8] text-[#0d2a4a]' : 'bg-[#0d2a4a] text-white'}`}>
                                                {activeOrders.length}
                                            </span>
                                        )}
                                    </button>
                                    {/* Cart button */}
                                    <button onClick={() => setView('cart')}
                                        className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white text-xs font-bold border border-transparent transition-all active:scale-95">
                                        <ShoppingCart size={13} />
                                        <span className="hidden sm:inline">Cart</span>
                                        {cartItemCount > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#38bdf8] text-[#0d2a4a] text-[9px] font-black flex items-center justify-center shadow">
                                                {cartItemCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Products grid */}
                            {loadingProds ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                                            <div className="aspect-square bg-gray-100" />
                                            <div className="p-3 flex flex-col gap-2">
                                                <div className="h-3 bg-gray-100 rounded w-3/4" />
                                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                                                <div className="h-8 bg-gray-100 rounded-xl" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : products.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-16 text-center bg-white rounded-2xl border border-gray-100">
                                    <Package size={28} className="text-gray-300" />
                                    <p className="text-sm text-gray-400">No products available at this station.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {products.map((product, i) => {
                                        const inCart = getQtyInCart(product.product_id)
                                        const outOfStock = product.quantity <= 0
                                        const imgSrc = product.image_url
                                            ? product.image_url.startsWith('http') ? product.image_url : `${API}${product.image_url}`
                                            : null
                                        return (
                                            <div key={product.product_id}
                                                className={`animate-fade-in-up bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col transition-all
                                                    ${outOfStock ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-0.5'}
                                                    ${inCart > 0 ? 'border-[#0d2a4a]' : 'border-gray-100'}`}
                                                style={{ animationDelay: `${i * 60}ms` }}>
                                                <div className="relative aspect-square bg-gradient-to-br from-[#e8f4fd] to-[#dbeeff] overflow-hidden">
                                                    {imgSrc ? (
                                                        <img src={imgSrc} alt={product.product_name}
                                                            className="w-full h-full object-cover"
                                                            onError={e => { e.currentTarget.style.display = 'none' }} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Droplets size={28} className="text-[#38bdf8]/40" />
                                                        </div>
                                                    )}
                                                    <div className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-lg
                                                        ${outOfStock ? 'bg-red-500 text-white' : product.quantity <= 5 ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'}`}>
                                                        {outOfStock ? 'OUT' : `${product.quantity}`}
                                                    </div>
                                                    {inCart > 0 && (
                                                        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#0d2a4a] flex items-center justify-center">
                                                            <span className="text-[9px] font-black text-white">{inCart}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 flex flex-col gap-2 flex-1">
                                                    <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-2">{product.product_name}</p>
                                                    <p className="text-sm font-black text-[#0d2a4a]">{fmt(product.price)}</p>
                                                    {inCart > 0 ? (
                                                        <div className="flex items-center justify-between gap-2 mt-auto">
                                                            <button onClick={() => updateQty(product.product_id, -1)}
                                                                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95">
                                                                <Minus size={11} />
                                                            </button>
                                                            <QtyInput value={inCart} max={product.quantity} size="sm"
                                                                onChange={v => setQtyDirect(product.product_id, v, product.quantity)} />
                                                            <button onClick={() => updateQty(product.product_id, 1)}
                                                                disabled={inCart >= product.quantity}
                                                                className="w-7 h-7 rounded-lg bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40">
                                                                <Plus size={11} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => addToCart(product)} disabled={outOfStock}
                                                            className="mt-auto w-full py-2 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-40">
                                                            <ShoppingCart size={11} />
                                                            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        // CART & CHECKOUT
                        <>
                            <button onClick={() => setView('products')}
                                className="flex items-center gap-1.5 text-sm font-bold text-[#0d2a4a] hover:text-[#38bdf8] transition-colors w-fit">
                                <ArrowLeft size={15} /> Continue Shopping
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Cart items */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-gray-800">Cart</h3>
                                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                            {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center gap-3 py-12 bg-white rounded-2xl border border-gray-100 text-center">
                                            <ShoppingCart size={24} className="text-gray-300" />
                                            <p className="text-sm text-gray-400">Cart is empty</p>
                                        </div>
                                    ) : cart.map(item => {
                                        const imgSrc = item.image_url
                                            ? item.image_url.startsWith('http') ? item.image_url : `${API}${item.image_url}`
                                            : null
                                        return (
                                            <div key={item.product_id}
                                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                                                <div className="w-14 h-14 rounded-xl bg-[#e8f4fd] flex items-center justify-center shrink-0 overflow-hidden">
                                                    {imgSrc
                                                        ? <img src={imgSrc} alt={item.product_name} className="w-full h-full object-cover" />
                                                        : <Droplets size={18} className="text-[#38bdf8]/50" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-800 truncate">{item.product_name}</p>
                                                    <p className="text-[10px] text-gray-400">{fmt(item.price)} each</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <button onClick={() => updateQty(item.product_id, -1)}
                                                            className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center active:scale-95 transition-all">
                                                            <Minus size={10} />
                                                        </button>
                                                        <QtyInput value={item.qty} max={item.quantity} size="xs"
                                                            onChange={v => setQtyDirect(item.product_id, v, item.quantity)} />
                                                        <button onClick={() => updateQty(item.product_id, 1)}
                                                            disabled={item.qty >= item.quantity}
                                                            className="w-6 h-6 rounded-lg bg-[#0d2a4a] text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-40">
                                                            <Plus size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs font-black text-[#0d2a4a]">{fmt(item.price * item.qty)}</p>
                                                    <button onClick={() => removeFromCart(item.product_id)}
                                                        className="mt-1 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Order summary + payment */}
                                <div className="flex flex-col gap-3">
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
                                        <h3 className="text-sm font-black text-gray-800">Order Summary</h3>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Subtotal</span>
                                            <span className="font-bold text-gray-800">{fmt(cartTotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Delivery Fee</span>
                                            <span className="font-bold text-emerald-500">FREE</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between items-center">
                                            <span className="text-sm font-black text-gray-800">Total</span>
                                            <span className="text-lg font-black text-[#0d2a4a]">{fmt(cartTotal)}</span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
                                        <h3 className="text-sm font-black text-gray-800">Payment Method</h3>
                                        {([
                                            { mode: 'gcash', label: 'GCash', sub: 'Pay via GCash and upload receipt', color: 'bg-blue-500' },
                                            { mode: 'cash_on_delivery', label: 'Cash on Delivery', sub: 'Pay when you receive the order', color: 'bg-emerald-500' },
                                            { mode: 'cash_on_pickup', label: 'Cash on Pickup', sub: 'Pick up and pay at the station', color: 'bg-amber-500' },
                                        ] as const).map(({ mode, label, sub, color }) => (
                                            <button key={mode} onClick={() => setPayMode(mode)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                                                    ${payMode === mode ? 'border-[#0d2a4a] bg-[#0d2a4a]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                                                <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                                                    {mode === 'gcash'
                                                        ? <Smartphone size={16} className="text-white" />
                                                        : <Banknote size={16} className="text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-gray-800">{label}</p>
                                                    <p className="text-[10px] text-gray-400">{sub}</p>
                                                </div>
                                                {payMode === mode && <CheckCircle2 size={15} className="text-[#0d2a4a] shrink-0" />}
                                            </button>
                                        ))}

                                        {payMode === 'gcash' && (
                                            <div className="flex flex-col gap-2">
                                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-600 flex flex-col gap-2">
                                                    <p className="font-bold">GCash Instructions:</p>
                                                    <ol className="list-decimal list-inside flex flex-col gap-0.5">
                                                        <li>Scan the QR code below or send to:{' '}
                                                            <strong className="text-blue-800 text-xs">
                                                                {station.contact_number ?? '—'}
                                                            </strong>
                                                        </li>
                                                        <li>Screenshot your GCash receipt</li>
                                                        <li>Upload the screenshot below</li>
                                                    </ol>
                                                    {/* QR code image */}
                                                    {station.qr_code_path && (
                                                        <div className="flex flex-col items-center gap-1.5 pt-1">
                                                            <div className="relative bg-white rounded-xl border border-blue-200 p-2 shadow-sm">
                                                                <img
                                                                    src={station.qr_code_path.startsWith('http') ? station.qr_code_path : `${API}${station.qr_code_path}`}
                                                                    alt="GCash QR Code"
                                                                    className="w-36 h-36 object-contain"
                                                                />
                                                                <button
                                                                    onClick={() => setQrExpanded(true)}
                                                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center shadow transition-all">
                                                                    <Maximize2 size={11} className="text-white" />
                                                                </button>
                                                            </div>
                                                            <p className="text-[10px] text-blue-500 font-semibold">Scan with GCash app</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div onClick={() => fileRef.current?.click()}
                                                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
                                                        ${receiptPreview ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300 hover:border-[#38bdf8] hover:bg-blue-50'}`}>
                                                    {receiptPreview ? (
                                                        <div className="relative">
                                                            <img src={receiptPreview} alt="Receipt" className="w-full max-h-36 object-contain rounded-lg" />
                                                            <button onClick={e => { e.stopPropagation(); setReceipt(null); setReceiptPreview(null) }}
                                                                className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow transition-all">
                                                                <X size={11} className="text-white" />
                                                            </button>
                                                            <button onClick={e => { e.stopPropagation(); setReceiptExpanded(true) }}
                                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center shadow transition-all">
                                                                <Maximize2 size={11} className="text-white" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Upload size={18} className="text-gray-400 mx-auto mb-1" />
                                                            <p className="text-xs font-bold text-gray-500">Upload Receipt</p>
                                                        </>
                                                    )}
                                                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptPick} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button onClick={handlePlaceOrder} disabled={placing || cart.length === 0}
                                        className="w-full py-3.5 rounded-2xl bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white font-black text-sm transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg">
                                        {placing
                                            ? <><Loader2 size={15} className="animate-spin" /> Placing Order…</>
                                            : <><CheckCircle2 size={15} /> Confirm Order</>}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ══ RIGHT: Orders Panel — full width on mobile, sidebar on desktop */}
                {showOrdersPanel && (
                    <div className="flex-1 lg:flex-none lg:w-80 xl:w-96 flex flex-col gap-3 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {/* Back button — mobile only */}
                                <button
                                    onClick={() => setShowOrdersPanel(false)}
                                    className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-all">
                                    <ArrowLeft size={15} />
                                </button>
                                <h2 className="text-sm font-black text-gray-800">My Orders</h2>
                            </div>
                            <button onClick={fetchOrders}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
                                <RefreshCw size={13} className={loadingOrders ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {/* Tab toggle */}
                        <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                            <button onClick={() => setPanelTab('active')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all
                                    ${panelTab === 'active' ? 'bg-[#0d2a4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Zap size={11} /> Active
                                {activeOrders.length > 0 && (
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full
                                        ${panelTab === 'active' ? 'bg-[#38bdf8] text-[#0d2a4a]' : 'bg-gray-200 text-gray-600'}`}>
                                        {activeOrders.length}
                                    </span>
                                )}
                            </button>
                            <button onClick={() => setPanelTab('history')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all
                                    ${panelTab === 'history' ? 'bg-[#0d2a4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <History size={11} /> History
                                {historyOrders.length > 0 && (
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full
                                        ${panelTab === 'history' ? 'bg-[#38bdf8] text-[#0d2a4a]' : 'bg-gray-200 text-gray-600'}`}>
                                        {historyOrders.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Orders list — scrollable */}
                        <div className="flex flex-col gap-2 lg:overflow-y-auto"
                            style={{ maxHeight: 'calc(100vh - 300px)' }}>
                            {loadingOrders ? (
                                <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-xs">Loading orders…</span>
                                </div>
                            ) : displayOrders.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-10 text-center bg-white rounded-2xl border border-gray-100">
                                    {panelTab === 'active'
                                        ? <><Zap size={22} className="text-gray-300" /><p className="text-xs text-gray-400">No active orders</p></>
                                        : <><History size={22} className="text-gray-300" /><p className="text-xs text-gray-400">No order history yet</p></>}
                                </div>
                            ) : displayOrders.map((order, i) => (
                                <div key={order.order_id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                                    <OrderCard
                                        order={order}
                                        onOpen={() => openOrderDetail(order)}
                                        onDelete={panelTab === 'history' ? handleDeleteOrder : undefined}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {detailOrder && (
                <OrderDetailModal
                    order={detailOrder}
                    onClose={() => setDetailOrder(null)}
                    onCancel={o => { setDetailOrder(null); setCancelTarget(o) }}
                    onReturn={o => { setDetailOrder(null); setReturnTarget(o) }}
                />
            )}

            {/* Cancel Modal */}
            {cancelTarget && (
                <CancelModal
                    order={cancelTarget}
                    onClose={() => setCancelTarget(null)}
                    onConfirm={handleCancel}
                />
            )}

            {/* Return Modal */}
            {returnTarget && (
                <ReturnModal
                    order={returnTarget}
                    onClose={() => setReturnTarget(null)}
                    onConfirm={handleReturn}
                />
            )}

            {/* QR Code Lightbox */}
            {qrExpanded && station?.qr_code_path && (
                <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/90"
                    onClick={() => setQrExpanded(false)}>
                    <div className="relative flex flex-col items-center gap-4 px-4 w-full max-w-sm"
                        onClick={e => e.stopPropagation()}>
                        <img
                            src={station.qr_code_path.startsWith('http') ? station.qr_code_path : `${API}${station.qr_code_path}`}
                            alt="GCash QR Code"
                            className="w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl bg-white p-4" />
                        <a
                            href={station.qr_code_path.startsWith('http') ? station.qr_code_path : `${API}${station.qr_code_path}`}
                            download="gcash-qr-code"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#0d2a4a] font-bold text-sm shadow-lg hover:bg-gray-100 transition-all active:scale-95">
                            <Download size={15} /> Download QR Code
                        </a>
                    </div>
                    <button onClick={() => setQrExpanded(false)}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                        <X size={18} className="text-white" />
                    </button>
                </div>
            )}

            {/* Receipt Lightbox */}
            {receiptExpanded && receiptPreview && (
                <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/90"
                    onClick={() => setReceiptExpanded(false)}>
                    <div className="relative flex flex-col items-center gap-4 px-4 w-full max-w-lg"
                        onClick={e => e.stopPropagation()}>
                        <img src={receiptPreview} alt="GCash Receipt"
                            className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl" />
                        <a
                            href={receiptPreview}
                            download="gcash-receipt"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#0d2a4a] font-bold text-sm shadow-lg hover:bg-gray-100 transition-all active:scale-95">
                            <Download size={15} /> Download Receipt
                        </a>
                    </div>
                    <button onClick={() => setReceiptExpanded(false)}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                        <X size={18} className="text-white" />
                    </button>
                </div>
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    )
}