import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import {
    ShoppingCart, Minus, Plus, Trash2, ArrowLeft,
    Droplets, MapPin, CheckCircle2, AlertCircle,
    Loader2, Upload, X, ChevronRight,
    Smartphone, Banknote, Package, RefreshCw,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL

// ── Types ──────────────────────────────────────────────────────────────────
interface Product {
    product_id: number
    product_name: string
    description: string
    price: number
    unit: string
    image_url: string | null
    quantity: number   // stock
}
interface CartItem extends Product { qty: number }
interface Station {
    station_id: number
    station_name: string
    address: string
    image_path: string | null
}
type View = 'products' | 'cart'
type PaymentMode = 'gcash' | 'cash_on_delivery' | 'cash_on_pickup'
type ToastType = 'success' | 'error'

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg: string; type: ToastType; onDone: () => void }) {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
    return (
        <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium
            ${type === 'success' ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-600'}`}>
            {type === 'success'
                ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                : <AlertCircle size={16} className="text-red-500 shrink-0" />}
            {msg}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════
export default function CustomerOrder() {
    const { user } = useAuth()
    const navigate = useNavigate()

    // Get selected station from localStorage (set by CustomerDashboard)
    const [station, setStation] = useState<Station | null>(() => {
        try { return JSON.parse(localStorage.getItem('selected_station') || 'null') }
        catch { return null }
    })

    const [products, setProducts] = useState<Product[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [view, setView] = useState<View>('products')
    const [loading, setLoading] = useState(true)
    const [placing, setPlacing] = useState(false)
    const [payMode, setPayMode] = useState<PaymentMode>('gcash')
    const [receipt, setReceipt] = useState<File | null>(null)
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const showToast = useCallback((msg: string, type: ToastType) => setToast({ msg, type }), [])

    // ── Fetch products for this station ──────────────────────────────────
    const fetchProducts = useCallback(async () => {
        if (!station) return
        setLoading(true)
        try {
            const res = await axios.get(
                `${API}/customer/products/${station.station_id}`,
                { withCredentials: true }
            )
            setProducts(res.data)
        } catch {
            showToast('Failed to load products', 'error')
        } finally {
            setLoading(false)
        }
    }, [station])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    // ── Cart helpers ──────────────────────────────────────────────────────
    const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
    const cartItemCount = cart.reduce((s, i) => s + i.qty, 0)

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product_id === product.product_id)
            if (existing) {
                if (existing.qty >= product.quantity) {
                    showToast('Not enough stock', 'error'); return prev
                }
                return prev.map(i => i.product_id === product.product_id
                    ? { ...i, qty: i.qty + 1 } : i)
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

    const removeFromCart = (product_id: number) =>
        setCart(prev => prev.filter(i => i.product_id !== product_id))

    const getQtyInCart = (product_id: number) =>
        cart.find(i => i.product_id === product_id)?.qty ?? 0

    // ── Receipt file pick ─────────────────────────────────────────────────
    const handleReceiptPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setReceipt(file)
        setReceiptPreview(URL.createObjectURL(file))
    }

    // ── Place order ───────────────────────────────────────────────────────
    const handlePlaceOrder = async () => {
        if (cart.length === 0) { showToast('Your cart is empty', 'error'); return }
        if (payMode === 'gcash' && !receipt) {
            showToast('Please upload your GCash receipt', 'error'); return
        }
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

            showToast('Order placed successfully! 🎉', 'success')
            setCart([])
            setReceipt(null)
            setReceiptPreview(null)
            setView('products')
            // Navigate to dashboard after short delay
            setTimeout(() => navigate('/customer/dashboard'), 2000)
        } catch (err: any) {
            showToast(err.response?.data?.message ?? 'Failed to place order', 'error')
        } finally {
            setPlacing(false)
        }
    }

    // ── No station selected ───────────────────────────────────────────────
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
                <button
                    onClick={() => navigate('/customer/dashboard')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0d2a4a] text-white font-bold text-sm hover:bg-[#1a4a7a] transition-all"
                >
                    <ArrowLeft size={15} /> Go to Dashboard
                </button>
            </div>
        )
    }

    // ── Station banner ────────────────────────────────────────────────────
    const StationBanner = () => (
        <div className="relative w-full rounded-2xl overflow-hidden mb-5 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d2a4a] to-[#1a4a7a]" />
            {station.image_path && (
                <img
                    src={station.image_path.startsWith('http') ? station.image_path : `${API}${station.image_path}`}
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                    alt=""
                />
            )}
            <div className="relative z-10 flex items-center gap-4 px-5 py-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Droplets size={22} className="text-white" />
                </div>
                <div className="min-w-0">
                    <p className="font-black text-white text-base leading-tight">{station.station_name}</p>
                    <p className="text-blue-200 text-xs flex items-center gap-1 mt-0.5 truncate">
                        <MapPin size={10} />{station.address}
                    </p>
                </div>
                <button
                    onClick={() => { localStorage.removeItem('selected_station'); navigate('/customer/dashboard') }}
                    className="ml-auto shrink-0 text-[10px] font-bold text-blue-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                    Change <ChevronRight size={11} />
                </button>
            </div>
        </div>
    )

    // ══════════════════════════════════════════════════════════════════════
    // PRODUCTS VIEW
    // ══════════════════════════════════════════════════════════════════════
    if (view === 'products') return (
        <div className="flex flex-col pb-28 lg:pb-10">
            <StationBanner />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-black text-gray-800">Available Items</h2>
                    <p className="text-xs text-gray-400">{products.length} products available</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchProducts} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {/* Cart button — always visible, shows count badge when items added */}
                    <button
                        onClick={() => setView('cart')}
                        className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white text-xs font-bold transition-all active:scale-95"
                    >
                        <ShoppingCart size={15} />
                        <span className="hidden sm:inline">Cart</span>
                        {cartItemCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#38bdf8] text-[#0d2a4a] text-[10px] font-black flex items-center justify-center shadow">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Product grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <Package size={32} className="text-gray-300" />
                    <p className="text-sm text-gray-500">No products available at this station.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {products.map(product => {
                        const inCart = getQtyInCart(product.product_id)
                        const outOfStock = product.quantity <= 0
                        const imgSrc = product.image_url
                            ? product.image_url.startsWith('http')
                                ? product.image_url
                                : `${API}${product.image_url}`
                            : null

                        return (
                            <div key={product.product_id}
                                className={`bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col transition-all
                                    ${outOfStock ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-0.5'}
                                    ${inCart > 0 ? 'border-[#0d2a4a]' : 'border-gray-100'}`}>

                                {/* Image */}
                                <div className="relative aspect-square bg-gradient-to-br from-[#e8f4fd] to-[#dbeeff] overflow-hidden">
                                    {imgSrc ? (
                                        <img src={imgSrc} alt={product.product_name}
                                            className="w-full h-full object-contain p-3"
                                            onError={e => { e.currentTarget.style.display = 'none' }} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Droplets size={32} className="text-[#38bdf8]/40" />
                                        </div>
                                    )}
                                    {/* Stock badge */}
                                    <div className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-lg
                                        ${outOfStock ? 'bg-red-500 text-white' : product.quantity <= 5 ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'}`}>
                                        {outOfStock ? 'OUT' : `${product.quantity} left`}
                                    </div>
                                    {/* Cart indicator */}
                                    {inCart > 0 && (
                                        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#0d2a4a] flex items-center justify-center">
                                            <span className="text-[9px] font-black text-white">{inCart}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3 flex flex-col gap-2 flex-1">
                                    <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-2">
                                        {product.product_name}
                                    </p>
                                    <p className="text-sm font-black text-[#0d2a4a]">
                                        ₱{Number(product.price).toFixed(2)}
                                    </p>

                                    {/* Qty controls or Add button */}
                                    {inCart > 0 ? (
                                        <div className="flex items-center justify-between gap-2 mt-auto">
                                            <button onClick={() => updateQty(product.product_id, -1)}
                                                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95">
                                                <Minus size={11} />
                                            </button>
                                            <span className="text-sm font-black text-gray-800">{inCart}</span>
                                            <button onClick={() => updateQty(product.product_id, 1)}
                                                disabled={inCart >= product.quantity}
                                                className="w-7 h-7 rounded-lg bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40">
                                                <Plus size={11} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => addToCart(product)}
                                            disabled={outOfStock}
                                            className="mt-auto w-full py-2 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
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

            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    )

    // ══════════════════════════════════════════════════════════════════════
    // CART & CHECKOUT VIEW
    // ══════════════════════════════════════════════════════════════════════
    return (
        <div className="flex flex-col pb-10">
            <StationBanner />

            {/* Back button */}
            <button onClick={() => setView('products')}
                className="flex items-center gap-1.5 text-sm font-bold text-[#0d2a4a] hover:text-[#38bdf8] mb-5 transition-colors w-fit">
                <ArrowLeft size={16} /> Continue Shopping
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── LEFT: Cart items ─── */}
                <div className="lg:col-span-2 flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-base font-black text-gray-800">Cart & Checkout</h2>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                            {cartItemCount} item{cartItemCount > 1 ? 's' : ''}
                        </span>
                    </div>

                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-16 text-center bg-white rounded-2xl border border-gray-100">
                            <ShoppingCart size={28} className="text-gray-300" />
                            <p className="text-sm text-gray-400">Your cart is empty</p>
                            <button onClick={() => setView('products')}
                                className="text-xs font-bold text-[#0d2a4a] hover:underline">
                                Browse products
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {cart.map(item => {
                                const imgSrc = item.image_url
                                    ? item.image_url.startsWith('http') ? item.image_url : `${API}${item.image_url}`
                                    : null
                                return (
                                    <div key={item.product_id}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                                        {/* Image */}
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#e8f4fd] to-[#dbeeff] flex items-center justify-center shrink-0 overflow-hidden">
                                            {imgSrc
                                                ? <img src={imgSrc} alt={item.product_name} className="w-full h-full object-contain p-1" />
                                                : <Droplets size={20} className="text-[#38bdf8]/50" />}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800 truncate">{item.product_name}</p>
                                            <p className="text-xs text-gray-400">₱{Number(item.price).toFixed(2)} each</p>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => updateQty(item.product_id, -1)}
                                                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center active:scale-95 transition-all">
                                                        <Minus size={11} />
                                                    </button>
                                                    <span className="text-sm font-black w-6 text-center">{item.qty}</span>
                                                    <button onClick={() => updateQty(item.product_id, 1)}
                                                        disabled={item.qty >= item.quantity}
                                                        className="w-7 h-7 rounded-lg bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-40">
                                                        <Plus size={11} />
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-400">Subtotal</p>
                                                    <p className="text-sm font-black text-[#0d2a4a]">
                                                        ₱{(item.price * item.qty).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remove */}
                                        <button onClick={() => removeFromCart(item.product_id)}
                                            className="shrink-0 w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Order summary + payment ─── */}
                <div className="flex flex-col gap-4">

                    {/* Order Summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#0d2a4a] flex items-center justify-center">
                                <ShoppingCart size={14} className="text-[#38bdf8]" />
                            </div>
                            <h3 className="text-sm font-black text-gray-800">Order Summary</h3>
                        </div>
                        <div className="p-5 flex flex-col gap-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Items</span>
                                <span className="font-bold text-gray-800">{cartItemCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-bold text-gray-800">₱{cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Delivery Fee</span>
                                <span className="font-bold text-emerald-500">FREE</span>
                            </div>
                            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                                <span className="text-sm font-black text-gray-800">Grand Total</span>
                                <span className="text-xl font-black text-[#0d2a4a]">₱{cartTotal.toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 leading-relaxed">
                                Note: Please ensure payment is completed before confirming your order.
                            </p>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#0d2a4a] flex items-center justify-center">
                                <Smartphone size={14} className="text-[#38bdf8]" />
                            </div>
                            <h3 className="text-sm font-black text-gray-800">Payment Method</h3>
                        </div>
                        <div className="p-4 flex flex-col gap-3">

                            {/* GCash option */}
                            <button
                                onClick={() => setPayMode('gcash')}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                                    ${payMode === 'gcash'
                                        ? 'border-[#0d2a4a] bg-[#0d2a4a]/5'
                                        : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                                    <Smartphone size={18} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800">GCash</p>
                                    <p className="text-[11px] text-gray-400">Pay via GCash and upload receipt</p>
                                </div>
                                {payMode === 'gcash' && <CheckCircle2 size={18} className="text-[#0d2a4a] shrink-0" />}
                            </button>

                            {/* GCash instructions + upload */}
                            {payMode === 'gcash' && (
                                <div className="flex flex-col gap-3 px-1">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                        <p className="text-[11px] font-bold text-blue-700 mb-1">GCash Payment Instructions:</p>
                                        <ol className="text-[11px] text-blue-600 flex flex-col gap-0.5 list-decimal list-inside">
                                            <li>Send payment to: <strong>0917-XXX-XXXX</strong></li>
                                            <li>Take a screenshot of the receipt</li>
                                            <li>Upload the screenshot below</li>
                                        </ol>
                                    </div>

                                    {/* Upload area */}
                                    <div
                                        onClick={() => fileRef.current?.click()}
                                        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
                                            ${receiptPreview
                                                ? 'border-emerald-300 bg-emerald-50'
                                                : 'border-gray-300 hover:border-[#38bdf8] hover:bg-blue-50'}`}
                                    >
                                        {receiptPreview ? (
                                            <div className="relative">
                                                <img src={receiptPreview} alt="Receipt"
                                                    className="w-full max-h-40 object-contain rounded-lg" />
                                                <button
                                                    onClick={e => { e.stopPropagation(); setReceipt(null); setReceiptPreview(null) }}
                                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow">
                                                    <X size={12} className="text-white" />
                                                </button>
                                                <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center justify-center gap-1">
                                                    <CheckCircle2 size={11} /> Receipt uploaded
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={20} className="text-gray-400 mx-auto mb-1.5" />
                                                <p className="text-xs font-bold text-gray-600">Upload Receipt</p>
                                                <p className="text-[10px] text-gray-400">Click to browse files</p>
                                            </>
                                        )}
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleReceiptPick}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Cash on Delivery */}
                            <button
                                onClick={() => setPayMode('cash_on_delivery')}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                                    ${payMode === 'cash_on_delivery'
                                        ? 'border-[#0d2a4a] bg-[#0d2a4a]/5'
                                        : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                                    <Banknote size={18} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800">Cash on Delivery</p>
                                    <p className="text-[11px] text-gray-400">Pay when you receive the order</p>
                                </div>
                                {payMode === 'cash_on_delivery' && <CheckCircle2 size={18} className="text-[#0d2a4a] shrink-0" />}
                            </button>

                            {/* Cash on Pickup */}
                            <button
                                onClick={() => setPayMode('cash_on_pickup')}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                                    ${payMode === 'cash_on_pickup'
                                        ? 'border-[#0d2a4a] bg-[#0d2a4a]/5'
                                        : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                                    <Banknote size={18} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800">Cash on Pickup</p>
                                    <p className="text-[11px] text-gray-400">Pick up and pay at the station</p>
                                </div>
                                {payMode === 'cash_on_pickup' && <CheckCircle2 size={18} className="text-[#0d2a4a] shrink-0" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm button */}
                    <button
                        onClick={handlePlaceOrder}
                        disabled={placing || cart.length === 0}
                        className="w-full py-4 rounded-2xl bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white font-black text-sm transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
                    >
                        {placing
                            ? <><Loader2 size={16} className="animate-spin" /> Placing Order…</>
                            : <><CheckCircle2 size={16} /> Confirm Order</>}
                    </button>
                </div>
            </div>

            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    )
}