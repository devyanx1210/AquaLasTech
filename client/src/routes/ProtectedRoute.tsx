import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
    role: "admin" | "customer";
    children: React.ReactNode;
};

// Roles that are allowed into the /admin layout
const ADMIN_ROLES = ["admin", "super_admin"]

function getRedirect(userRole: string): string {
    if (ADMIN_ROLES.includes(userRole)) return "/admin/dashboard"
    return "/customer/dashboard"
}

export default function ProtectedRoute({ role, children }: Props) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <span className="text-gray-500 text-sm">Loading...</span>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    // Check access:
    // - "admin" role prop → allow both "admin" and "super_admin"
    // - "customer" role prop → allow only "customer"
    const hasAccess = role === "admin"
        ? ADMIN_ROLES.includes(user.role)
        : user.role === role

    if (!hasAccess) {
        return <Navigate to={getRedirect(user.role)} replace />;
    }

    return <>{children}</>;
}