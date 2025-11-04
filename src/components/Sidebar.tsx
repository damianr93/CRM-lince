import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart2, Users, Menu, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, authStore } from "@/utils/auth";

const navItems = [
    { label: "Análisis", icon: <BarChart2 size={20} />, path: "/home" },
    { label: "Clientes", icon: <Users size={20} />, path: "/clientes" },
    { label: "Satisfacción de clientes", icon: <Users size={20} />, path: "/satisfaccion" },
];

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await apiFetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
                method: "POST",
            });
        } catch (error) {
            console.error("Error al cerrar sesión", error);
        } finally {
            authStore.clear();
            setIsLoggingOut(false);
            setIsOpen(false);
            navigate("/login", { replace: true });
        }
    };

    const isActivePath = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    const navItemClasses = (path: string) => [
        "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors",
        isActivePath(path) ? "bg-secondary-light text-gold-400" : "hover:bg-secondary-light",
    ].join(" ");

    const handleNavigate = (path: string) => {
        setIsOpen(false);
        if (location.pathname !== path) {
            navigate(path);
        }
    };

    return (
        <>
            <button
                className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-full bg-primary text-white shadow-gaming"
                onClick={() => setIsOpen(true)}
                aria-label="Open sidebar"
            >
                <Menu size={24} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-50 z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(isOpen || true) && (
                    <motion.nav
                        className={`fixed top-0 left-0 h-full bg-gaming-bg-primary text-neutral-50 z-20 ${
                            isOpen ? "w-64" : "hidden md:block md:w-64"
                        }`}
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: "tween" }}
                        aria-label="Sidebar navigation"
                    >
                        <div className="h-full flex flex-col justify-between py-8 px-4">
                            <div>
                                <h2 className="text-2xl font-heading mb-8 text-gold-400">Dashboard</h2>
                                <ul className="space-y-4">
                                    {navItems.map((item) => (
                                        <li key={item.path}>
                                            <button
                                                type="button"
                                                className={navItemClasses(item.path)}
                                                onClick={() => handleNavigate(item.path)}
                                            >
                                                {item.icon}
                                                <span className="text-base font-medium">{item.label}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="w-full flex items-center justify-center gap-3 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed px-3 py-2 transition-colors"
                                >
                                    <LogOut size={18} />
                                    <span className="text-base font-medium">
                                        {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                                    </span>
                                </button>
                                <div className="text-sm text-neutral-400 text-center md:text-left">
                                    &copy; {new Date().getFullYear()} Lince SA
                                </div>
                            </div>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </>
    );
}
