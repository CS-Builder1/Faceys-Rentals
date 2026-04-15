import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQuote } from '../../contexts/QuoteContext'
import { useAuth } from '../../contexts/AuthContext'
import CartDrawer from '../public/CartDrawer'
import UserProfileModal from '../UserProfileModal'

const navItems = [
    { label: 'Home', to: '/', end: true },
    { label: 'Rentals', to: '/catalog' },
    { label: 'Catering', to: '/catering' },
]

export default function Navbar() {
    const { cartTotalCount } = useQuote()
    const { firebaseUser, userProfile, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        setIsMobileMenuOpen(false)
        setIsUserMenuOpen(false)
    }, [location.pathname, location.hash])

    useEffect(() => {
        const previousOverflow = document.body.style.overflow

        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [isMobileMenuOpen])

    const userRole = userProfile?.role?.toUpperCase()
    const canAccessAdmin = userRole && ['ADMIN', 'MARKETING', 'ACCOUNTANT', 'OWNER'].includes(userRole)
    const isStaff = userRole === 'STAFF'
    const hasDashboardAccess = canAccessAdmin || isStaff
    const dashboardLink = isStaff ? '/staff/timeclock' : '/admin'
    const dashboardLabel = isStaff ? 'Staff Dashboard' : 'Admin Dashboard'

    const accountAction = () => {
        if (userRole === 'CLIENT') {
            navigate('/my-account')
        } else {
            setIsProfileOpen(true)
        }
        setIsUserMenuOpen(false)
        setIsMobileMenuOpen(false)
    }

    return (
        <header className="fixed top-0 w-full z-50 border-b border-primary/10 bg-white/85 shadow-sm shadow-slate-900/5 backdrop-blur-md dark:bg-background-dark/85">
            <div className="max-w-7xl mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
                <Link to="/" className="flex min-w-0 items-center gap-3">
                    <div className="size-9 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20 sm:size-10">
                        <span className="material-symbols-outlined font-bold">celebration</span>
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-extrabold tracking-tight text-ocean-deep dark:text-white sm:text-2xl">Facey&apos;s</h1>
                        <p className="hidden text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:block">
                            Events and Catering
                        </p>
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `text-sm font-semibold transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                    <Link
                        to="/request-quote"
                        className="hidden md:flex rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105 lg:px-5"
                    >
                        Request a Quote
                    </Link>

                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="p-2 text-ocean-deep dark:text-white flex items-center relative hover:text-primary transition-all active:scale-90"
                        aria-label="Open quote cart"
                    >
                        <span className="material-symbols-outlined">shopping_cart</span>
                        {cartTotalCount > 0 && (
                            <span className="absolute right-0 top-0 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-lg animate-in zoom-in duration-300">
                                {cartTotalCount}
                            </span>
                        )}
                    </button>

                    <div className="relative hidden md:block">
                        {firebaseUser ? (
                            <>
                                <button
                                    onClick={() => setIsUserMenuOpen((open) => !open)}
                                    className="p-2 text-ocean-deep dark:text-white flex items-center hover:text-primary transition-colors active:scale-90"
                                    title={userProfile?.name || 'Your Account'}
                                >
                                    <span className="material-symbols-outlined">account_circle</span>
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Account</p>
                                            <p className="text-sm font-bold truncate text-ocean-deep dark:text-white">{userProfile?.name || 'User'}</p>
                                        </div>

                                        {userRole !== 'ADMIN' && userRole !== 'OWNER' && (
                                            <button
                                                onClick={accountAction}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary flex items-center gap-2 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">person</span>
                                                {userRole === 'CLIENT' ? 'My Account' : 'My Profile'}
                                            </button>
                                        )}

                                        {hasDashboardAccess && (
                                            <Link
                                                to={dashboardLink}
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary flex items-center gap-2 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">dashboard</span>
                                                {dashboardLabel}
                                            </Link>
                                        )}

                                        <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                                            <button
                                                onClick={() => {
                                                    void logout()
                                                    setIsUserMenuOpen(false)
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">logout</span>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link
                                to="/admin/login"
                                className="p-2 text-ocean-deep dark:text-white flex items-center hover:text-primary transition-colors"
                                title="Sign In"
                            >
                                <span className="material-symbols-outlined">account_circle</span>
                            </Link>
                        )}
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen((open) => !open)}
                        className="rounded-full bg-slate-100 p-2 text-ocean-deep transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 md:hidden"
                        aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    >
                        <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        className="fixed inset-0 top-16 z-[-1] bg-slate-900/20 md:hidden sm:top-20"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="md:hidden border-t border-primary/10 bg-white dark:bg-background-dark shadow-2xl">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4 max-h-[calc(100dvh-4rem)] overflow-y-auto sm:max-h-[calc(100dvh-5rem)]">
                            <div className="rounded-2xl border border-primary/10 bg-sand-warm/30 p-4 text-sm text-slate-600 dark:bg-white/5 dark:text-white/70">
                                Browse rentals, explore catering, or send us your quote request from any device.
                            </div>
                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `px-4 py-3 rounded-2xl font-bold transition-colors ${isActive ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-white/80'}`
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                            <Link
                                to="/request-quote"
                                className="px-4 py-3 rounded-2xl font-bold bg-ocean-deep text-white shadow-lg shadow-ocean-deep/20"
                            >
                                Request a Quote
                            </Link>
                        </nav>

                        <div className="border-t border-slate-200 dark:border-white/10 pt-4 space-y-2">
                            {firebaseUser ? (
                                <>
                                    {userRole !== 'ADMIN' && userRole !== 'OWNER' && (
                                        <button
                                            onClick={accountAction}
                                            className="w-full text-left px-4 py-3 rounded-2xl font-bold bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-white/80"
                                        >
                                            {userRole === 'CLIENT' ? 'My Account' : 'My Profile'}
                                        </button>
                                    )}
                                    {hasDashboardAccess && (
                                        <Link
                                            to={dashboardLink}
                                            className="block px-4 py-3 rounded-2xl font-bold bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-white/80"
                                        >
                                            {dashboardLabel}
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => {
                                            void logout()
                                            setIsMobileMenuOpen(false)
                                        }}
                                        className="w-full text-left px-4 py-3 rounded-2xl font-bold bg-red-50 text-red-600"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/admin/login"
                                    className="block px-4 py-3 rounded-2xl font-bold bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-white/80"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                    </div>
                </>
            )}

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            {userProfile && (
                <UserProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    user={userProfile}
                />
            )}
        </header>
    )
}
