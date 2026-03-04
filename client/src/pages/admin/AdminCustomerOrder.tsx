import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import {
    Search, Eye, CheckCircle2, XCircle, AlertCircle,
    Clock, Truck, RefreshCw, Loader2, ChevronDown,
    X, Droplets, ImageIcon, ExternalLink, RotateCcw,
    History, ShoppingBag, ChevronRight, Printer,
} from 'lucide-react'
import { FaMoneyBillWave, FaMobileAlt } from 'react-icons/fa'

// ── Types ──────────────────────────────────────────────────────────────────
interface Order {
    order_id: number
    order_reference: string
    customer_name: string
    customer_email: string
    customer_contact: string | null
    total_amount: number
    payment_mode: 'cash' | 'pickup' | 'delivery' | 'gcash'
    order_status: 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned'
    payment_type: string
    payment_status: 'pending' | 'verified' | 'rejected'
    proof_image_path: string | null
    return_reason: string | null
    return_status: 'pending' | 'approved' | 'rejected' | null
    return_id: number | null
    item_count: number
    created_at: string
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

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (p: number) => `₱${Number(p).toFixed(2)}`

// Split date and time so they never get squished together
const formatDateParts = (d: string) => {
    const date = new Date(d)
    const datePart = date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    const timePart = date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
    return { datePart, timePart }
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: any }> = {
    confirmed: { label: 'Confirmed', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400', icon: CheckCircle2 },
    preparing: { label: 'Preparing', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', icon: Clock },
    out_for_delivery: { label: 'Out for Delivery', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-400', icon: Truck },
    cancelled: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400', icon: XCircle },
    delivered: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
    returned: { label: 'Returned', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', dot: 'bg-gray-400', icon: RotateCcw },
}

const PAY_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    verified: { label: 'Paid', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    rejected: { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
}

// ── Print Delivery List ────────────────────────────────────────────────────
const printDeliveryList = (orders: Order[], stationName: string) => {
    const deliveryOrders = orders.filter(o =>
        o.order_status === 'confirmed' || o.order_status === 'preparing' || o.order_status === 'out_for_delivery'
    )
    if (deliveryOrders.length === 0) {
        alert('No confirmed or delivering orders to print.')
        return
    }

    const now = new Date().toLocaleString('en-PH', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })

    const rows = deliveryOrders.map((o, i) => {
        const { datePart, timePart } = formatDateParts(o.created_at)
        const status = STATUS_CFG[o.order_status]
        return `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${o.order_reference}</strong></td>
            <td>${o.customer_name || 'Walk-in'}</td>
            <td>${o.customer_contact || '—'}</td>
            <td>${datePart}<br/><span class="small">${timePart}</span></td>
            <td>${o.payment_mode.toUpperCase()}</td>
            <td>${fmt(o.total_amount)}</td>
            <td><span class="badge badge-${o.order_status}">${status.label}</span></td>
        </tr>`
    }).join('')

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Delivery List — ${stationName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 20px; }
  h1 { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
  .sub { font-size: 11px; color: #666; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #0d2a4a; color: white; }
  th { padding: 9px 10px; text-align: left; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
  td { padding: 9px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) td { background: #f9fafb; }
  .small { color: #888; font-size: 10px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; }
  .badge-confirmed  { background: #dbeafe; color: #1d4ed8; }
  .badge-preparing  { background: #fef3c7; color: #d97706; }
  .badge-out_for_delivery { background: #ede9fe; color: #7c3aed; }
  .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: right; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>${stationName || 'AquaLasTech'} — Delivery List</h1>
  <p class="sub">Printed: ${now} &nbsp;·&nbsp; ${deliveryOrders.length} order(s)</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Order Ref</th>
        <th>Customer</th>
        <th>Contact</th>
        <th>Date</th>
        <th>Payment</th>
        <th>Total</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Generated by AquaLasTech</div>
</body>
</html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
}

// ── GCash Verify Modal ─────────────────────────────────────────────────────
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
                                className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold border border-red-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                                <XCircle size={13} /> Reject
                            </button>
                            <button onClick={() => handle('verified')} disabled={busy}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                                {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                Verify & Confirm
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

// ── Return Modal ───────────────────────────────────────────────────────────
const ReturnModal = ({ order, onClose, onResolve }: {
    order: OrderDetail; onClose: () => void
    onResolve: (id: number, status: 'approved' | 'rejected') => Promise<void>
}) => {
    const [busy, setBusy] = useState(false)
    const handle = async (status: 'approved' | 'rejected') => {
        setBusy(true); await onResolve(order.order_id, status); setBusy(false); onClose()
    }
    const isResolved = order.return_status && order.return_status !== 'pending'
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

// ── Order Detail Modal ─────────────────────────────────────────────────────
const OrderModal = ({ order, onClose, onStatusChange, onOpenGCash, onOpenReturn, API }: {
    order: OrderDetail; onClose: () => void
    onStatusChange: (id: number, status: string) => Promise<void>
    onOpenGCash: () => void; onOpenReturn: () => void; API: string
}) => {
    const status = STATUS_CFG[order.order_status] ?? STATUS_CFG.confirmed
    const payment = PAY_CFG[order.payment_status] ?? PAY_CFG.pending
    const [busy, setBusy] = useState(false)
    const { datePart, timePart } = formatDateParts(order.created_at)

    const nextStatuses: Record<string, string[]> = {
        confirmed: ['preparing', 'cancelled'],
        preparing: ['out_for_delivery', 'cancelled'],
        out_for_delivery: ['delivered', 'cancelled'],
        cancelled: [],
        returned: [],
    }
    const available = nextStatuses[order.order_status] ?? []
    const isOnline = order.payment_mode === 'gcash'
    const needsGcashVerify = isOnline && order.payment_status === 'pending'
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
                        <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold border ${status.bg} ${status.color} ${status.border}`}>
                            <status.icon size={11} /> {status.label}
                        </span>
                        {isOnline ? (
                            <button onClick={onOpenGCash}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all hover:opacity-80 ${payment.bg} ${payment.color} ${payment.border}`}>
                                <FaMobileAlt size={10} /> GCash · {payment.label}
                                {needsGcashVerify && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-0.5" />}
                            </button>
                        ) : (
                            <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold border ${payment.bg} ${payment.color} ${payment.border}`}>
                                <FaMoneyBillWave size={10} /> Cash · {payment.label}
                            </span>
                        )}
                        {hasReturn && (
                            <button onClick={onOpenReturn}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all hover:opacity-80
                                    ${order.return_status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                        order.return_status === 'rejected' ? 'bg-red-50 text-red-500 border-red-200' :
                                            'bg-orange-50 text-orange-500 border-orange-200 animate-pulse'}`}>
                                <RotateCcw size={10} />
                                Return {order.return_status === 'pending' ? '· Review' : `· ${order.return_status}`}
                            </button>
                        )}
                        <span className="ml-auto text-base font-black text-[#0d2a4a]">{fmt(order.total_amount)}</span>
                    </div>
                    {needsGcashVerify && (
                        <button onClick={onOpenGCash}
                            className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold hover:bg-amber-100 transition-all">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            GCash payment pending verification — tap to review receipt
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
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-60 hover:opacity-80 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                            {busy ? <Loader2 size={11} className="animate-spin" /> : <cfg.icon size={11} />}
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

// ── Order Row ──────────────────────────────────────────────────────────────
const OrderRow = ({ order, onOpen }: { order: Order; onOpen: () => void }) => {
    const status = STATUS_CFG[order.order_status] ?? STATUS_CFG.confirmed
    const payment = PAY_CFG[order.payment_status] ?? PAY_CFG.pending
    const isGcashPending = order.payment_mode === 'gcash' && order.payment_status === 'pending'
    const hasReturn = !!order.return_id && order.return_status === 'pending'
    const { datePart, timePart } = formatDateParts(order.created_at)

    return (
        <tr className="hover:bg-blue-50/30 transition-colors cursor-pointer border-b border-gray-100 last:border-0" onClick={onOpen}>
            {/* Order ref */}
            <td className="px-4 py-3.5 border-r border-gray-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#e8f4fd] flex items-center justify-center shrink-0">
                        <Droplets size={14} className="text-[#38bdf8]" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 text-xs font-mono leading-tight">{order.order_reference}</p>
                        <p className="text-[10px] text-gray-400">{order.item_count} item(s)</p>
                    </div>
                </div>
            </td>

            {/* Customer */}
            <td className="px-4 py-3.5 border-r border-gray-100">
                <p className="font-semibold text-gray-800 text-xs leading-tight">{order.customer_name || 'Walk-in'}</p>
                <p className="text-[10px] text-gray-400 truncate max-w-[110px]">{order.customer_email || '—'}</p>
            </td>

            {/* Date — two lines so it never squishes */}
            <td className="px-4 py-3.5 border-r border-gray-100 whitespace-nowrap">
                <p className="text-xs text-gray-700 font-medium leading-tight">{datePart}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{timePart}</p>
            </td>

            {/* Type */}
            <td className="px-4 py-3.5 border-r border-gray-100 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                    {order.payment_mode}
                </span>
            </td>

            {/* Total */}
            <td className="px-4 py-3.5 border-r border-gray-100 text-center">
                <span className="font-black text-gray-800 text-xs whitespace-nowrap">{fmt(order.total_amount)}</span>
            </td>

            {/* Payment */}
            <td className="px-4 py-3.5 border-r border-gray-100 text-center">
                {isGcashPending ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending
                    </span>
                ) : (
                    <span className={`text-xs font-semibold whitespace-nowrap ${payment.color}`}>{payment.label}</span>
                )}
                {hasReturn && (
                    <span className="block text-[9px] font-bold text-orange-500 mt-0.5 animate-pulse whitespace-nowrap">⟳ Return Req.</span>
                )}
            </td>

            {/* Status */}
            <td className="px-4 py-3.5 border-r border-gray-100 text-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${status.bg} ${status.color} ${status.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
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

// ══════════════════════════════════════════════════════════════════════════
export default function AdminCustomerOrder() {
    const { user } = useAuth()
    const API = import.meta.env.VITE_API_URL

    const [view, setView] = useState<'active' | 'history'>('active')
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [stationName, setStationName] = useState('')

    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
    const [gcashOrder, setGcashOrder] = useState<OrderDetail | null>(null)
    const [returnOrder, setReturnOrder] = useState<OrderDetail | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)

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
            const params: any = { view }
            if (filterStatus !== 'all') params.status = filterStatus
            if (search) params.search = search
            const res = await axios.get(`${API}/orders`, { params, withCredentials: true })
            setOrders(res.data)
        } catch { }
        finally { setLoading(false) }
    }, [API, view, filterStatus, search])

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
        } catch { }
        finally { setLoadingDetail(false) }
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
        await axios.put(`${API}/orders/${id}/status`, { order_status: status }, { withCredentials: true })
        await refreshOrder(id)
    }

    const handlePaymentVerify = async (id: number, payment_status: string) => {
        await axios.put(`${API}/orders/${id}/payment`, { payment_status }, { withCredentials: true })
        await refreshOrder(id)
    }

    const handleReturnResolve = async (id: number, return_status: string) => {
        await axios.put(`${API}/orders/${id}/return`, { return_status }, { withCredentials: true })
        await refreshOrder(id)
    }

    const statuses = ['all', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'returned']
    const pendingGcash = orders.filter(o => o.payment_mode === 'gcash' && o.payment_status === 'pending').length
    const pendingReturns = orders.filter(o => o.return_status === 'pending').length

    return (
        <div className="flex flex-col gap-4 pb-10">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Orders</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Customer orders for your station</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {pendingGcash > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {pendingGcash} GCash pending
                        </span>
                    )}
                    {pendingReturns > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                            <RotateCcw size={10} /> {pendingReturns} return(s)
                        </span>
                    )}
                    <span className="text-sm font-bold text-[#0d2a4a] bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap">
                        {orders.length} orders
                    </span>
                    {/* Print delivery list button */}
                    <button
                        onClick={() => printDeliveryList(orders, stationName)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white text-xs font-bold transition-all shadow-sm whitespace-nowrap">
                        <Printer size={13} /> Print List
                    </button>
                    <button onClick={fetchOrders} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                        <RefreshCw size={15} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* View toggle + filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                    <button onClick={() => { setView('active'); setFilterStatus('all') }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                            ${view === 'active' ? 'bg-[#0d2a4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <ShoppingBag size={12} /> Active
                    </button>
                    <button onClick={() => { setView('history'); setFilterStatus('all') }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                            ${view === 'history' ? 'bg-[#0d2a4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <History size={12} /> History
                    </button>
                </div>
                <div className="relative flex-1 min-w-[180px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input placeholder="Search order or customer..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/15 transition-all shadow-sm" />
                </div>
                <div className="relative">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                        className="appearance-none pl-4 pr-9 py-2.5 bg-[#0d2a4a] text-white text-xs font-semibold rounded-xl border-0 outline-none cursor-pointer">
                        {statuses.map(s => (
                            <option key={s} value={s}>{s === 'all' ? 'All Status' : STATUS_CFG[s]?.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                </div>
            </div>

            {/* History info notice */}
            {view === 'history' && (
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600">
                    <History size={14} className="shrink-0" />
                    Showing completed orders (delivered, cancelled, returned) and all orders from previous days.
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                        <Loader2 size={18} className="animate-spin" /> Loading orders...
                    </div>
                ) : orders.length === 0 ? (
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
                                    {['Order', 'Customer', 'Date', 'Type', 'Total', 'Payment', 'Status', ''].map((h, i) => (
                                        <th key={i} className={`px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left whitespace-nowrap
                                            ${i < 7 ? 'border-r border-gray-200' : ''}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <OrderRow key={order.order_id} order={order} onOpen={() => openOrder(order)} />
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
        </div>
    )
}