import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
    role: "admin" | "customer";
    children: React.ReactNode;
};

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

    // If logged in but wrong role, redirect to their correct dashboard
    if (user.role !== role) {
        return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/customer/dashboard"} replace />;
    }

    return <>{children}</>;
}