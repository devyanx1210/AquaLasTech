// MaintenanceGuard - wraps customer routes; shows MaintenancePage if station is under maintenance
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import axios from 'axios'
import MaintenancePage from '../pages/MaintenancePage'

const MaintenanceGuard = ({ children }: { children: ReactNode }) => {
    const [isMaintenance, setIsMaintenance] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/settings/maintenance-status`, { withCredentials: true })
            .then(res => setIsMaintenance(res.data.is_maintenance))
            .catch(() => setIsMaintenance(false))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return null
    if (isMaintenance) return <MaintenancePage />
    return <>{children}</>
}

export default MaintenanceGuard
