// PointOfSale - walk-in customer transactions and payment processing
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import {
    Search, Plus, Minus, Trash2, ShoppingCart,
    CheckCircle2, Loader2, X,
    ImageIcon, User, MapPin, Droplets, Printer, Calculator,
    Phone,
} from 'lucide-react'
import { FaMoneyBillWave, FaMobileAlt, FaStore, FaTruck } from 'react-icons/fa'

// Types
interface Product {
    product_id: number
    product_name: string
    price: number
    unit: string
    image_url: string | null
    quantity: number
    min_stock_level: number
    inventory_id: number
    is_active: number
}
interface CartItem extends Product { qty: number }
type PaymentMethod = 'cash' | 'gcash'
type DeliveryType = 'pickup' | 'delivery'
type PanelView = 'order' | 'calc'
type ToastType = 'success' | 'error'
interface ToastData { message: string; type: ToastType }

const fmt = (p: number) => `₱${Number(p).toFixed(2)}`
const fmtDate = () => new Date().toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
})

// Typeable quantity input
function QtyInput({ value, max, className, onChange }: { value: number; max: number; className?: string; onChange: (v: number) => void }) {
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
            className={`text-center font-black bg-transparent border-none outline-none
                [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${className ?? ''}`}
        />
    )
}

// Toast
const Toast = ({ toast, onDone }: { toast: ToastData; onDone: () => void }) => {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
    return (
        <div className="fixed bottom-6 right-6 z-[999] px-4 py-3 rounded-xl shadow-md bg-white text-sm font-medium text-gray-700">
            {toast.message}
        </div>
    )
}

// Inline Calculator Panel
const InlineCalculator = () => {
    const [display, setDisplay] = useState('0')
    const [prev, setPrev] = useState<string | null>(null)
    const [op, setOp] = useState<string | null>(null)
    const [fresh, setFresh] = useState(false)
    const [expression, setExpression] = useState('')

    const press = (val: string) => {
        if (val === 'AC') {
            setDisplay('0'); setPrev(null); setOp(null); setFresh(false); setExpression('')
            return
        }
        if (val === '+/-') { setDisplay(d => d === '0' ? '0' : d.startsWith('-') ? d.slice(1) : '-' + d); return }
        if (val === '%') { setDisplay(d => String(parseFloat(d) / 100)); return }
        if (val === '⌫') { setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0'); return }
        if (['+', '-', '×', '÷'].includes(val)) {
            setExpression(display + ' ' + val)
            setPrev(display); setOp(val); setFresh(true); return
        }
        if (val === '=') {
            if (!prev || !op) return
            const a = parseFloat(prev), b = parseFloat(display)
            const res = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b
            const result = String(parseFloat(res.toFixed(8)))
            setExpression(prev + ' ' + op + ' ' + display + ' =')
            setDisplay(result)
            setPrev(null); setOp(null); setFresh(false); return
        }
        if (val === '.' && display.includes('.') && !fresh) return
        setDisplay(d => fresh ? val : (d === '0' && val !== '.' ? val : d + val))
        setFresh(false)
    }

    const pressRef = useRef(press)
    useEffect(() => { pressRef.current = press })

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const keyMap: Record<string, string> = {
                '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
                '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
                '.': '.', ',': '.', '+': '+', '-': '-',
                '*': '×', '/': '÷', '%': '%',
                'Enter': '=', 'Backspace': '⌫', 'Escape': 'AC',
            }
            const mapped = keyMap[e.key]
            if (mapped) { e.preventDefault(); pressRef.current(mapped) }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const rows = [
        ['AC', '+/-', '%', '÷'],
        ['7', '8', '9', '×'],
        ['4', '5', '6', '-'],
        ['1', '2', '3', '+'],
        ['⌫', '0', '.', '='],
    ]

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="px-4 py-3 bg-[#0d2a4a] flex-shrink-0">
                <p className="text-[#38bdf8]/60 text-[10px] font-mono h-4 truncate text-right">{expression || '\u00a0'}</p>
                <p className="text-white font-light text-right truncate"
                    style={{ fontSize: display.length > 10 ? 22 : display.length > 7 ? 28 : 36, lineHeight: 1.1 }}>
                    {display}
                </p>
            </div>
            <div className="flex-1 grid grid-rows-5 gap-px bg-gray-200 overflow-hidden">
                {rows.map((row, ri) => (
                    <div key={ri} className="grid grid-cols-4 gap-px">
                        {row.map((btn) => {
                            const isOp = ['÷', '×', '-', '+'].includes(btn)
                            const isEq = btn === '='
                            const isTop = ['AC', '+/-', '%'].includes(btn)
                            const isBack = btn === '⌫'
                            return (
                                <button key={btn} onClick={() => press(btn)}
                                    className={`w-full h-full flex items-center justify-center text-sm font-semibold transition-all active:brightness-90 active:scale-95
                                        ${isEq ? 'bg-[#38bdf8] text-[#0d2a4a] font-black text-lg' :
                                            isOp ? 'bg-[#1a4a7a] text-[#38bdf8] font-bold text-base' :
                                                isTop ? 'bg-gray-200 text-gray-700' :
                                                    isBack ? 'bg-gray-100 text-red-500' :
                                                        'bg-white text-gray-800 hover:bg-gray-50'}`}
                                    style={{ minHeight: 48 }}>
                                    {btn}
                                </button>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}

// TODO Fix HTML Structure
// Receipt Modal
const ReceiptModal = ({ orderRef, total, items, customerName, customerPhone, customerAddress, paymentMethod, deliveryType, stationName, onClose }: {
    orderRef: string; total: number; items: CartItem[]
    customerName: string; customerPhone: string; customerAddress: string
    paymentMethod: PaymentMethod; deliveryType: DeliveryType
    stationName: string; onClose: () => void
}) => {
    const printDate = fmtDate()

    const handlePrint = () => {
        const win = window.open('', '_blank', 'width=900,height=800')
        if (!win) return
        win.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Receipt - ${orderRef}</title>
<style>
  @page { size: A4 portrait; margin: 20mm 30mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #000; background: #fff; max-width: 380px; margin: 0 auto; padding: 16px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .big { font-size: 17px; font-weight: bold; }
  .dash { border-top: 1px dashed #000; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .small { font-size: 11px; color: #555; }
  .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 6px; }
</style>
</head>
<body>
  <div class="center" style="margin-bottom:10px">
    <div class="big">${stationName || 'AquaLasTech'}</div>
    <div class="small">Water Refilling Station</div>
    <div class="small" style="margin-top:4px">================================</div>
  </div>
  <div class="row"><span>Order</span><span class="bold">${orderRef}</span></div>
  <div class="row"><span>Date</span><span class="bold">${printDate}</span></div>
  <div class="row"><span>Customer</span><span class="bold">${customerName || 'Walk-in'}</span></div>
  ${customerPhone ? `<div class="row"><span>Phone</span><span class="bold">${customerPhone}</span></div>` : ''}
  ${customerAddress ? `<div class="row"><span>Address</span><span class="bold">${customerAddress}</span></div>` : ''}
  <div class="row"><span>Payment</span><span class="bold">${paymentMethod.toUpperCase()}</span></div>
  <div class="row"><span>Type</span><span class="bold">${deliveryType.charAt(0).toUpperCase() + deliveryType.slice(1)}</span></div>
  <div class="dash"></div>
  <div class="row bold"><span>Item</span><div><span>Qty</span>&nbsp;&nbsp;<span style="display:inline-block;width:60px;text-align:right">Amount</span></div></div>
  ${items.map(item => `
  <div class="row">
    <span>${item.product_name}</span>
    <div><span>x${item.qty}</span>&nbsp;&nbsp;<span style="display:inline-block;width:60px;text-align:right">${fmt(item.price * item.qty)}</span></div>
  </div>`).join('')}
  <div class="dash"></div>
  <div class="total-row"><span>TOTAL</span><span>${fmt(total)}</span></div>
  <div class="dash" style="margin-top:12px"></div>
  <div class="center small" style="margin-top:6px">
    <div>Thank you for your order!</div>
    <div style="margin-top:2px">Powered by AquaLasTech</div>
  </div>
</body>
</html>`)
        win.document.close()
        win.focus()
        setTimeout(() => { win.print() }, 400)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm mx-4 mb-4 sm:mb-0 flex flex-col gap-2.5">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                    <div className="bg-[#0d2a4a] px-5 pt-5 pb-5 text-center">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center mx-auto mb-2.5">
                            <CheckCircle2 size={20} className="text-white" />
                        </div>
                        <p className="text-white font-black text-base tracking-wide">Order Placed!</p>
                        <p className="text-[#38bdf8] text-[11px] font-mono mt-0.5">{orderRef}</p>
                    </div>
                    <div className="px-5 py-4 font-mono text-[11px]">
                        {[
                            ['Customer', customerName || 'Walk-in'],
                            ...(customerPhone ? [['Phone', customerPhone]] : []),
                            ['Date', printDate],
                            ['Payment', paymentMethod.toUpperCase()],
                            ['Type', deliveryType.charAt(0).toUpperCase() + deliveryType.slice(1)],
                            ...(customerAddress ? [['Address', customerAddress]] : []),
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between text-gray-500 mb-1">
                                <span>{label}</span>
                                <span className="font-bold text-gray-800 text-right max-w-[170px] truncate">{value}</span>
                            </div>
                        ))}
                        <div className="border-t border-dashed border-gray-300 my-3" />
                        <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase mb-2">
                            <span>Item</span>
                            <div className="flex gap-5"><span>Qty</span><span className="w-14 text-right">Amount</span></div>
                        </div>
                        {items.map(item => (
                            <div key={item.product_id} className="flex justify-between items-center mb-1.5">
                                <span className="text-gray-700 flex-1 truncate pr-2">{item.product_name}</span>
                                <div className="flex gap-4 shrink-0">
                                    <span className="text-gray-500 w-5 text-center">x{item.qty}</span>
                                    <span className="text-gray-800 font-bold w-14 text-right">{fmt(item.price * item.qty)}</span>
                                </div>
                            </div>
                        ))}
                        <div className="border-t border-dashed border-gray-300 my-3" />
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Total</span>
                            <span className="text-[#0d2a4a] font-black text-2xl">{fmt(total)}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 mt-4 pt-3 text-center text-gray-300 text-[10px]">
                            <p>Thank you for your order!</p>
                            <p>Powered by AquaLasTech</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handlePrint}
                        className="flex-1 py-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/20 transition-all flex items-center justify-center gap-2">
                        <Printer size={15} /> Print Receipt
                    </button>
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-lg bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0d2a4a] font-black text-sm transition-all flex items-center justify-center gap-2">
                        <ShoppingCart size={15} /> New Order
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function PointOfSale() {
    const { user } = useAuth()
    const API = import.meta.env.VITE_API_URL

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [cart, setCart] = useState<CartItem[]>([])
    const [stationName, setStationName] = useState('')
    const [panelView, setPanelView] = useState<PanelView>('order')
    const [mobileTab, setMobileTab] = useState<'products' | 'order'>('products')

    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerAddress, setCustomerAddress] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup')

    const [gcashPreview, setGcashPreview] = useState<string>('')
    const [uploadingReceipt, setUploadingReceipt] = useState(false)
    const [gcashReceiptUrl, setGcashReceiptUrl] = useState<string>('')

    const [placing, setPlacing] = useState(false)
    const [toast, setToast] = useState<ToastData | null>(null)
    const [receipt, setReceipt] = useState<{ orderRef: string; total: number } | null>(null)
    const [highlightedProduct, setHighlightedProduct] = useState<number | null>(null)

    const showToast = useCallback((m: string, t: ToastType) => setToast({ message: m, type: t }), [])

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API}/inventory`, { withCredentials: true })
            setProducts(res.data.filter((p: Product) => p.quantity > 0 && p.is_active))
        } catch { showToast('Failed to load products', 'error') }
        finally { setLoading(false) }
    }, [API])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    useEffect(() => {
        if (user?.station_id) {
            axios.get(`${API}/stations/${user.station_id}`, { withCredentials: true })
                .then(res => setStationName(res.data?.station_name ?? ''))
                .catch(() => { })
        }
    }, [user])

    const filtered = products.filter(p =>
        p.product_name.toLowerCase().includes(search.toLowerCase())
    )

    const addToCart = (product: Product) => {
        const existing = cart.find(c => c.product_id === product.product_id)
        if (existing) {
            if (existing.qty >= product.quantity) { showToast(`Only ${product.quantity} in stock`, 'error'); return }
            setCart(c => c.map(i => i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i))
        } else {
            setCart(c => [...c, { ...product, qty: 1 }])
        }
        setHighlightedProduct(product.product_id)
        setTimeout(() => setHighlightedProduct(null), 500)
    }

    const updateQty = (product_id: number, qty: number) => {
        if (qty <= 0) { setCart(c => c.filter(i => i.product_id !== product_id)); return }
        const p = products.find(p => p.product_id === product_id)
        if (p && qty > p.quantity) { showToast(`Only ${p.quantity} available`, 'error'); return }
        setCart(c => c.map(i => i.product_id === product_id ? { ...i, qty } : i))
    }

    const clearCart = () => {
        setCart([]); setCustomerName(''); setCustomerPhone(''); setCustomerAddress('')
        setPaymentMethod('cash'); setDeliveryType('pickup')
        setGcashPreview(''); setGcashReceiptUrl('')
    }

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
    const total = subtotal

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return
        setGcashPreview(URL.createObjectURL(file))
        setUploadingReceipt(true)
        try {
            const fd = new FormData(); fd.append('receipt', file)
            const res = await axios.post(`${API}/pos/upload-receipt`, fd, {
                withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' }
            })
            setGcashReceiptUrl(res.data.image_url)
        } catch { showToast('Failed to upload receipt', 'error') }
        finally { setUploadingReceipt(false); e.target.value = '' }
    }

    const handlePlaceOrder = async () => {
        if (cart.length === 0) { showToast('Cart is empty', 'error'); return }
        if (deliveryType === 'delivery' && !customerName.trim()) { showToast('Customer name is required for delivery', 'error'); return }
        if (deliveryType === 'delivery' && !customerAddress.trim()) { showToast('Delivery address is required for delivery', 'error'); return }
        if (paymentMethod === 'gcash' && !gcashReceiptUrl) { showToast('Please upload GCash receipt', 'error'); return }
        setPlacing(true)
        try {
            const res = await axios.post(`${API}/pos/transaction`, {
                c_name: customerName || 'Walk-in',
                c_phone: customerPhone.trim() || null,
                c_address: customerAddress || null,
                payment_method: paymentMethod,
                delivery_type: deliveryType,
                items: cart.map(i => ({ product_id: i.product_id, quantity: i.qty, price_snapshot: i.price })),
                total_amount: total,
                gcash_receipt_url: gcashReceiptUrl || null,
            }, { withCredentials: true })
            setReceipt({ orderRef: res.data.order_reference, total })
            fetchProducts()
        } catch (err: any) {
            showToast(err.response?.data?.message ?? 'Failed to place order', 'error')
        } finally { setPlacing(false) }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 lg:h-[calc(100vh-120px)] lg:min-h-[600px]">

            {/* Mobile tab switcher */}
            <div className="lg:hidden flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm mb-3 shrink-0">
                <button onClick={() => setMobileTab('products')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all
                        ${mobileTab === 'products' ? 'bg-[#0d2a4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Droplets size={13} /> Products
                </button>
                <button onClick={() => setMobileTab('order')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all
                        ${mobileTab === 'order' ? 'bg-[#0d2a4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <ShoppingCart size={13} />
                    <span>Order{cart.length > 0 ? ' (' + cart.length + ')' : ''}</span>
                    {cart.length > 0 && <span className="ml-1 text-[10px] font-black text-[#38bdf8]">{fmt(total)}</span>}
                </button>
            </div>

            {/* LEFT: Product Grid */}
            <div className={`flex-1 flex-col gap-3 min-w-0 lg:overflow-hidden ${mobileTab === 'products' ? 'flex' : 'hidden lg:flex'}`}>
                <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Point of Sale</h1>
                            <p className="text-xs text-gray-400">Tap a product to add to order</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-sm">
                            {products.length} items
                        </span>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input placeholder="Search products..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0d2a4a] focus:ring-2 focus:ring-[#38bdf8]/15 transition-all shadow-sm" />
                    </div>
                </div>

                {/* Product Grid */}
                <div className="lg:flex-1 lg:overflow-y-auto pr-1">
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse flex flex-col overflow-hidden">
                                    <div className="w-full aspect-square bg-gray-100" />
                                    <div className="px-3 py-2.5 flex flex-col gap-1.5">
                                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-300 gap-2">
                            <Droplets size={28} /><p className="text-sm">No products found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                            {filtered.map((p, i) => (
                                <button
                                    key={p.product_id}
                                    onClick={() => addToCart(p)}
                                    style={{ animationDelay: `${i * 50}ms` }}
                                    className={`animate-fade-in-up bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.97] transition-all text-left relative flex flex-col
                                        ${highlightedProduct === p.product_id
                                            ? 'border-[#38bdf8] ring-2 ring-[#38bdf8]/25 scale-[0.97]'
                                            : 'border-gray-200 hover:border-[#38bdf8]/40'}`}>

                                    {/* Stock badge — shows remaining stock after cart deduction */}
                                    {(() => {
                                        const inCart = cart.find(c => c.product_id === p.product_id)?.qty ?? 0
                                        const available = p.quantity - inCart
                                        return (
                                            <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold z-10
                                                ${available <= 0 ? 'bg-red-500 text-white' : available <= Number(p.min_stock_level) ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'}`}>
                                                {available}
                                            </div>
                                        )
                                    })()}

                                    {/* Square image */}
                                    <div className="w-full aspect-square bg-gradient-to-br from-[#e8f4fd] to-[#d0e8f7] flex items-center justify-center overflow-hidden shrink-0">
                                        {p.image_url
                                            ? <img
                                                src={p.image_url.startsWith('http') ? p.image_url : `${API}${p.image_url}`}
                                                alt={p.product_name}
                                                className="w-full h-full object-cover" />
                                            : <Droplets size={28} className="text-[#38bdf8]/40" />}
                                    </div>

                                    {/* Info strip below */}
                                    <div className="px-3 py-2.5 flex flex-col gap-0.5">
                                        <p className="text-xs font-bold text-gray-800 truncate leading-tight">{p.product_name}</p>
                                        <p className="text-xs font-black text-[#0d2a4a]">{fmt(p.price)}</p>
                                        <p className="text-[10px] text-gray-400">{p.unit}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom qty bar */}
                {cart.length > 0 && (
                    <div className="shrink-0 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{cart[cart.length - 1].product_name}</p>
                            <p className="text-[10px] text-gray-400">{fmt(cart[cart.length - 1].price)} each</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => updateQty(cart[cart.length - 1].product_id, cart[cart.length - 1].qty - 1)}
                                className="w-8 h-8 rounded-full bg-[#0d2a4a] text-white flex items-center justify-center hover:bg-[#1a4a7a] transition-all active:scale-90">
                                <Minus size={14} />
                            </button>
                            <QtyInput value={cart[cart.length - 1].qty} max={cart[cart.length - 1].quantity} className="text-sm text-gray-800 w-8"
                                onChange={v => updateQty(cart[cart.length - 1].product_id, v)} />
                            <button onClick={() => addToCart(cart[cart.length - 1])}
                                className="w-8 h-8 rounded-full bg-[#0d2a4a] text-white flex items-center justify-center hover:bg-[#1a4a7a] transition-all active:scale-90">
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: Order Panel */}
            <div className={`w-full lg:w-[340px] xl:w-[380px] shrink-0 flex-col mt-0 lg:mt-0 ${mobileTab === 'order' ? 'flex' : 'hidden lg:flex'}`}>
                <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(13,42,74,0.18)] flex flex-col h-full overflow-hidden border border-gray-200">

                    {/* Tab switcher */}
                    <div className="flex shrink-0 border-b border-gray-100">
                        <button onClick={() => setPanelView('order')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2
                                ${panelView === 'order'
                                    ? 'border-[#0d2a4a] text-[#0d2a4a] bg-white'
                                    : 'border-transparent text-gray-400 bg-gray-50 hover:text-gray-600'}`}>
                            <ShoppingCart size={13} /> Order
                        </button>
                        <button onClick={() => setPanelView('calc')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2
                                ${panelView === 'calc'
                                    ? 'border-[#0d2a4a] text-[#0d2a4a] bg-white'
                                    : 'border-transparent text-gray-400 bg-gray-50 hover:text-gray-600'}`}>
                            <Calculator size={13} /> Calculator
                        </button>
                    </div>

                    {/* ORDER VIEW */}
                    {panelView === 'order' && (<>
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

                            {/* Customer fields */}
                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        placeholder={deliveryType === 'delivery' ? 'Customer Name *' : 'Customer Name (optional)'}
                                        value={customerName} onChange={e => setCustomerName(e.target.value)}
                                        className={`w-full pl-9 pr-3 py-2.5 bg-white rounded-xl text-xs text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#0d2a4a]/10 transition-all border
                                            ${deliveryType === 'delivery' && !customerName.trim() ? 'border-amber-300 focus:border-amber-400' : 'border-gray-200 focus:border-[#0d2a4a]'}`} />
                                </div>
                                <div className="relative">
                                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        placeholder={deliveryType === 'delivery' ? 'Complete Address *' : 'Complete Address (optional)'}
                                        value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                                        className={`w-full pl-9 pr-3 py-2.5 bg-white rounded-xl text-xs text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#0d2a4a]/10 transition-all border
                                            ${deliveryType === 'delivery' && !customerAddress.trim() ? 'border-amber-300 focus:border-amber-400' : 'border-gray-200 focus:border-[#0d2a4a]'}`} />
                                </div>
                                <div className="relative">
                                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        placeholder="Phone Number (optional)"
                                        value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl text-xs text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#0d2a4a]/10 transition-all border border-gray-200 focus:border-[#0d2a4a]" />
                                </div>
                                {deliveryType === 'delivery' && (!customerName.trim() || !customerAddress.trim()) && (
                                    <p className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
                                        Name and address are required for delivery
                                    </p>
                                )}
                            </div>

                            {/* Payment Type */}
                            <div className="flex flex-col gap-1.5">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Payment Type</p>
                                <div className="flex gap-2">
                                    {(['cash', 'gcash'] as PaymentMethod[]).map(m => (
                                        <button key={m} onClick={() => setPaymentMethod(m)}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border
                                                ${paymentMethod === m
                                                    ? 'bg-[#0d2a4a] text-white border-[#0d2a4a] shadow-sm'
                                                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}>
                                            {m === 'cash' ? <><FaMoneyBillWave size={13} /> Cash</> : <><FaMobileAlt size={13} /> GCash</>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Delivery Type */}
                            <div className="flex flex-col gap-1.5">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Delivery Type</p>
                                <div className="flex gap-2">
                                    {(['pickup', 'delivery'] as DeliveryType[]).map(d => (
                                        <button key={d} onClick={() => setDeliveryType(d)}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border
                                                ${deliveryType === d
                                                    ? 'bg-[#0d2a4a] text-white border-[#0d2a4a] shadow-sm'
                                                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}>
                                            {d === 'pickup' ? <><FaStore size={12} /> Pickup</> : <><FaTruck size={12} /> Delivery</>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* GCash upload */}
                            {paymentMethod === 'gcash' && (
                                <div className="flex flex-col gap-1.5">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">GCash Receipt</p>
                                    {gcashPreview ? (
                                        <div className="relative rounded-xl overflow-hidden border border-gray-200 h-28">
                                            <img src={gcashPreview} alt="Receipt" className="w-full h-full object-contain bg-gray-50" />
                                            <button onClick={() => { setGcashPreview(''); setGcashReceiptUrl('') }}
                                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all">
                                                <X size={11} />
                                            </button>
                                            {uploadingReceipt && (
                                                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                                    <Loader2 size={18} className="animate-spin text-[#38bdf8]" />
                                                </div>
                                            )}
                                            {gcashReceiptUrl && !uploadingReceipt && (
                                                <div className="absolute bottom-1.5 right-1.5 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                    <CheckCircle2 size={9} /> Uploaded
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center gap-1.5 py-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#38bdf8] bg-gray-50 cursor-pointer transition-all">
                                            <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
                                            <ImageIcon size={20} className="text-gray-300" />
                                            <span className="text-xs text-gray-500 font-semibold">Upload GCash Receipt</span>
                                            <span className="text-[10px] text-gray-400">JPG, PNG up to 5MB</span>
                                        </label>
                                    )}
                                </div>
                            )}

                            {/* Cart items */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Items</p>
                                    {cart.length > 0 && (
                                        <button onClick={() => setCart([])} className="text-[10px] text-red-400 hover:text-red-600 font-semibold transition-colors">
                                            Clear all
                                        </button>
                                    )}
                                </div>
                                <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 bg-[#e8f4fd] border-b border-[#d0e8f7]">
                                        <p className="text-[10px] font-bold text-[#0d2a4a]/50 uppercase">Item</p>
                                        <p className="text-[10px] font-bold text-[#0d2a4a]/50 uppercase text-center w-16">Qty</p>
                                        <p className="text-[10px] font-bold text-[#0d2a4a]/50 uppercase text-right w-16">Amt</p>
                                    </div>
                                    {cart.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <ShoppingCart size={20} className="text-gray-200 mx-auto mb-1.5" />
                                            <p className="text-xs text-gray-300">Tap a product to add</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {cart.map(item => (
                                                <div key={item.product_id} className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2.5 items-center hover:bg-blue-50/50 transition-colors">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-gray-800 truncate">{item.product_name}</p>
                                                        <p className="text-[10px] text-gray-400">{fmt(item.price)} each</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 w-16 justify-center">
                                                        <button onClick={() => updateQty(item.product_id, item.qty - 1)}
                                                            className="w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-500 transition-all">
                                                            <Minus size={9} />
                                                        </button>
                                                        <QtyInput value={item.qty} max={item.quantity} className="text-xs text-gray-800 w-6"
                                            onChange={v => updateQty(item.product_id, v)} />
                                                        <button onClick={() => updateQty(item.product_id, item.qty + 1)}
                                                            className="w-5 h-5 rounded-full bg-gray-100 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center text-gray-500 transition-all">
                                                            <Plus size={9} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 w-16 justify-end">
                                                        <p className="text-xs font-black text-[#0d2a4a]">{fmt(item.price * item.qty)}</p>
                                                        <button onClick={() => updateQty(item.product_id, 0)} className="text-red-300 hover:text-red-500 transition-colors">
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 border-t border-gray-100 p-4 flex flex-col gap-3 bg-white">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-gray-600">{fmt(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-800">Total</span>
                                    <span className="text-2xl font-black text-[#0d2a4a]">{fmt(total)}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={clearCart}
                                    className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5">
                                    <X size={15} /> Clear
                                </button>
                                <button onClick={handlePlaceOrder}
                                    disabled={placing || cart.length === 0 || (paymentMethod === 'gcash' && !gcashReceiptUrl)}
                                    className="flex-1 py-3 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white font-black text-sm transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 shadow-md">
                                    {placing
                                        ? <><Loader2 size={15} className="animate-spin" /> Placing...</>
                                        : <><ShoppingCart size={15} /> Place Order</>}
                                </button>
                            </div>
                        </div>
                    </>)}

                    {/* CALCULATOR VIEW */}
                    {panelView === 'calc' && <InlineCalculator />}
                </div>
            </div>

            {receipt && (
                <ReceiptModal
                    orderRef={receipt.orderRef}
                    total={receipt.total}
                    items={cart}
                    customerName={customerName}
                    customerPhone={customerPhone}
                    customerAddress={customerAddress}
                    paymentMethod={paymentMethod}
                    deliveryType={deliveryType}
                    stationName={stationName}
                    onClose={() => { setReceipt(null); clearCart() }}
                />
            )}

            {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
        </div>
    )
}