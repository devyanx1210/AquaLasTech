// AuthContext - provides authenticated user state and login/logout actions
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";

type User = {
    user_id: number;
    full_name: string;
    email: string;
    role: "super_admin" | "admin" | "customer" | "sys_admin";
    station_id: number | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    complete_address: string | null;
    profile_picture: string | null;
} | null;

type AuthContextType = {
    user: User;
    loading: boolean;
    setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    setUser: () => { }
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/auth/me`, { withCredentials: true })
            .then(res => {
                const role = res.data.user?.role;
                if (res.data.token) {
                    if (role === 'customer') {
                        localStorage.setItem('authToken', res.data.token);
                        sessionStorage.removeItem('authToken');
                    } else {
                        sessionStorage.setItem('authToken', res.data.token);
                        localStorage.removeItem('authToken');
                    }
                }
                setUser(res.data.user);
            })
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);