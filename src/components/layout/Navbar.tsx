import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useQuote } from '../../contexts/QuoteContext'
import CartDrawer from '../public/CartDrawer'

export default function Navbar() {
    const { cartTotalCount } = useQuote()
    const [isCartOpen, setIsCartOpen] = useState(false)
    return (
        <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined font-bold">celebration</span>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-ocean-deep dark:text-white">Facey's</h1>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `text-sm font-semibold transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`
                        }
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/catalog"
                        className={({ isActive }) =>
                            `text-sm font-semibold transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`
                        }
                    >
                        Rentals
                    </NavLink>
                    <NavLink
                        to="/catering"
                        className={({ isActive }) =>
                            `text-sm font-semibold transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`
                        }
                    >
                        Catering
                    </NavLink>
                </nav>

                <div className="flex items-center gap-4">
                    <Link
                        to="/request-quote"
                        className="hidden lg:flex px-5 py-2.5 bg-primary text-white rounded-full text-sm font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                    >
                        Request a Quote
                    </Link>
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="p-2 text-ocean-deep dark:text-white flex items-center relative hover:text-primary transition-all active:scale-90"
                    >
                        <span className="material-symbols-outlined">shopping_cart</span>
                        {cartTotalCount > 0 && (
                            <span className="absolute top-0 right-0 size-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                {cartTotalCount}
                            </span>
                        )}
                    </button>
                    <Link to="/admin" className="p-2 text-ocean-deep dark:text-white flex items-center hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">account_circle</span>
                    </Link>
                    <button className="md:hidden p-2 text-ocean-deep dark:text-white">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </div>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </header>
    )
}
