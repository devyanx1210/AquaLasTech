// AdminCustomerOrder - view and manage incoming customer orders
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import {
    Search, Eye, CheckCircle2, XCircle,
    Truck, RefreshCw, Loader2, ChevronDown,
    X, Droplets, ImageIcon, ExternalLink, RotateCcw,
    History, ShoppingBag, ChevronRight, Printer, Trash2,
    Filter, CreditCard,
} from 'lucide-react'
import { FaMoneyBillWave, FaMobileAlt } from 'react-icons/fa'

// Types
interface Order {
    order_id: number
    order_reference: string
    customer_name: string
    customer_email: string
    customer_contact: string | null
    customer_address: string | null
    full_address: string | null
    total_amount: number
    payment_mode: 'gcash' | 'cash' | 'cash_on_delivery' | 'cash_on_pickup'
    order_status: 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned'
    payment_type: string
    payment_status: 'pending' | 'verified' | 'rejected' | 'not_required'
    proof_image_path: string | null
    return_reason: string | null
    return_status: 'pending' | 'approved' | 'rejected' | null
    return_id: number | null
    item_count: number
    created_at: string
    profile_picture: string | null
    // Audit fields
    pos_by_name: string | null
    verified_by_name: string | null
    return_processed_by_name: string | null
}

interface OrderDetail extends Order {
    items: {
        order_item_id: number
        product_id: number
        product_name: string
        unit: string
        image_url: string | null
        quantity: number
        price_snapshot: number
    }[]
}

// Toast
interface ToastData { message: string; type: 'success' | 'error' }
const Toast = ({ toast, onDone }: { toast: ToastData; onDone: () => void }) => {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
    return (
        <div className="fixed bottom-6 right-6 z-[999] px-4 py-3 rounded-xl shadow-md bg-white text-sm font-medium text-gray-700">
            {toast.message}
        </div>
    )
}

// Helpers
const fmt = (p: number) => `₱${Number(p).toFixed(2)}`

// Split date and time so they never get squished together
const formatDateParts = (d: string) => {
    const date = new Date(d)
    const datePart = date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    const timePart = date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
    return { datePart, timePart }
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: any; btnBg: string }> = {
    confirmed: { label: 'Confirmed', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400', icon: CheckCircle2, btnBg: 'bg-blue-600' },
    out_for_delivery: { label: 'Out for Delivery', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-400', icon: Truck, btnBg: 'bg-purple-600' },
    cancelled: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400', icon: XCircle, btnBg: 'bg-red-500' },
    delivered: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2, btnBg: 'bg-emerald-600' },
    returned: { label: 'Returned', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', dot: 'bg-gray-400', icon: RotateCcw, btnBg: 'bg-gray-500' },
}

const PAY_CFG: Record<string, { label: string; color: string; bg: string; border: string; solidBg: string }> = {
    pending: { label: 'Unpaid', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', solidBg: 'bg-amber-500' },
    verified: { label: 'Paid', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', solidBg: 'bg-emerald-600' },
    rejected: { label: 'Unpaid', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', solidBg: 'bg-red-500' },
    not_required: { label: 'N/A', color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200', solidBg: 'bg-gray-500' },
}

// Returns status display config  shows "Awaiting Payment" for unverified GCash orders
const getStatusDisplay = (order: Pick<Order, 'payment_mode' | 'payment_status' | 'order_status'>) => {
    if (order.payment_mode === 'gcash' && order.payment_status === 'pending') {
        return { label: 'Awaiting Payment', btnBg: 'bg-amber-500', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', icon: FaMobileAlt }
    }
    return STATUS_CFG[order.order_status] ?? STATUS_CFG.confirmed
}

// Compact icon-only dropdown for small screens, full label on desktop
const CompactSelect = ({ value, onChange, options, icon: Icon, darkBg = false }: {
    value: string; onChange: (v: string) => void
    options: { value: string; label: string }[]
    icon: any; darkBg?: boolean
}) => {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const isActive = value !== 'all'
    const current = options.find(o => o.value === value)
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(v => !v)}
                className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all
                    ${darkBg ? 'bg-[#0d2a4a] text-white' : 'bg-white border border-gray-200 text-gray-700 shadow-sm'}`}>
                <Icon size={13} />
                <span className="hidden sm:inline whitespace-nowrap">{current?.label}</span>
                <ChevronDown size={11} className="hidden sm:inline" />
                {isActive && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-400 sm:hidden" />}
            </button>
            {open && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                    {options.map(o => (
                        <button key={o.value}
                            onClick={() => { onChange(o.value); setOpen(false) }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-gray-50
                                ${o.value === value ? 'font-bold text-[#0d2a4a] bg-blue-50' : 'text-gray-700'}`}>
                            {o.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// buildDeliveryHtml  pure function, no side effects
const buildDeliveryHtml = (deliveryOrders: Order[], stationName: string) => {
    const now = new Date().toLocaleString('en-PH', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
    const rows = deliveryOrders.map((o, i) => {
        const { datePart, timePart } = formatDateParts(o.created_at)
        const payLabel = o.payment_mode === 'gcash' ? 'GCash'
            : o.payment_mode === 'cash_on_delivery' ? 'Cash on Delivery'
                : o.payment_mode === 'cash_on_pickup' ? 'Cash on Pickup'
                    : 'Cash'
        const addrLine = o.full_address
            ? `${o.full_address}`
            : (o.customer_address || '—')
        const areaLine = o.full_address && o.customer_address
            ? `<span class="small">${o.customer_address}</span>` : ''
        return `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${o.order_reference}</strong></td>
            <td>${o.customer_name || 'Walk-in'}</td>
            <td>${o.customer_contact || '—'}</td>
            <td class="addr">${addrLine}${areaLine ? '<br/>' + areaLine : ''}</td>
            <td>${datePart}<br/><span class="small">${timePart}</span></td>
            <td>${payLabel}</td>
            <td>${fmt(o.total_amount)}</td>
        </tr>`
    }).join('')
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>Delivery List — ${stationName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:12px; color:#111; padding:20px; }
  h1 { font-size:18px; font-weight:bold; margin-bottom:2px; }
  .sub { font-size:11px; color:#666; margin-bottom:16px; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:#0d2a4a; color:white; }
  th { padding:9px 10px; text-align:left; font-size:11px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; }
  td { padding:9px 10px; border-bottom:1px solid #e5e7eb; vertical-align:top; }
  tr:nth-child(even) td { background:#f9fafb; }
  .addr { max-width:180px; word-wrap:break-word; }
  .small { color:#888; font-size:10px; }
  .footer { margin-top:20px; font-size:10px; color:#999; text-align:right; }
  @media print { body { padding:0; } }
</style></head>
<body>
  <h1>${stationName || 'AquaLasTech'} — Out for Delivery</h1>
  <p class="sub">Printed: ${now} &nbsp;·&nbsp; ${deliveryOrders.length} order(s)</p>
  <table>
    <thead><tr>
      <th>#</th><th>Order Ref</th><th>Customer</th><th>Contact</th>
      <th>Address</th><th>Date</th><th>Payment</th><th>Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Generated by AquaLasTech</div>
</body></html>`
}

// GCash Verify Modal
const GCashModal = ({ order, onClose, onVerify, API }: {
    order: OrderDetail; onClose: () => void
    onVerify: (id: number, status: 'verified' | 'rejected') => Promise<void>; API: string
}) => {
    const [busy, setBusy] = useState(false)
    const handle = async (status: 'verified' | 'rejected') => {
        setBusy(true); await onVerify(order.order_id, status); setBusy(false); onClose()
    }
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-400">{order.order_reference}</p>
                        <h3 className="text-sm font-bold text-gray-800">Verify GCash Payment</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15} /></button>
                </div>
                <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <span className="text-xs text-gray-500">Order Total</span>
                        <span className="text-lg font-black text-[#0d2a4a]">{fmt(order.total_amount)}</span>
                    </div>
                    {order.proof_image_path ? (
                        <div className="flex flex-col gap-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">GCash Receipt</p>
                            <div className="rounded-xl overflow-hidden border border-gray-200 relative">
                                <img src={order.proof_image_path.startsWith('http') ? order.proof_image_path : `${API}${order.proof_image_path}`}
                                    alt="GCash Receipt" className="w-full max-h-56 object-contain bg-gray-50" />
                                <a href={order.proof_image_path.startsWith('http') ? order.proof_image_path : `${API}${order.proof_image_path}`}
                                    target="_blank" rel="noreferrer"
                                    className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-lg p-1.5 shadow-sm transition-all">
                                    <ExternalLink size={12} className="text-gray-600" />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-600">
                            <ImageIcon size={14} /> No receipt uploaded yet — cannot verify
                        </div>
                    )}
                    {order.payment_status === 'pending' && order.proof_image_path && (
                        <div className="flex gap-2">
                            <button onClick={() => handle('rejected')} disabled={busy}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center justify-center disabled:opacity-60">
                                Reject
                            </button>
                            <button onClick={() => handle('verified')} disabled={busy}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                                {busy && <Loader2 size={13} className="animate-spin" />}
                                Verify
                            </button>
                        </div>
                    )}
                    {order.payment_status !== 'pending' && (
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold border ${PAY_CFG[order.payment_status]?.bg} ${PAY_CFG[order.payment_status]?.color} ${PAY_CFG[order.payment_status]?.border}`}>
                            <CheckCircle2 size={13} /> Payment already {order.payment_status}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Return Modal 
const ReturnModal = ({ order, onClose, onResolve }: {
    order: OrderDetail; onClose: () => void
    onResolve: (id: number, status: 'approved' | 'rejected') => Promise<void>
}) => {
    const [busy, setBusy] = useState(false)
    const handle = async (status: 'approved' | 'rejected') => {
        setBusy(true); await onResolve(order.order_id, status); setBusy(false); onClose()
    }
    const isResolved = order.return_status === 'approved' || order.return_status === 'rejected'
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-400">{order.order_reference}</p>
                        <h3 className="text-sm font-bold text-gray-800">Return Request</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15} /></button>
                </div>
                <div className="p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Customer's Reason</p>
                        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-sm text-gray-700 leading-relaxed">
                            {order.return_reason || 'No reason provided'}
                        </div>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 text-xs">
                        <span className="text-gray-500">Order Total</span>
                        <span className="font-black text-[#0d2a4a]">{fmt(order.total_amount)}</span>
                    </div>
                    {isResolved ? (
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold border
                            ${order.return_status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                            {order.return_status === 'approved'
                                ? <><CheckCircle2 size={13} /> Return approved</>
                                : <><XCircle size={13} /> Return rejected — order restored to delivering</>}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <p className="text-[10px] text-gray-400">Approving confirms the return. Rejecting restores the order to delivering.</p>
                            <div className="flex gap-2">
                                <button onClick={() => handle('rejected')} disabled={busy}
                                    className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold border border-red-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                                    <XCircle size={13} /> Reject Return
                                </button>
                                <button onClick={() => handle('approved')} disabled={busy}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                                    {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                    Approve Return
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Order Detail Modal
const OrderModal = ({ order, onClose, onStatusChange, onOpenGCash, onOpenReturn, API }: {
    order: OrderDetail; onClose: () => void
    onStatusChange: (id: number, status: string) => Promise<void>
    onOpenGCash: () => void; onOpenReturn: () => void; API: string
}) => {
    const status = getStatusDisplay(order)
    const payment = PAY_CFG[order.payment_status] ?? PAY_CFG.pending
    const [busy, setBusy] = useState(false)
    const { datePart, timePart } = formatDateParts(order.created_at)

    const nextStatuses: Record<string, string[]> = {
        confirmed: ['out_for_delivery', 'cancelled'],
        preparing: ['out_for_delivery', 'cancelled'],
        out_for_delivery: ['delivered', 'cancelled'],
        delivered: [],
        cancelled: [],
        returned: [],
    }
    const isOnline = order.payment_mode === 'gcash'
    const needsGcashVerify = isOnline && order.payment_status === 'pending'
    // Don't allow status changes until GCash is verified
    const available = needsGcashVerify ? [] : nextStatuses[order.order_status] ?? []
    const hasReturn = !!order.return_id

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <p className="text-[10px] text-gray-400 font-mono">{order.order_reference}</p>
                        <h2 className="text-sm font-bold text-gray-800">{order.customer_name || 'Walk-in'}</h2>
                        <p className="text-[10px] text-gray-400 mt-0.5">{datePart} · {timePart}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold text-white ${status.btnBg}`}>
                            <status.icon size={11} /> {status.label}
                        </span>
                        {isOnline ? (
                            <button onClick={onOpenGCash}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold text-white transition-all hover:opacity-80 ${payment.solidBg}`}>
                                <FaMobileAlt size={10} /> GCash · {payment.label}
                                {needsGcashVerify && <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse ml-0.5" />}
                            </button>
                        ) : (
                            <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold text-white ${payment.solidBg}`}>
                                <FaMoneyBillWave size={10} /> Cash · {payment.label}
                            </span>
                        )}
                        {hasReturn && (
                            <button onClick={onOpenReturn}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all hover:opacity-80
                                    ${order.return_status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                        order.return_status === 'rejected' ? 'bg-red-50 text-red-500 border border-red-200' :
                                            'bg-orange-50 text-orange-500 animate-pulse'}`}>
                                <RotateCcw size={10} />
                                Return · {order.return_status === 'pending' ? 'Review Required' :
                                    order.return_status === 'approved' ? 'Approved' :
                                        order.return_status === 'rejected' ? 'Rejected' : order.return_status}
                            </button>
                        )}
                        <span className="ml-auto text-base font-black text-[#0d2a4a]">{fmt(order.total_amount)}</span>
                    </div>
                    {needsGcashVerify && (
                        <button onClick={onOpenGCash}
                            className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-xl text-xs text-amber-700 font-semibold hover:bg-amber-100 transition-all">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            GCash payment pending verification. Click here to review receipt.
                            <ChevronRight size={13} className="ml-auto shrink-0" />
                        </button>
                    )}
                    <div className="rounded-xl overflow-hidden border border-gray-100">
                        <div className="px-4 py-2.5 bg-[#e8f4fd] border-b border-[#d0e8f7]">
                            <p className="text-[10px] font-bold text-[#0d2a4a]/60 uppercase tracking-wider">Order Items</p>
                        </div>
                        {order.items?.map(item => (
                            <div key={item.order_item_id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                <div className="w-9 h-9 rounded-xl bg-[#e8f4fd] flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.image_url
                                        ? <img src={item.image_url.startsWith('http') ? item.image_url : `${API}${item.image_url}`}
                                            alt={item.product_name} className="w-full h-full object-cover" />
                                        : <Droplets size={14} className="text-[#38bdf8]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 truncate">{item.product_name}</p>
                                    <p className="text-[10px] text-gray-400">{item.unit} · {fmt(item.price_snapshot)} each</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-black text-[#0d2a4a]">{fmt(item.price_snapshot * item.quantity)}</p>
                                    <p className="text-[10px] text-gray-400">x{item.quantity}</p>
                                </div>
                            </div>
                        ))}
                        <div className="px-4 py-2.5 bg-[#0d2a4a] flex justify-between items-center">
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Total</p>
                            <p className="text-sm font-black text-white">{fmt(order.total_amount)}</p>
                        </div>
                    </div>
                    {/* Audit trail */}
                    {(order.pos_by_name || order.verified_by_name || order.return_processed_by_name) && (
                        <div className="rounded-xl border border-gray-100 overflow-hidden">
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Processed By</p>
                            </div>
                            <div className="flex flex-col divide-y divide-gray-50">
                                {order.pos_by_name && (
                                    <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                                        <span className="text-gray-400">POS Transaction</span>
                                        <span className="font-semibold text-gray-700">{order.pos_by_name}</span>
                                    </div>
                                )}
                                {order.verified_by_name && (
                                    <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                                        <span className="text-gray-400">GCash Verified by</span>
                                        <span className="font-semibold text-gray-700">{order.verified_by_name}</span>
                                    </div>
                                )}
                                {order.return_processed_by_name && (
                                    <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                                        <span className="text-gray-400">Return {order.return_status === 'approved' ? 'Approved' : 'Rejected'} by</span>
                                        <span className="font-semibold text-gray-700">{order.return_processed_by_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {available.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Update Status</p>
                            <div className="flex gap-2 flex-wrap">
                                {available.map(s => {
                                    const cfg = STATUS_CFG[s]
                                    return (
                                        <button key={s}
                                            onClick={async () => { setBusy(true); await onStatusChange(order.order_id, s); setBusy(false) }}
                                            disabled={busy}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-60 hover:opacity-85 ${cfg.btnBg}`}>
                                            {busy && <Loader2 size={11} className="animate-spin" />}
                                            Mark as {cfg.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Order Row
const OrderRow = ({ order, onOpen, showCheckbox, isSelected, onToggle, delay = 0, API }: {
    order: Order; onOpen: () => void; delay?: number; API: string
    showCheckbox?: boolean; isSelected?: boolean; onToggle?: () => void
}) => {
    const status = getStatusDisplay(order)
    const payment = PAY_CFG[order.payment_status] ?? PAY_CFG.pending
    const isGcashPending = order.payment_mode === 'gcash' && order.payment_status === 'pending'
    const { datePart, timePart } = formatDateParts(order.created_at)
    const avatarSrc = order.profile_picture
        ? (order.profile_picture.startsWith('http') ? order.profile_picture : `${API}${order.profile_picture}`)
        : null

    return (
        <tr className={`animate-fade-in-up transition-colors cursor-pointer border-b border-gray-100 last:border-0 ${isSelected ? 'bg-blue-50' : 'hover:bg-blue-50/30'}`} style={{ animationDelay: `${delay}ms` }} onClick={onOpen}>
            {/* Checkbox (select mode) */}
            {showCheckbox && (
                <td className="w-10 px-3 py-3.5 border-r border-gray-100 text-center" onClick={e => { e.stopPropagation(); onToggle?.() }}>
                    <input type="checkbox" checked={!!isSelected} onChange={() => { }}
                        className="w-4 h-4 rounded accent-[#0d2a4a] cursor-pointer" />
                </td>
            )}
            {/* Customer — first column */}
            <td className="px-4 py-3.5 border-r border-gray-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#e8f4fd] flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                        {avatarSrc
                            ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                            : <Droplets size={13} className="text-[#38bdf8]" />}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-xs leading-tight truncate">{order.customer_name || 'Walk-in'}</p>
                        {order.customer_address
                            ? <p className="text-[10px] text-gray-500 leading-tight mt-0.5 max-w-[120px] truncate">{order.customer_address}</p>
                            : <p className="text-[10px] text-gray-400 truncate max-w-[110px]">{order.customer_email || '—'}</p>}
                    </div>
                </div>
            </td>

            {/* Order ref */}
            <td className="px-4 py-3.5 border-r border-gray-100">
                <p className="font-bold text-gray-800 text-xs font-mono leading-tight">{order.order_reference}</p>
                <p className="text-[10px] text-gray-400">{order.item_count} item(s)</p>
            </td>

            {/* Date — two lines so it never squishes */}
            <td className="px-4 py-3.5 border-r border-gray-100 whitespace-nowrap">
                <p className="text-xs text-gray-700 font-medium leading-tight">{datePart}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{timePart}</p>
            </td>

            {/* Type */}
            <td className="px-4 py-3.5 border-r border-gray-100 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                    {order.payment_mode === 'gcash' ? 'GCash'
                        : order.payment_mode === 'cash_on_delivery' ? 'Cash on Delivery'
                            : order.payment_mode === 'cash_on_pickup' ? 'Cash on Pickup'
                                : order.payment_mode === 'cash' ? 'Cash'
                                    : order.payment_mode}
                </span>
            </td>

            {/* Total */}
            <td className="px-4 py-3.5 border-r border-gray-100 text-center">
                <span className="font-black text-gray-800 text-xs whitespace-nowrap">{fmt(order.total_amount)}</span>
            </td>

            {/* Payment */}
            <td className="px-4 py-3.5 border-r border-gray-100 text-center">
                {isGcashPending ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-amber-500 px-2 py-1 rounded-lg whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" /> Pending
                    </span>
                ) : (
                    <span className={`inline-flex text-[10px] font-bold text-white px-2 py-1 rounded-lg whitespace-nowrap ${payment.solidBg}`}>{payment.label}</span>
                )}
                {order.return_id && (
                    <span className={`block text-[9px] font-bold mt-0.5 whitespace-nowrap
                        ${order.return_status === 'pending' ? 'text-orange-500 animate-pulse' :
                            order.return_status === 'approved' ? 'text-emerald-600' :
                                order.return_status === 'rejected' ? 'text-red-400' : 'text-orange-500'}`}>
                        {order.return_status === 'pending' ? 'Return Pending' :
                            order.return_status === 'approved' ? 'Return Approved' :
                                order.return_status === 'rejected' ? 'Return Rejected' : 'Return Req.'}
                    </span>
                )}
            </td>

            {/* Status */}
            <td className="px-4 py-3.5 border-r border-gray-100 text-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white whitespace-nowrap ${status.btnBg}`}>
                    {status.label}
                </span>
            </td>

            {/* View */}
            <td className="px-4 py-3.5 text-center">
                <div className="p-1.5 rounded-lg bg-[#e8f4fd] hover:bg-[#d0e8f7] text-[#0d2a4a] transition-all inline-flex">
                    <Eye size={14} />
                </div>
            </td>
        </tr>
    )
}

export default function AdminCustomerOrder() {
    const { user } = useAuth()
    const API = import.meta.env.VITE_API_URL
    const [searchParams] = useSearchParams()

    const initStatus = searchParams.get('status') ?? 'all'
    const [view, setView] = useState<'active' | 'history'>(['cancelled', 'returned', 'delivered'].includes(initStatus) ? 'history' : 'active')
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState(initStatus)
    const [filterPayment, setFilterPayment] = useState('all')
    const [stationName, setStationName] = useState('')

    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
    const [gcashOrder, setGcashOrder] = useState<OrderDetail | null>(null)
    const [returnOrder, setReturnOrder] = useState<OrderDetail | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)

    const [selectMode, setSelectMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletingSelected, setDeletingSelected] = useState(false)
    const [bulkUpdating, setBulkUpdating] = useState(false)
    const [toast, setToast] = useState<ToastData | null>(null)
    const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type })

    // Fetch station name for print header
    useEffect(() => {
        if (user?.station_id) {
            axios.get(`${API}/stations/${user.station_id}`, { withCredentials: true })
                .then(r => setStationName(r.data?.station_name ?? ''))
                .catch(() => { })
        }
    }, [user])

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        try {
            const params: Record<string, string> = { view }
            // 'returned_cancelled' is a client-side pseudo-filter; don't send to backend
            if (filterStatus !== 'all' && filterStatus !== 'returned_cancelled') params.status = filterStatus
            if (filterPayment !== 'all') params.payment_mode = filterPayment
            if (search) params.search = search
            const res = await axios.get(`${API}/orders`, { params, withCredentials: true })
            setOrders(res.data)
        } catch {
            showToast('Failed to load orders', 'error')
        } finally { setLoading(false) }
    }, [API, view, filterStatus, filterPayment, search])

    useEffect(() => { fetchOrders() }, [fetchOrders])

    useEffect(() => {
        if (view !== 'active') return
        const timer = setInterval(fetchOrders, 30000)
        return () => clearInterval(timer)
    }, [view, fetchOrders])

    const openOrder = async (order: Order) => {
        setLoadingDetail(true)
        try {
            const res = await axios.get(`${API}/orders/${order.order_id}`, { withCredentials: true })
            setSelectedOrder(res.data)
        } catch {
            showToast('Failed to load order details', 'error')
        } finally { setLoadingDetail(false) }
    }

    const refreshOrder = async (id: number) => {
        // Fire both requests in parallel instead of sequentially
        const [detail] = await Promise.all([
            axios.get(`${API}/orders/${id}`, { withCredentials: true }),
            fetchOrders()
        ])
        setSelectedOrder(detail.data)
    }

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await axios.put(`${API}/orders/${id}/status`, { order_status: status }, { withCredentials: true })
            await refreshOrder(id)
        } catch {
            showToast('Failed to update order status', 'error')
        }
    }

    const handlePaymentVerify = async (id: number, payment_status: string) => {
        try {
            await axios.put(`${API}/orders/${id}/payment`, { payment_status }, { withCredentials: true })
            await refreshOrder(id)
        } catch {
            showToast('Failed to update payment status', 'error')
        }
    }

    const handleReturnResolve = async (id: number, return_status: string) => {
        try {
            await axios.put(`${API}/orders/${id}/return`, { return_status }, { withCredentials: true })
            await refreshOrder(id)
        } catch {
            showToast('Failed to process return', 'error')
        }
    }

    const handlePrint = async () => {
        // Open window synchronously (before any await) so the browser does not block it as a popup
        const win = window.open('', '_blank', 'width=1050,height=700')
        if (!win) { showToast('Please allow popups for this site', 'error'); return }
        win.document.write('<p style="font-family:Arial;padding:20px">Loading delivery list...</p>')
        try {
            const res = await axios.get(`${API}/orders`, { params: { view: 'active' }, withCredentials: true })
            const deliveryOrders = (res.data as Order[]).filter(o =>
                o.order_status === 'out_for_delivery'
            )
            if (deliveryOrders.length === 0) {
                win.close()
                showToast('No orders currently out for delivery', 'error')
                return
            }
            win.document.open()
            win.document.write(buildDeliveryHtml(deliveryOrders, stationName))
            win.document.close()
            win.focus()
            setTimeout(() => { win.print(); win.close() }, 300)
        } catch {
            win.close()
            showToast('Failed to load orders for printing', 'error')
        }
    }

    const handleBulkStatusChange = async (newStatus: string) => {
        setBulkUpdating(true)
        try {
            await Promise.all(
                Array.from(selectedIds).map(id =>
                    axios.put(`${API}/orders/${id}/status`, { order_status: newStatus }, { withCredentials: true })
                )
            )
            setSelectedIds(new Set())
            setSelectMode(false)
            await fetchOrders()
        } catch {
            showToast('Failed to update selected orders', 'error')
        } finally { setBulkUpdating(false) }
    }

    const handleDeleteSelected = async () => {
        setDeletingSelected(true)
        try {
            await Promise.all(
                Array.from(selectedIds).map(id =>
                    axios.delete(`${API}/orders/${id}`, { withCredentials: true })
                )
            )
            setSelectedIds(new Set())
            setShowDeleteConfirm(false)
            await fetchOrders()
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } }
            showToast(e.response?.data?.message ?? 'Failed to delete orders', 'error')
        } finally { setDeletingSelected(false) }
    }

    const toggleSelect = (id: number) =>
        setSelectedIds(prev => {
            const s = new Set(prev)
            if (s.has(id)) s.delete(id); else s.add(id)
            return s
        })

    // Client-side filter for 'returned_cancelled' pseudo-status
    const displayed = filterStatus === 'returned_cancelled'
        ? orders.filter(o => o.order_status === 'returned' || o.order_status === 'cancelled')
        : orders

    const allSelected = displayed.length > 0 && displayed.every(o => selectedIds.has(o.order_id))
    const someSelected = selectedIds.size > 0
    const selectedOrders = orders.filter(o => selectedIds.has(o.order_id))
    const allSelectedConfirmed = someSelected && selectedOrders.every(o => o.order_status === 'confirmed')
    const allSelectedOutForDelivery = someSelected && selectedOrders.every(o => o.order_status === 'out_for_delivery')

    return (
        <div className="flex flex-col gap-4 pb-10">
            {toast && <Toast toast={toast} onDone={() => setToast(null)} />}

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="min-w-0">
                    <h1 className="text-xl font-bold text-gray-800">Orders</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Customer orders for your station</p>
                </div>
                <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                    <span className="text-sm font-bold text-[#0d2a4a] bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap">
                        {displayed.length} orders
                    </span>
                    {selectMode ? (
                        <button
                            onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold transition-all shadow-sm whitespace-nowrap">
                            <X size={13} /> Cancel Select
                        </button>
                    ) : (
                        <button
                            onClick={() => setSelectMode(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-all shadow-sm whitespace-nowrap">
                            Select
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white text-xs font-bold transition-all shadow-sm whitespace-nowrap">
                        <Printer size={13} /> Print List
                    </button>
                    <button onClick={fetchOrders} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                        <RefreshCw size={15} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* View toggle + filters */}
            <div className="flex flex-col gap-2">
                {/* Mobile: Active/History on top, search+filters below. Desktop: single row */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm shrink-0 self-start sm:self-auto">
                        <button onClick={() => { setView('active'); setFilterStatus('all'); setSelectedIds(new Set()); setSelectMode(false) }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                ${view === 'active' ? 'bg-[#0d2a4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <ShoppingBag size={12} /> Active
                        </button>
                        <button onClick={() => { setView('history'); setFilterStatus('all'); setSelectedIds(new Set()); setSelectMode(false) }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                ${view === 'history' ? 'bg-[#0d2a4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <History size={12} /> History
                        </button>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative flex-1 min-w-0">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input placeholder="Search order or customer..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/15 transition-all shadow-sm" />
                        </div>
                        <CompactSelect
                            value={filterStatus}
                            onChange={setFilterStatus}
                            icon={Filter}
                            darkBg
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'out_for_delivery', label: 'Out for Delivery' },
                                { value: 'delivered', label: 'Delivered' },
                                { value: 'cancelled', label: 'Cancelled' },
                                { value: 'returned', label: 'Returned' },
                                { value: 'returned_cancelled', label: 'Returns & Cancelled' },
                            ]}
                        />
                        <CompactSelect
                            value={filterPayment}
                            onChange={setFilterPayment}
                            icon={CreditCard}
                            options={[
                                { value: 'all', label: 'All Types' },
                                { value: 'gcash', label: 'GCash' },
                                { value: 'cash_on_delivery', label: 'Cash on Delivery' },
                                { value: 'cash_on_pickup', label: 'Cash on Pickup' },
                                { value: 'cash', label: 'Cash' },
                            ]}
                        />
                    </div>
                </div>

                {/* Bulk action buttons — own row below filters */}
                {selectMode && someSelected && (
                    <div className="flex gap-2 flex-wrap">
                        {allSelectedConfirmed && (
                            <button onClick={() => handleBulkStatusChange('out_for_delivery')} disabled={bulkUpdating}
                                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all whitespace-nowrap disabled:opacity-60">
                                {bulkUpdating ? <Loader2 size={13} className="animate-spin inline mr-1" /> : null}
                                Mark as Out for Delivery ({selectedIds.size})
                            </button>
                        )}
                        {allSelectedOutForDelivery && (
                            <button onClick={() => handleBulkStatusChange('delivered')} disabled={bulkUpdating}
                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all whitespace-nowrap disabled:opacity-60">
                                {bulkUpdating ? <Loader2 size={13} className="animate-spin inline mr-1" /> : null}
                                Mark as Delivered ({selectedIds.size})
                            </button>
                        )}
                        {view === 'history' && (
                            <button onClick={() => setShowDeleteConfirm(true)}
                                className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all whitespace-nowrap">
                                Delete ({selectedIds.size})
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                        <Loader2 size={18} className="animate-spin" /> Loading orders...
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-2">
                        <ShoppingBag size={32} />
                        <p className="text-sm font-medium">
                            {view === 'history' ? 'No order history yet' : 'No active orders today'}
                        </p>
                        {view === 'history' && (
                            <p className="text-xs text-gray-300 text-center max-w-xs">
                                Orders from previous days will appear here once they pass midnight.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-200">
                                    {selectMode && (
                                        <th className="w-10 pl-4 pr-2 py-3 border-r border-gray-200 text-center">
                                            <input type="checkbox" checked={allSelected}
                                                onChange={() => setSelectedIds(allSelected ? new Set() : new Set(displayed.map(o => o.order_id)))}
                                                className="w-4 h-4 rounded accent-[#0d2a4a] cursor-pointer" />
                                        </th>
                                    )}
                                    {['Customer', 'Order', 'Date', 'Type', 'Total', 'Payment', 'Status', ''].map((h, i) => (
                                        <th key={i} className={`px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left whitespace-nowrap
                                            ${i < 7 ? 'border-r border-gray-200' : ''}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {displayed.map((order, i) => (
                                    <OrderRow
                                        key={order.order_id}
                                        order={order}
                                        onOpen={() => openOrder(order)}
                                        delay={i * 40}
                                        showCheckbox={selectMode}
                                        isSelected={selectedIds.has(order.order_id)}
                                        onToggle={() => toggleSelect(order.order_id)}
                                        API={API}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {loadingDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative bg-white rounded-2xl px-8 py-6 flex items-center gap-3 shadow-xl">
                        <Loader2 size={18} className="animate-spin text-[#38bdf8]" />
                        <span className="text-sm text-gray-600 font-medium">Loading order...</span>
                    </div>
                </div>
            )}

            {selectedOrder && !loadingDetail && (
                <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)}
                    onStatusChange={handleStatusChange}
                    onOpenGCash={() => setGcashOrder(selectedOrder)}
                    onOpenReturn={() => setReturnOrder(selectedOrder)}
                    API={API} />
            )}
            {gcashOrder && (
                <GCashModal order={gcashOrder} onClose={() => setGcashOrder(null)}
                    onVerify={handlePaymentVerify} API={API} />
            )}
            {returnOrder && (
                <ReturnModal order={returnOrder} onClose={() => setReturnOrder(null)}
                    onResolve={handleReturnResolve} />
            )}

            {/* Delete Selected Confirm Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => !deletingSelected && setShowDeleteConfirm(false)} />
                    <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-scale-in">
                        <button onClick={() => setShowDeleteConfirm(false)} disabled={deletingSelected}
                            className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-40">
                            <X size={16} />
                        </button>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                <Trash2 size={18} className="text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-gray-800 font-bold text-base">Delete {selectedIds.size} order{selectedIds.size !== 1 ? 's' : ''}?</h2>
                                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                                    This will permanently delete the selected orders. This cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} disabled={deletingSelected}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleDeleteSelected} disabled={deletingSelected}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {deletingSelected ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : <><Trash2 size={14} /> Delete</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}