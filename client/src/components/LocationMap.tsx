// LocationMap - lazy-loaded Leaflet map for picking delivery address
// This component is lazy-loaded by CustomerSettings to avoid
// Leaflet's "illegal invocation" error on initial render.
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default marker icons (broken in Vite builds)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng) } })
    return null
}

interface Props {
    latitude: number | null
    longitude: number | null
    onPick: (lat: number, lng: number) => void
}

export default function LocationMap({ latitude, longitude, onPick }: Props) {
    // Default center: Marinduque, Philippines
    const center: [number, number] = latitude && longitude
        ? [Number(latitude), Number(longitude)]
        : [13.4125, 122.1]

    return (
        <div className="h-52 rounded-xl overflow-hidden border border-gray-200">
            <MapContainer
                center={center}
                zoom={latitude && longitude ? 14 : 10}
                className="w-full h-full"
                // key forces re-center when coords change from GPS
                key={`${latitude ?? 0}-${longitude ?? 0}`}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ClickHandler onPick={onPick} />
                {latitude && longitude && (
                    <Marker position={[Number(latitude), Number(longitude)]} />
                )}
            </MapContainer>
        </div>
    )
}