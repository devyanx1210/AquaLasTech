import { useState, useEffect } from 'react'
import axios from 'axios'

interface Station {
    station_id: number
    station_name: string
    address: string
    contact_number: string
    status: string
}

export function useStation(stationId: number | null | undefined) {
    const [station, setStation] = useState<Station | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!stationId) return

        setLoading(true)
        axios
            .get(`${import.meta.env.VITE_API_URL}/stations/${stationId}`, {
                withCredentials: true,
            })
            .then(res => setStation(res.data))
            .catch(() => setStation(null))
            .finally(() => setLoading(false))
    }, [stationId])

    return { station, loading }
}