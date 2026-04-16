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
import MaintenanceGuard from '../components/MaintenanceGuard'
import SignupPage from '../pages/SignupPage'
import LoginPage from '../pages/LoginPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'

// System Admin
import SystemAdminLayout from '../layout/SystemAdminLayout'
import SAStations from '../pages/system-admin/SAStations'
import SALogs from '../pages/system-admin/SALogs'
import SAPayments from '../pages/system-admin/SAPayments'

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        errorElement: <NotFoundPage />,
        children: [
            { index: true, element: <LandingPage /> },
            { path: "signup", element: <SignupPage /> },
            { path: "login", element: <LoginPage /> },
            { path: "forgot-password", element: <ForgotPasswordPage /> },
            { path: "reset-password", element: <ResetPasswordPage /> }
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
                <MaintenanceGuard>
                    <CustomerLayout />
                </MaintenanceGuard>
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
        path: "/sysadmin",
        errorElement: <div className="p-8 text-red-600 font-mono text-sm whitespace-pre-wrap">Sysadmin route error — check console (F12)</div>,
        element: (
            <ProtectedRoute role="sys_admin">
                <SystemAdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="stations" replace /> },
            { path: "stations", element: <SAStations /> },
            { path: "payments", element: <SAPayments /> },
            { path: "logs", element: <SALogs /> },
        ],
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
])

export default router

