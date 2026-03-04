import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

interface Station {
    station_id: number
    station_name: string
    address: string
    contact_number: string
    status: string
    latitude: number | null
    longitude: number | null
}

export function useStation(stationId: number | null | undefined) {
    const [station, setStation] = useState<Station | null>(null)
    const [loading, setLoading] = useState(false)
    const [tick, setTick] = useState(0) // increment to trigger refetch

    const fetchStation = useCallback(() => {
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

    useEffect(() => {
        fetchStation()
    }, [fetchStation, tick])

    // Call refetch() after saving station details to update the layout instantly
    const refetch = useCallback(() => setTick(t => t + 1), [])

    return { station, loading, refetch }
}