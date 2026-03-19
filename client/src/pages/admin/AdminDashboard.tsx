// AdminDashboard - overview of sales, orders, and inventory for station admins
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    TrendingUp, ShoppingBag, PackageCheck, XCircle,
    RotateCcw, Loader2, X, RefreshCw,
    ReceiptText, Clock, Truck, CheckCircle2, ArrowUpRight,
    ArrowDownRight, Minus as MinusIcon, Package,
} from 'lucide-react'

// Types
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface SummaryRow {
    period_label: string
    total_orders: number
    total_revenue: number
    delivered: number
    cancelled: number
    returned: number
    confirmed: number
    preparing: number
    out_for_delivery: number
    confirmed_revenue: number
}

interface Totals {
    total_orders: number
    total_revenue: number
    delivered: number
    cancelled: number
    returned: number
    confirmed_revenue: number
}

interface TopProduct {
    product_name: string
    total_qty: number
    total_revenue: number
}

interface DayOrder {
    order_id: number
    order_reference: string
    total_amount: number
    order_status: string
    payment_mode: string
    created_at: string
    customer_name: string
}

interface DaySummary {
    total_orders: number
    total_revenue: number
    delivered: number
    cancelled: number
    returned: number
    confirmed: number
    preparing: number
    out_for_delivery: number
    earned_revenue: number
}

// Helpers
const fmt = (n: number) => `₱${Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
const num = (n: any) => Number(n ?? 0)

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: any; btnBg: string }> = {
    confirmed: { label: 'Confirmed', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400', icon: CheckCircle2, btnBg: 'bg-blue-600' },
    preparing: { label: 'Preparing', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', icon: Clock, btnBg: 'bg-amber-500' },
    out_for_delivery: { label: 'Out for Delivery', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-400', icon: Truck, btnBg: 'bg-purple-600' },
    delivered: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2, btnBg: 'bg-emerald-600' },
    cancelled: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400', icon: XCircle, btnBg: 'bg-red-500' },
    returned: { label: 'Returned', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', dot: 'bg-gray-400', icon: RotateCcw, btnBg: 'bg-gray-500' },
}

// Pure CSS Bar Chart (no recharts)
const BarChartCustom = ({ data, onBarClick }: {
    data: { name: string; revenue: number; orders: number }[]
    onBarClick?: (name: string) => void
}) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; item: any } | null>(null)
    const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
    const maxOrders = Math.max(...data.map(d => d.orders), 1)

    if (data.length === 0) return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-300 gap-2">
            <ReceiptText size={28} /><p className="text-sm">No data for this period</p>
        </div>
    )

    return (
        <div className="relative w-full">
            {/* Y axis labels */}
            <div className="flex gap-2">
                <div className="flex flex-col justify-between text-[9px] text-gray-400 text-right w-10 shrink-0 h-48 py-1">
                    <span>{fmt(maxRevenue)}</span>
                    <span>{fmt(maxRevenue / 2)}</span>
                    <span>₱0</span>
                </div>
                {/* Bars */}
                <div className="flex-1 relative h-48 border-b border-l border-gray-100">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {[0, 1, 2].map(i => <div key={i} className="border-t border-gray-50 w-full" />)}
                    </div>
                    {/* Bar groups */}
                    <div className="absolute inset-0 flex items-end gap-px px-1">
                        {data.map((d, i) => (
                            <div key={i} className="flex-1 flex items-end gap-px group cursor-pointer"
                                onClick={() => onBarClick?.(d.name)}
                                onMouseEnter={e => setTooltip({ x: (e.target as any).getBoundingClientRect().left, y: (e.target as any).getBoundingClientRect().top, item: d })}
                                onMouseLeave={() => setTooltip(null)}>
                                {/* Revenue bar */}
                                <div className="flex-1 rounded-t-sm bg-[#0d2a4a] hover:bg-[#1a4a7a] transition-all"
                                    style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: d.revenue > 0 ? 2 : 0 }} />
                                {/* Orders bar */}
                                <div className="flex-1 rounded-t-sm bg-[#38bdf8] hover:bg-[#0ea5e9] transition-all"
                                    style={{ height: `${(d.orders / maxOrders) * 100}%`, minHeight: d.orders > 0 ? 2 : 0 }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* X axis labels */}
            <div className="flex gap-2 mt-1">
                <div className="w-10 shrink-0" />
                <div className="flex-1 flex gap-px px-1">
                    {data.map((d, i) => (
                        <div key={i} className="flex-1 text-center text-[8px] text-gray-400 truncate">{d.name.slice(-5)}</div>
                    ))}
                </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-2 justify-end">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-3 h-3 rounded-sm bg-[#0d2a4a] inline-block" /> Revenue
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-3 h-3 rounded-sm bg-[#38bdf8] inline-block" /> Orders
                </div>
            </div>
            {/* Tooltip */}
            {tooltip && (
                <div className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs pointer-events-none"
                    style={{ left: tooltip.x, top: tooltip.y - 80 }}>
                    <p className="font-bold text-gray-700 mb-1">{tooltip.item.name}</p>
                    <p className="text-gray-500">Revenue: <span className="font-bold text-gray-800">{fmt(tooltip.item.revenue)}</span></p>
                    <p className="text-gray-500">Orders: <span className="font-bold text-gray-800">{tooltip.item.orders}</span></p>
                </div>
            )}
        </div>
    )
}

// Line Chart (pure CSS/SVG)
const LineChartCustom = ({ data }: { data: { name: string; revenue: number; orders: number }[] }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(600)
    const height = 180
    const padding = { top: 10, right: 10, bottom: 20, left: 45 }

    useEffect(() => {
        if (!containerRef.current) return
        const obs = new ResizeObserver(e => setWidth(e[0].contentRect.width))
        obs.observe(containerRef.current)
        return () => obs.disconnect()
    }, [])

    const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const revenuePoints = data.map((d, i) => ({
        x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
        y: padding.top + (1 - d.revenue / maxRevenue) * chartH,
    }))

    const toPath = (pts: { x: number; y: number }[]) =>
        pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

    if (data.length === 0) return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-300 gap-2">
            <ReceiptText size={28} /><p className="text-sm">No data for this period</p>
        </div>
    )

    return (
        <div ref={containerRef} className="w-full">
            <svg width={width} height={height}>
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => (
                    <line key={t}
                        x1={padding.left} y1={padding.top + t * chartH}
                        x2={padding.left + chartW} y2={padding.top + t * chartH}
                        stroke="#f3f4f6" strokeWidth={1} />
                ))}
                {/* Revenue line */}
                <path d={toPath(revenuePoints)} fill="none" stroke="#0d2a4a" strokeWidth={2} strokeLinejoin="round" />
                {revenuePoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={3} fill="#0d2a4a" />
                ))}
                {/* X labels */}
                {data.map((d, i) => (
                    <text key={i}
                        x={padding.left + (i / Math.max(data.length - 1, 1)) * chartW}
                        y={height - 4}
                        textAnchor="middle" fontSize={8} fill="#9ca3af">
                        {d.name.slice(-5)}
                    </text>
                ))}
                {/* Y labels */}
                {[0, 0.5, 1].map((t, i) => (
                    <text key={i} x={padding.left - 4} y={padding.top + t * chartH + 4}
                        textAnchor="end" fontSize={8} fill="#9ca3af">
                        {fmt(maxRevenue * (1 - t)).replace('₱', '₱')}
                    </text>
                ))}
            </svg>
            <div className="flex items-center gap-4 mt-1 justify-end">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-3 h-1 bg-[#0d2a4a] inline-block" /> Revenue
                </div>
            </div>
        </div>
    )
}

// Day Detail Modal
const DayModal = ({ date, onClose, API }: { date: string; onClose: () => void; API: string }) => {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<{ orders: DayOrder[]; summary: DaySummary } | null>(null)

    useEffect(() => {
        setLoading(true)
        axios.get(`${API}/reports/day/${date}`, { withCredentials: true })
            .then(r => setData(r.data))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [date])

    const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
    const formatDateFull = (d: string) => new Date(d).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    const statCards = data ? [
        { label: 'Total Orders', value: num(data.summary.total_orders), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Delivered', value: num(data.summary.delivered), icon: PackageCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { label: 'Cancelled', value: num(data.summary.cancelled), icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
        { label: 'Returned', value: num(data.summary.returned), icon: RotateCcw, color: 'text-gray-500', bg: 'bg-gray-200' },
        { label: 'Confirmed', value: num(data.summary.confirmed), icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-100' },
        { label: 'Preparing', value: num(data.summary.preparing), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
        { label: 'Out for Delivery', value: num(data.summary.out_for_delivery), icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100' },
    ] : []

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0 bg-[#0d2a4a]">
                    <div>
                        <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Daily Breakdown</p>
                        <h2 className="text-sm font-bold text-white">{data ? formatDateFull(date) : date}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60"><X size={16} /></button>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                        <Loader2 size={18} className="animate-spin" /> Loading...
                    </div>
                ) : data ? (
                    <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-5">
                        <div className="bg-gradient-to-br from-[#0d2a4a] to-[#1a4a7a] rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Revenue</p>
                                <p className="text-white font-black text-3xl mt-1">{fmt(num(data.summary.total_revenue))}</p>
                                <p className="text-[#38bdf8] text-xs mt-1">{fmt(num(data.summary.earned_revenue))} earned from delivered orders</p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                <TrendingUp size={28} className="text-[#38bdf8]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {statCards.map(({ label, value, icon: Icon, color, bg }) => (
                                <div key={label} className={`${bg} rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-white`}>
                                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0">
                                        <Icon size={14} className={color} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
                                        <p className={`text-sm font-black ${color}`}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">All Orders ({data.orders.length})</p>
                            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                {data.orders.length === 0 ? (
                                    <p className="text-center py-8 text-gray-300 text-sm">No orders this day</p>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {data.orders.map(o => {
                                            const cfg = STATUS_CFG[o.order_status] ?? STATUS_CFG.confirmed
                                            return (
                                                <div key={o.order_id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/70 transition-colors">
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-gray-800 font-mono">{o.order_reference}</p>
                                                        <p className="text-[10px] text-gray-400">{o.customer_name || 'Walk-in'}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-xs font-black text-[#0d2a4a]">{fmt(o.total_amount)}</p>
                                                        <p className="text-[10px] text-gray-400">{formatTime(o.created_at)}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg text-white whitespace-nowrap ${cfg.btnBg}`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-center py-8 text-gray-400 text-sm">Failed to load data</p>
                )}
            </div>
        </div>
    )
}

export default function AdminDashboard() {
    const API = import.meta.env.VITE_API_URL
    const navigate = useNavigate()
    const [period, setPeriod] = useState<Period>('daily')
    const [loading, setLoading] = useState(true)
    const [rows, setRows] = useState<SummaryRow[]>([])
    const [totals, setTotals] = useState<Totals | null>(null)
    const [topProducts, setTopProducts] = useState<TopProduct[]>([])
    const [selectedDay, setSelectedDay] = useState<string | null>(null)
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API}/reports/summary`, {
                params: { period }, withCredentials: true
            })
            setRows(res.data.rows ?? [])
            setTotals(res.data.totals ?? null)
            setTopProducts(res.data.topProducts ?? [])
        } catch { }
        finally { setLoading(false) }
    }, [API, period])

    useEffect(() => { fetchData() }, [fetchData])

    const chartData = rows.map(r => ({
        name: r.period_label,
        revenue: num(r.total_revenue),
        orders: num(r.total_orders),
    }))

    const periodDesc: Record<Period, string> = {
        daily: 'Last 30 days',
        weekly: 'Last 12 weeks',
        monthly: 'Last 12 months',
        yearly: 'Last 5 years',
    }

    const getInsight = () => {
        if (rows.length < 2) return null
        const last = rows[rows.length - 1]
        const prev = rows[rows.length - 2]
        const diff = num(last.total_revenue) - num(prev.total_revenue)
        const pct = prev.total_revenue > 0 ? Math.abs(diff / num(prev.total_revenue) * 100).toFixed(1) : null
        const label = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'year'
        if (diff > 0) return { text: `Revenue is up ${pct ? pct + '% ' : ''}compared to the previous ${label}.`, up: true }
        if (diff < 0) return { text: `Revenue is down ${pct ? pct + '% ' : ''}compared to the previous ${label}.`, up: false }
        return { text: 'Revenue is unchanged from the previous period.', up: null }
    }
    const insight = getInsight()
    const periods: Period[] = ['daily', 'weekly', 'monthly', 'yearly']

    return (
        <div className="flex flex-col gap-5 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-xs text-gray-400 mt-0.5">{periodDesc[period]} · Click any bar or row to see daily breakdown</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                        {periods.map(p => (
                            <button key={p} onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize
                                    ${period === p ? 'bg-[#0d2a4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchData} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                        <RefreshCw size={15} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
                    <Loader2 size={20} className="animate-spin" /> Loading dashboard...
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Revenue', value: fmt(num(totals?.total_revenue)), sub: `${fmt(num(totals?.confirmed_revenue))} earned`, icon: TrendingUp, color: 'text-[#38bdf8]', bg: 'bg-[#0d2a4a]', dark: true, to: '/admin/orders' },
                            { label: 'Total Orders', value: num(totals?.total_orders), sub: `${num(totals?.delivered)} delivered`, icon: ShoppingBag, color: 'text-blue-700', bg: 'bg-blue-200', dark: false, to: '/admin/orders' },
                            { label: 'Cancelled', value: num(totals?.cancelled), sub: 'orders cancelled', icon: XCircle, color: 'text-red-600', bg: 'bg-red-200', dark: false, to: '/admin/orders?status=cancelled' },
                            { label: 'Returned', value: num(totals?.returned), sub: 'return requests', icon: RotateCcw, color: 'text-gray-600', bg: 'bg-gray-300', dark: false, to: '/admin/orders?status=returned' },
                        ].map(({ label, value, sub, icon: Icon, color, bg, dark, to }, i) => (
                            <div key={label} onClick={() => navigate(to)} className={`animate-fade-in-up cursor-pointer ${bg} rounded-2xl p-4 flex flex-col gap-2 ${dark ? 'border border-[#1a4a7a]' : ''} shadow-sm hover:opacity-90 transition-opacity`} style={{ animationDelay: `${i * 60}ms` }}>
                                <div className="flex items-center justify-between">
                                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-white/50' : 'text-gray-500'}`}>{label}</p>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? 'bg-white/10' : ''}`}>
                                        <Icon size={16} className={color} />
                                    </div>
                                </div>
                                <p className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-800'}`}>{value}</p>
                                <p className={`text-[10px] ${dark ? 'text-[#38bdf8]' : 'text-gray-500'}`}>{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Insight */}
                    {insight && (
                        <p className={`flex items-center gap-1.5 text-[11px] font-medium px-1
                            ${insight.up === true ? 'text-emerald-500' :
                                insight.up === false ? 'text-red-400' :
                                    'text-gray-400'}`}>
                            {insight.up === true ? <ArrowUpRight size={13} /> :
                                insight.up === false ? <ArrowDownRight size={13} /> :
                                    <MinusIcon size={13} />}
                            {insight.text}
                        </p>
                    )}

                    {/* Chart */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-bold text-gray-800">Revenue & Orders</p>
                                <p className="text-[10px] text-gray-400">{period === 'daily' ? 'Click a bar to see day details' : 'Overview by period'}</p>
                            </div>
                            <div className="flex bg-gray-100 rounded-lg p-0.5">
                                <button onClick={() => setChartType('bar')}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${chartType === 'bar' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>
                                    Bar
                                </button>
                                <button onClick={() => setChartType('line')}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${chartType === 'line' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>
                                    Line
                                </button>
                            </div>
                        </div>
                        {chartType === 'bar'
                            ? <BarChartCustom data={chartData} onBarClick={period === 'daily' ? setSelectedDay : undefined} />
                            : <LineChartCustom data={chartData} />
                        }
                    </div>

                    {/* Bottom row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Top Products */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <p className="text-sm font-bold text-gray-800 mb-1">Top Products</p>
                            <p className="text-[10px] text-gray-400 mb-4">By quantity sold (delivered orders only)</p>
                            {topProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-28 text-gray-300 gap-2">
                                    <Package size={24} /><p className="text-xs">No product data yet</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {topProducts.map((p, i) => {
                                        const maxQty = topProducts[0].total_qty
                                        const pct = Math.round(num(p.total_qty) / maxQty * 100)
                                        return (
                                            <div key={p.product_name} className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-gray-300 w-4 shrink-0">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="text-xs font-semibold text-gray-700 truncate">{p.product_name}</p>
                                                        <p className="text-xs font-black text-[#0d2a4a] shrink-0 ml-2">{num(p.total_qty)} sold</p>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#0d2a4a] rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-gray-400 shrink-0 w-16 text-right">{fmt(num(p.total_revenue))}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Status Breakdown */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <p className="text-sm font-bold text-gray-800 mb-1">Order Status Breakdown</p>
                            <p className="text-[10px] text-gray-400 mb-4">Across all orders in this period</p>
                            {rows.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-28 text-gray-300 gap-2">
                                    <ShoppingBag size={24} /><p className="text-xs">No order data yet</p>
                                </div>
                            ) : (() => {
                                const totalOrders = num(totals?.total_orders)
                                const breakdown = [
                                    { key: 'delivered', label: 'Delivered', value: num(totals?.delivered), color: 'bg-emerald-500' },
                                    { key: 'cancelled', label: 'Cancelled', value: num(totals?.cancelled), color: 'bg-red-400' },
                                    { key: 'returned', label: 'Returned', value: num(totals?.returned), color: 'bg-gray-400' },
                                ]
                                return (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex h-3 rounded-full overflow-hidden gap-px bg-gray-100">
                                            {breakdown.map(b => b.value > 0 && (
                                                <div key={b.key} className={`${b.color} h-full transition-all`}
                                                    style={{ width: `${totalOrders > 0 ? (b.value / totalOrders * 100) : 0}%` }} />
                                            ))}
                                        </div>
                                        {breakdown.map(b => (
                                            <div key={b.key} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                                                    <span className="text-xs text-gray-600">{b.label}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-black text-gray-800">{b.value}</span>
                                                    <span className="text-[10px] text-gray-400 w-8 text-right">
                                                        {totalOrders > 0 ? (b.value / totalOrders * 100).toFixed(0) : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Total Orders</span>
                                            <span className="text-sm font-black text-[#0d2a4a]">{totalOrders}</span>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    </div>

                    {/* Daily table */}
                    {period === 'daily' && rows.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100">
                                <p className="text-sm font-bold text-gray-800">Daily Breakdown</p>
                                <p className="text-[10px] text-gray-400">Click a row to see full day details</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                                            {['Date', 'Orders', 'Revenue', 'Delivered', 'Cancelled', 'Returned', ''].map((h, i) => (
                                                <th key={i} className={`px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left whitespace-nowrap ${i < 6 ? 'border-r border-gray-100' : ''}`}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...rows].reverse().map(r => (
                                            <tr key={r.period_label}
                                                className="border-b border-gray-100 hover:bg-blue-50/30 cursor-pointer transition-colors"
                                                onClick={() => setSelectedDay(r.period_label)}>
                                                <td className="px-4 py-3 border-r border-gray-100 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">{r.period_label}</td>
                                                <td className="px-4 py-3 border-r border-gray-100 text-xs font-bold text-gray-800">{num(r.total_orders)}</td>
                                                <td className="px-4 py-3 border-r border-gray-100 text-xs font-black text-[#0d2a4a] whitespace-nowrap">{fmt(num(r.total_revenue))}</td>
                                                <td className="px-4 py-3 border-r border-gray-100 text-xs font-semibold text-emerald-600">{num(r.delivered)}</td>
                                                <td className="px-4 py-3 border-r border-gray-100 text-xs font-semibold text-red-500">{num(r.cancelled)}</td>
                                                <td className="px-4 py-3 border-r border-gray-100 text-xs font-semibold text-gray-500">{num(r.returned)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="inline-flex p-1.5 rounded-lg bg-[#e8f4fd] hover:bg-[#d0e8f7] text-[#0d2a4a] transition-all">
                                                        <ReceiptText size={13} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {selectedDay && (
                <DayModal date={selectedDay} onClose={() => setSelectedDay(null)} API={API} />
            )}
        </div>
    )
}