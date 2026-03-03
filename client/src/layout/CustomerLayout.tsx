import React from 'react'
import { Outlet } from 'react-router-dom'

export default function CustomerLayout() {
    return (
        <div className='customer-layout h-screen w-screen'>
            <Outlet />
        </div>
    )
}


// README handlelogout with backend logic
// const handleLogout = async () => {
//     await axios.post("http://localhost:8080/auth/logout", {}, { withCredentials: true });
//     setUser(null);
//     navigate("/");
// };