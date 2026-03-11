import React from 'react'
import "../index.css"
import { Outlet } from 'react-router-dom'

const MainLayout = () => {
    return (
        <div className='bg-blue-50 min-h-screen w-screen'>
            <Outlet />
        </div>
    )
}

export default MainLayout
