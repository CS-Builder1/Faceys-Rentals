import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../types'

const getSidebarItems = (role?: UserRole) => {
    const items = [
        { icon: 'dashboard', label: 'Dashboard', path: '/admin', roles: [UserRole.Admin, UserRole.Accountant] },
        { icon: 'calendar_today', label: 'Calendar', path: '/admin/calendar', roles: [UserRole.Admin] },
        { icon: 'inventory_2', label: 'Inventory', path: '/admin/inventory', roles: [UserRole.Admin, UserRole.Marketing] },
        { icon: 'description', label: 'Quotes', path: '/admin/quotes', roles: [UserRole.Admin, UserRole.Accountant] },
        { icon: 'receipt_long', label: 'Invoices', path: '/admin/invoices', roles: [UserRole.Admin, UserRole.Accountant] },
        { icon: 'group', label: 'Customers', path: '/admin/customers', roles: [UserRole.Admin] },
        { icon: 'schedule', label: 'Timeclock', path: '/staff/timeclock', roles: [UserRole.Admin, UserRole.Staff, UserRole.Marketing, UserRole.Accountant] },
        { icon: 'payments', label: 'Payroll', path: '/admin/payroll', roles: [UserRole.Admin, UserRole.Accountant] },
        { icon: 'campaign', label: 'Site Content', path: '/admin/content', roles: [UserRole.Admin, UserRole.Marketing] },
        { icon: 'settings', label: 'Settings', path: '/admin/settings', roles: [UserRole.Admin] },
    ]
    return items.filter(item => role && item.roles.includes(role))
}

export default function AdminLayout() {
    const { firebaseUser, userProfile, logout } = useAuth()
    const location = useLocation()

    // Determine active item based on current path
    const sidebarItems = getSidebarItems(userProfile?.role as UserRole).map(item => ({
        ...item,
        active: location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
    }))

    const initials = userProfile?.name ? userProfile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'PF'
    const name = userProfile?.name || firebaseUser?.email || 'Patrick Facey'
    const role = userProfile?.role || 'Site Owner'

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-background-dark">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-white/5 border-r border-slate-200 dark:border-white/10 z-50 overflow-y-auto hide-scrollbar">
                <div className="p-8 space-y-10">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined font-bold">celebration</span>
                        </div>
                        <h1 className="text-2xl font-black text-ocean-deep dark:text-white">Facey's</h1>
                    </Link>

                    <nav className="space-y-2">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all ${item.active
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-ocean-deep dark:hover:text-white'
                                    }`}
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="pt-10 space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
                            {userProfile?.role === UserRole.Staff ? 'Staff Session' : 'Admin Session'}
                        </h3>
                        <div className="flex items-center gap-4 px-4 py-3 bg-ocean-deep rounded-2xl text-white shadow-xl shadow-ocean-deep/20">
                            <div className="size-10 bg-white/20 rounded-full flex items-center justify-center font-black">{initials}</div>
                            <div className="flex-grow truncate">
                                <span className="block text-sm font-bold truncate max-w-[120px]">{name}</span>
                                <span className="text-[10px] text-white/60 uppercase font-black tracking-tighter truncate max-w-[120px] block">{role}</span>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all mt-4"
                        >
                            <span className="material-symbols-outlined">logout</span>
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow ml-72">
                <Outlet />
            </main>
        </div>
    )
}
