import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart2, HeartHandshake, Menu, LogOut, Moon, Sun, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, authStore } from "@/utils/auth";
import { useTheme } from "@/context/ThemeContext";

const navItems = [
    { label: "Análisis", icon: <BarChart2 size={18} />, path: "/home" },
    { label: "Clientes", icon: <Users size={18} />, path: "/clientes" },
    { label: "Satisfacción", icon: <HeartHandshake size={18} />, path: "/satisfaccion" },
];

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

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
        "w-full flex items-center gap-3 py-2 px-3 rounded-lg text-sm transition-colors",
        isActivePath(path)
            ? "bg-yellow-400/10 text-gray-800 dark:text-yellow-400 border border-yellow-400/20"
            : "text-neutral-500 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-neutral-100 border border-transparent",
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
                className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-neutral-200 shadow-md"
                onClick={() => setIsOpen(true)}
                aria-label="Open sidebar"
            >
                <Menu size={20} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 z-10"
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
                        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700/50 z-20 ${
                            isOpen ? "w-64" : "hidden md:block md:w-64"
                        }`}
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: "tween" }}
                        aria-label="Sidebar navigation"
                    >
                        <div className="h-full flex flex-col justify-between py-5 px-3">
                            {/* Header */}
                            <div>
                                <div className="px-2 mb-6">
                                    <span className="text-lg font-bold font-heading text-gray-800 dark:text-yellow-400 tracking-wide">Lince</span>
                                    <span className="block text-xs text-neutral-500 mt-0.5">CRM de Producción</span>
                                </div>

                                <ul className="space-y-1">
                                    {navItems.map((item) => (
                                        <li key={item.path}>
                                            <button
                                                type="button"
                                                className={navItemClasses(item.path)}
                                                onClick={() => handleNavigate(item.path)}
                                            >
                                                {item.icon}
                                                <span className="font-medium">{item.label}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Footer */}
                            <div className="space-y-1">
                                {/* Toggle tema */}
                                <button
                                    onClick={toggleTheme}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent transition-colors"
                                >
                                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                                    <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
                                </button>
                                <p className="text-xs text-neutral-400 dark:text-neutral-600 px-2 pt-1">
                                    &copy; {new Date().getFullYear()} Lince SA
                                </p>
                            </div>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </>
    );
}
