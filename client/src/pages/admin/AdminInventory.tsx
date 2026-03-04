import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import {
    Plus, Search, Edit2, RefreshCw,
    AlertTriangle, CheckCircle2, AlertCircle,
    Loader2, X, ChevronDown, ImageIcon,
    Droplets, Package, Trash2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
interface Product {
    product_id: number
    product_name: string
    description: string | null
    price: number
    unit: string
    image_url: string | null
    is_active: number
    quantity: number
    min_stock_level: number
    inventory_id: number
}

type ModalMode = 'add' | 'edit' | 'restock' | null
type ToastType = 'success' | 'error'
interface ToastData { message: string; type: ToastType }

// ── Helpers ────────────────────────────────────────────────────────────────
const stockStatus = (qty: number, min: number) => {
    if (qty === 0) return { label: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' }
    if (qty <= min) return { label: 'Low Stock', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' }
    return { label: 'In Stock', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' }
}
const fmt = (p: number) => `₱${Number(p).toFixed(2)}`

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ toast, onDone }: { toast: ToastData; onDone: () => void }) => {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
    return (
        <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium
            ${toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <AlertCircle size={16} className="text-red-500 shrink-0" />}
            {toast.message}
        </div>
    )
}

// ── Modal Shell ────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">{title}</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={16} />
                </button>
            </div>
            <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
    </div>
)

const inputCls = (err?: string) =>
    `w-full bg-gray-50 border rounded-xl text-sm text-gray-800 placeholder:text-gray-300 outline-none px-4 py-2.5
     focus:border-[#38bdf8] focus:bg-white focus:ring-2 focus:ring-[#38bdf8]/15 transition-all
     ${err ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`

const FL = ({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
        {children}
        {hint && !error && <p className="text-[10px] text-gray-400">{hint}</p>}
        {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
)

// ══════════════════════════════════════════════════════════════════════════
export default function AdminInventory() {
    const { user } = useAuth()
    const API = import.meta.env.VITE_API_URL

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState<ModalMode>(null)
    const [selected, setSelected] = useState<Product | null>(null)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<ToastData | null>(null)
    const showToast = useCallback((m: string, t: ToastType) => setToast({ message: m, type: t }), [])

    const emptyForm = { product_name: '', description: '', price: '', unit: 'gallon', image_url: '', min_stock_level: '5', is_active: true }
    const [form, setForm] = useState(emptyForm)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})
    const [restockQty, setRestockQty] = useState('')
    const [restockNotes, setRestockNotes] = useState('')
    const [restockError, setRestockError] = useState('')
    const [uploadingImage, setUploadingImage] = useState(false)

    // ── Upload image to server ─────────────────────────────────────────────
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingImage(true)
        try {
            const formData = new FormData()
            formData.append('image', file)
            const res = await axios.post(`${API}/inventory/upload-image`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            setForm(f => ({ ...f, image_url: res.data.image_url }))
            showToast('Image uploaded!', 'success')
        } catch {
            showToast('Failed to upload image', 'error')
        } finally {
            setUploadingImage(false)
            e.target.value = ''
        }
    }

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API}/inventory`, { withCredentials: true })
            setProducts(res.data)
        } catch { showToast('Failed to load inventory', 'error') }
        finally { setLoading(false) }
    }, [API])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    useEffect(() => {
        if (products.length === 0) return
        axios.post(`${API}/inventory/check-low-stock`, {}, { withCredentials: true }).catch(() => { })
    }, [products])

    const filtered = products.filter(p =>
        p.product_name.toLowerCase().includes(search.toLowerCase())
    )

    const openAdd = () => { setForm(emptyForm); setFormErrors({}); setSelected(null); setModal('add') }
    const openEdit = (p: Product) => {
        setForm({ product_name: p.product_name, description: p.description ?? '', price: String(p.price), unit: p.unit, image_url: p.image_url ?? '', min_stock_level: String(p.min_stock_level), is_active: Boolean(p.is_active) })
        setFormErrors({}); setSelected(p); setModal('edit')
    }
    const openRestock = (p: Product) => { setSelected(p); setRestockQty(''); setRestockNotes(''); setRestockError(''); setModal('restock') }
    const closeModal = () => { setModal(null); setSelected(null) }

    const validateForm = () => {
        const e: Record<string, string> = {}
        if (!form.product_name.trim()) e.product_name = 'Required'
        if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Enter valid price'
        if (!form.unit.trim()) e.unit = 'Required'
        setFormErrors(e); return Object.keys(e).length === 0
    }

    const handleSaveProduct = async () => {
        if (!validateForm()) return
        setSaving(true)
        try {
            const payload = { product_name: form.product_name.trim(), description: form.description.trim() || null, price: Number(form.price), unit: form.unit, image_url: form.image_url.trim() || null, min_stock_level: Number(form.min_stock_level), is_active: form.is_active ? 1 : 0 }
            if (modal === 'add') await axios.post(`${API}/inventory/products`, payload, { withCredentials: true })
            else await axios.put(`${API}/inventory/products/${selected!.product_id}`, payload, { withCredentials: true })
            showToast(modal === 'add' ? 'Product added!' : 'Product updated!', 'success')
            closeModal(); fetchProducts()
        } catch (err: any) { showToast(err.response?.data?.message ?? 'Failed to save', 'error') }
        finally { setSaving(false) }
    }

    const handleRestock = async () => {
        if (!restockQty || Number(restockQty) <= 0) { setRestockError('Enter a valid quantity'); return }
        setSaving(true)
        try {
            await axios.post(`${API}/inventory/restock`, { inventory_id: selected!.inventory_id, product_id: selected!.product_id, quantity: Number(restockQty), notes: restockNotes.trim() || null }, { withCredentials: true })
            showToast(`Restocked ${restockQty} ${selected!.unit}(s)`, 'success')
            closeModal(); fetchProducts()
        } catch (err: any) { showToast(err.response?.data?.message ?? 'Failed to restock', 'error') }
        finally { setSaving(false) }
    }

    const handleDeleteProduct = async (p: Product) => {
        if (!window.confirm(`Delete "${p.product_name}"? This cannot be undone.`)) return
        try {
            await axios.delete(`${API}/inventory/products/${p.product_id}`, { withCredentials: true })
            showToast(`"${p.product_name}" deleted`, 'success')
            fetchProducts()
        } catch (err: any) {
            showToast(err.response?.data?.message ?? 'Failed to delete', 'error')
        }
    }

    const units = ['gallon', 'liter', 'bottle', 'jug', 'container', 'pack', 'piece']

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-4 pb-10">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-800">Products</h1>
                <p className="text-xs text-gray-400 mt-0.5">Manage your water refilling products and stock</p>
            </div>

            {/* Low stock warning banner */}
            {products.filter(p => Number(p.quantity) <= Number(p.min_stock_level)).length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">
                        {products.filter(p => Number(p.quantity) <= Number(p.min_stock_level)).length} product(s) are low on stock or out of stock
                    </p>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    placeholder="Search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/15 transition-all shadow-sm"
                />
            </div>

            {/* Main layout: card grid LEFT + stock panel RIGHT */}
            <div className="flex gap-4 items-start flex-col lg:flex-row">

                {/* ── LEFT: Product Cards Grid ─────────────────────────── */}
                <div className="flex-1 min-w-0">
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 aspect-[3/4] animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map(p => {
                                const status = stockStatus(p.quantity, p.min_stock_level)
                                return (
                                    <div
                                        key={p.product_id}
                                        className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all group relative flex flex-col overflow-hidden"
                                    >
                                        {/* Edit button — top right, always visible on touch, hover on desktop */}
                                        <button
                                            onClick={() => openEdit(p)}
                                            className="absolute top-2 right-2 z-20 w-7 h-7 rounded-lg bg-[#0d2a4a]/80 hover:bg-[#0d2a4a] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                            title="Edit product"
                                        >
                                            <Edit2 size={12} />
                                        </button>

                                        {/* Stock badge — top left */}
                                        {p.quantity === 0 && (
                                            <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                                <X size={9} /> OUT
                                            </div>
                                        )}
                                        {p.quantity > 0 && p.quantity <= p.min_stock_level && (
                                            <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                                <AlertTriangle size={9} /> LOW
                                            </div>
                                        )}

                                        {/* Image — square crop, fills most of card */}
                                        <div className="w-full aspect-square bg-gradient-to-br from-[#e8f4fd] to-[#d0e8f7] flex items-center justify-center overflow-hidden shrink-0">
                                            {p.image_url ? (
                                                <img
                                                    src={p.image_url.startsWith('http') ? p.image_url : `${import.meta.env.VITE_API_URL}${p.image_url}`}
                                                    alt={p.product_name}
                                                    className="w-full h-full object-cover"
                                                    onError={e => { e.currentTarget.style.display = 'none' }}
                                                />
                                            ) : (
                                                <Droplets size={40} className="text-[#38bdf8]/40" />
                                            )}
                                        </div>

                                        {/* Info strip below image */}
                                        <div className="px-3 py-2.5 flex flex-col gap-0.5 bg-white">
                                            <p className="text-xs font-bold text-gray-800 truncate leading-tight">{p.product_name}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-[#0d2a4a]">{fmt(p.price)}</span>
                                                <span className={`text-[10px] font-bold
                                                    ${p.quantity === 0 ? 'text-red-500' : p.quantity <= p.min_stock_level ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                    {p.quantity} {p.unit}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Add product card */}
                            <button
                                onClick={openAdd}
                                className="bg-[#e8f4fd]/60 border-2 border-dashed border-[#38bdf8]/40 rounded-2xl flex flex-col overflow-hidden hover:bg-[#e8f4fd] hover:border-[#38bdf8]/70 transition-all group"
                            >
                                <div className="w-full aspect-square flex flex-col items-center justify-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-[#0d2a4a] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Plus size={20} className="text-white" />
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">Add Product</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Stock Panel ───────────────────────────────── */}
                <div className="w-full lg:w-80 shrink-0">
                    <div className="bg-[#b8d8ec] rounded-2xl overflow-hidden shadow-sm">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-[#9dc8e0] flex items-center justify-between">
                            <h2 className="text-sm font-bold text-[#0d2a4a]">In Stock</h2>
                            <span className="text-[11px] font-semibold text-[#0d2a4a]/50">{products.length} item{products.length !== 1 ? 's' : ''}</span>
                        </div>

                        {loading ? (
                            <div className="px-4 py-4 flex flex-col gap-2">
                                {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-[#9dc8e0]/40 rounded-xl animate-pulse" />)}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <Package size={28} className="text-[#0d2a4a]/20 mx-auto mb-2" />
                                <p className="text-xs text-[#0d2a4a]/50 font-medium">No products yet</p>
                            </div>
                        ) : (
                            <div className="overflow-y-auto max-h-[520px] lg:max-h-[600px]">
                                {products.map((p, i) => {
                                    const status = stockStatus(Number(p.quantity), Number(p.min_stock_level))
                                    return (
                                        <div key={p.product_id}
                                            className={`flex items-center gap-3 px-4 py-3 hover:bg-[#a8cde5]/40 transition-colors ${i !== 0 ? 'border-t border-[#9dc8e0]/50' : ''}`}>
                                            {/* Thumbnail */}
                                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/60 border border-[#9dc8e0] shrink-0 flex items-center justify-center">
                                                {p.image_url
                                                    ? <img src={p.image_url.startsWith('http') ? p.image_url : `${import.meta.env.VITE_API_URL}${p.image_url}`}
                                                        alt={p.product_name} className="w-full h-full object-cover" />
                                                    : <Droplets size={14} className="text-[#38bdf8]/70" />}
                                            </div>

                                            {/* Name + status */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[#0d2a4a] leading-tight" style={{ wordBreak: 'break-word' }}>{p.product_name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                                                    <span className={`text-[10px] font-semibold ${status.color}`}>{status.label}</span>
                                                </div>
                                            </div>

                                            {/* Stock + price */}
                                            <div className="text-right shrink-0">
                                                <p className={`text-sm font-black ${Number(p.quantity) === 0 ? 'text-red-600' : Number(p.quantity) <= Number(p.min_stock_level) ? 'text-amber-700' : 'text-[#0d2a4a]'}`}>
                                                    {p.quantity}
                                                </p>
                                                <p className="text-[10px] text-[#0d2a4a]/50 font-medium">{fmt(p.price)}</p>
                                            </div>

                                            {/* Restock btn */}
                                            <button
                                                onClick={() => openRestock(p)}
                                                title="Restock"
                                                className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-[#0d2a4a]/10 hover:bg-[#0d2a4a]/25 text-[#0d2a4a] transition-all"
                                            >
                                                <RefreshCw size={12} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ ADD / EDIT MODAL ══════════════════════════════════════════ */}
            {(modal === 'add' || modal === 'edit') && (
                <Modal title={modal === 'add' ? 'Add New Product' : `Edit — ${selected?.product_name}`} onClose={closeModal}>
                    <div className="flex flex-col gap-4">
                        <FL label="Product Name" error={formErrors.product_name}>
                            <input placeholder="e.g. 5-Gallon Slim Jug" value={form.product_name}
                                onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                                className={inputCls(formErrors.product_name)} />
                        </FL>

                        <FL label="Description" hint="Optional">
                            <input placeholder="Brief description" value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className={inputCls()} />
                        </FL>

                        <div className="grid grid-cols-2 gap-3">
                            <FL label="Price (₱)" error={formErrors.price}>
                                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.price}
                                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                    className={inputCls(formErrors.price)} />
                            </FL>
                            <FL label="Unit" error={formErrors.unit}>
                                <div className="relative">
                                    <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                                        className={`${inputCls(formErrors.unit)} appearance-none pr-8`}>
                                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </FL>
                        </div>

                        <FL label="Low Stock Threshold" error={formErrors.min_stock_level} hint="Notification triggers when stock reaches this level">
                            <input type="number" min="0" placeholder="5" value={form.min_stock_level}
                                onChange={e => setForm(f => ({ ...f, min_stock_level: e.target.value }))}
                                className={inputCls(formErrors.min_stock_level)} />
                        </FL>

                        <FL label="Product Image" hint="Upload a photo from your device (max 5MB)">
                            <div className="flex flex-col gap-2">
                                {/* Preview */}
                                {form.image_url && (
                                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                        <img src={form.image_url.startsWith('http') ? form.image_url : `${import.meta.env.VITE_API_URL}${form.image_url}`}
                                            alt="preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                                            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                                {/* Upload button */}
                                <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all
                                    ${uploadingImage ? 'border-[#38bdf8] bg-[#38bdf8]/5' : 'border-gray-200 hover:border-[#38bdf8] hover:bg-[#38bdf8]/5'}
                                    ${form.image_url ? 'border-solid border-gray-200' : ''}`}>
                                    <input type="file" accept="image/*" className="hidden"
                                        onChange={handleImageUpload} disabled={uploadingImage} />
                                    {uploadingImage
                                        ? <><Loader2 size={14} className="animate-spin text-[#38bdf8]" /><span className="text-xs text-[#38bdf8] font-medium">Uploading…</span></>
                                        : <><ImageIcon size={14} className="text-gray-400" /><span className="text-xs text-gray-500 font-medium">{form.image_url ? 'Change Photo' : 'Upload Photo'}</span></>
                                    }
                                </label>
                            </div>
                        </FL>

                        {modal === 'edit' && (
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <div onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                    className={`w-10 h-5 rounded-full transition-all relative ${form.is_active ? 'bg-[#0d2a4a]' : 'bg-gray-200'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                                </div>
                                <span className="text-sm text-gray-600 font-medium">{form.is_active ? 'Active' : 'Inactive'}</span>
                            </label>
                        )}

                        <div className="flex gap-3 pt-1">
                            {modal === 'edit' && (
                                <button onClick={() => { closeModal(); handleDeleteProduct(selected!) }}
                                    className="px-3 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 transition-all flex items-center justify-center">
                                    <Trash2 size={15} />
                                </button>
                            )}
                            <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-all">Cancel</button>
                            <button onClick={handleSaveProduct} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-[#0d2a4a] hover:bg-[#1a4a7a] text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : modal === 'add' ? 'Add Product' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ══ RESTOCK MODAL ════════════════════════════════════════════ */}
            {modal === 'restock' && selected && (
                <Modal title={`Restock — ${selected.product_name}`} onClose={closeModal}>
                    <div className="flex flex-col gap-4">
                        {/* Product summary */}
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#e8f4fd] border border-[#b8d8ec]">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0 flex items-center justify-center">
                                {selected.image_url
                                    ? <img src={selected.image_url.startsWith('http') ? selected.image_url : `${import.meta.env.VITE_API_URL}${selected.image_url}`} alt={selected.product_name} className="w-full h-full object-cover" />
                                    : <Droplets size={18} className="text-[#38bdf8]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#0d2a4a] truncate">{selected.product_name}</p>
                                <p className="text-xs text-gray-500">{fmt(selected.price)} / {selected.unit}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={`text-xl font-black ${selected.quantity === 0 ? 'text-red-500' : selected.quantity <= selected.min_stock_level ? 'text-amber-500' : 'text-[#0d2a4a]'}`}>
                                    {selected.quantity}
                                </p>
                                <p className="text-[10px] text-gray-400">current</p>
                            </div>
                        </div>

                        <FL label={`Add Quantity (${selected.unit}s)`} error={restockError}>
                            <input type="number" min="1" placeholder="Enter quantity to add"
                                value={restockQty}
                                onChange={e => { setRestockQty(e.target.value); setRestockError('') }}
                                className={inputCls(restockError)}
                                autoFocus />
                        </FL>

                        {/* Live preview */}
                        {restockQty && Number(restockQty) > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                <div className="text-xs text-emerald-600">
                                    <span className="font-medium">{selected.quantity}</span>
                                    <span className="text-emerald-400 mx-2">+</span>
                                    <span className="font-medium">{restockQty}</span>
                                </div>
                                <div className="text-sm font-black text-emerald-700">
                                    = {Number(selected.quantity) + Number(restockQty)} {selected.unit}s
                                </div>
                            </div>
                        )}

                        <FL label="Notes" hint="Optional — reason or supplier">
                            <input placeholder="e.g. Weekly delivery from supplier"
                                value={restockNotes}
                                onChange={e => setRestockNotes(e.target.value)}
                                className={inputCls()} />
                        </FL>

                        <div className="flex gap-3 pt-1">
                            <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-all">Cancel</button>
                            <button onClick={handleRestock} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {saving ? <><Loader2 size={14} className="animate-spin" /> Restocking…</> : <><RefreshCw size={14} /> Confirm Restock</>}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
        </div>
    )
}