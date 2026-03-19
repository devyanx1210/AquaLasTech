// router - defines all client-side routes and their layouts
import { createBrowserRouter } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

// Main Pages
import LandingPage from '../pages/LandingPage'
import NotFoundPage from '../pages/NotFoundPage'
import MainLayout from '../layout/MainLayout'
import ProtectedRoute from './ProtectedRoute'

// Admin
import AdminLayout from '../layout/AdminLayout'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminSettings from '../pages/admin/AdminSettings'
import AdminCustomerOrder from '../pages/admin/AdminCustomerOrder'
import PointOfSale from '../pages/admin/PointOfSale'
import AdminInventory from '../pages/admin/AdminInventory'

// Customer
import CustomerLayout from '../layout/CustomerLayout'
import CustomerDashboard from '../pages/customer/CustomerDashboard'
import CustomerOrder from '../pages/customer/CustomerOrder'
import CustomerSettings from '../pages/customer/CustomerSettings'

import SuperAdminRoute from '../components/SuperAdminRoute'
import SignupPage from '../pages/SignupPage'
import LoginPage from '../pages/LoginPage'

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        errorElement: <NotFoundPage />,
        children: [
            { index: true, element: <LandingPage /> },
            { path: "signup", element: <SignupPage /> },
            { path: "login", element: <LoginPage /> }
        ]
    },
    {
        path: "/admin",
        element: (
            <ProtectedRoute role="admin">
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="dashboard" replace /> },
            { path: "dashboard", element: <AdminDashboard /> },
            { path: "orders", element: <AdminCustomerOrder /> },  // ← no children
            { path: "pos", element: <PointOfSale /> },         // ← sibling, not child
            { path: "inventory", element: <AdminInventory /> },

            // Super admin only
            {
                element: <SuperAdminRoute />,
                children: [
                    { path: "settings", element: <AdminSettings /> },
                ]
            },
        ],
    },
    {
        path: "/customer",
        element: (
            <ProtectedRoute role="customer">
                <CustomerLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="dashboard" replace /> },
            { path: "dashboard", element: <CustomerDashboard /> },
            { path: "settings", element: <CustomerSettings /> },
            { path: "orders", element: <CustomerOrder /> },
        ]
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
])

export default router

