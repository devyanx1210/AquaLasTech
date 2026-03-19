// ProfileAvatarUpload - circular avatar with a pen icon to upload/change photo
import { useRef } from 'react'
import { Pencil, Loader2, X } from 'lucide-react'

interface Props {
    name: string
    imageUrl?: string | null
    uploading?: boolean
    onUpload: (file: File) => void
    onRemove?: () => void
}

export default function ProfileAvatarUpload({ name, imageUrl, uploading, onUpload, onRemove }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const initials = name
        ? name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?'

    const API = import.meta.env.VITE_API_URL
    const src = imageUrl
        ? (imageUrl.startsWith('http') ? imageUrl : `${API}${imageUrl}`)
        : null

    return (
        <div className="relative w-20 h-20 shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-br from-[#38bdf8] to-[#0369a1] flex items-center justify-center select-none">
                {src
                    ? <img src={src} alt={name} className="w-full h-full object-cover" />
                    : <span className="text-xl font-black text-white">{initials}</span>
                }
            </div>

            {/* Edit/upload button */}
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#0d2a4a] border-2 border-white flex items-center justify-center shadow hover:bg-[#1a4a7a] transition-colors disabled:opacity-60"
                title="Change photo"
            >
                {uploading
                    ? <Loader2 size={10} className="text-white animate-spin" />
                    : <Pencil size={10} className="text-white" />
                }
            </button>

            {/* Remove button — only when there's a photo */}
            {src && onRemove && !uploading && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                    title="Remove photo"
                >
                    <X size={8} className="text-white" />
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }}
            />
        </div>
    )
}
