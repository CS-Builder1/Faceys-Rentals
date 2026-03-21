import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuote } from '../../contexts/QuoteContext'
import { useAuth } from '../../contexts/AuthContext'
import CartDrawer from '../public/CartDrawer'
import UserProfileModal from '../UserProfileModal'

export default function Navbar() {
    const { cartTotalCount } = useQuote()
    const { firebaseUser, userProfile } = useAuth()
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const { logout } = useAuth()
    const navigate = useNavigate()

    const userRole = userProfile?.role?.toUpperCase()
    const canAccessAdmin = userRole && ['ADMIN', 'MARKETING', 'ACCOUNTANT', 'OWNER'].includes(userRole)
    const isStaff = userRole === 'STAFF'
    const hasDashboardAccess = canAccessAdmin || isStaff
    const dashboardLink = isStaff ? '/staff/timeclock' : '/admin'
    const dashboardLabel = isStaff ? 'Staff Dashboard' : 'Admin Dashboard'

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
                    
                    <div className="relative">
                        {firebaseUser ? (
                            <>
                                <button 
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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
                                                onClick={() => {
                                                    if (userRole === 'CLIENT') {
                                                        navigate('/my-account');
                                                    } else {
                                                        setIsProfileOpen(true);
                                                    }
                                                    setIsUserMenuOpen(false);
                                                }}
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
                                                    logout();
                                                    setIsUserMenuOpen(false);
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
                            <Link to="/admin/login" className="p-2 text-ocean-deep dark:text-white flex items-center hover:text-primary transition-colors" title="Sign In">
                                <span className="material-symbols-outlined">account_circle</span>
                            </Link>
                        )}
                    </div>

                    <button className="md:hidden p-2 text-ocean-deep dark:text-white">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </div>

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
