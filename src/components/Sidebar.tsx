import { useState } from 'react'
import { BarChart2, Users, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
    { label: 'Análisis', icon: <BarChart2 size={20} />, path: '/home' },
    { label: 'Clientes', icon: <Users size={20} />, path: '/clientes' },
]

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false)

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
                        className={`fixed top-0 left-0 h-full bg-gaming-bg-primary text-neutral-50 z-20 
              ${isOpen ? 'w-64' : 'hidden md:block md:w-64'}`}
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: 'tween' }}
                        aria-label="Sidebar navigation"
                    >
                        <div className="h-full flex flex-col justify-between py-8 px-4">
                            <div>
                                <h2 className="text-2xl font-heading mb-8 text-gold-400">
                                    Dashboard
                                </h2>
                                <ul className="space-y-4">
                                    {navItems.map((item) => (
                                        <li key={item.path}>
                                            <a
                                                href={item.path}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-secondary-light transition-colors"
                                            >
                                                {item.icon}
                                                <span className="text-base font-medium">
                                                    {item.label}
                                                </span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="hidden md:block">
                                <p className="text-sm text-neutral-400">
                                    &copy; {new Date().getFullYear()} Lince SA
                                </p>
                            </div>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </>
    )
}
