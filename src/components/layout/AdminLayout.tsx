import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../types'

const getSidebarItems = (role?: UserRole) => {
    const items = [
        { icon: 'dashboard', label: 'Dashboard', path: '/admin', roles: [UserRole.Owner, UserRole.Admin, UserRole.Accountant] },
        { icon: 'calendar_today', label: 'Calendar', path: '/admin/calendar', roles: [UserRole.Owner, UserRole.Admin] },
        { icon: 'inventory_2', label: 'Inventory', path: '/admin/inventory', roles: [UserRole.Owner, UserRole.Admin, UserRole.Marketing] },
        { icon: 'description', label: 'Quotes', path: '/admin/quotes', roles: [UserRole.Owner, UserRole.Admin, UserRole.Accountant] },
        { icon: 'receipt_long', label: 'Invoices', path: '/admin/invoices', roles: [UserRole.Owner, UserRole.Admin, UserRole.Accountant] },
        { icon: 'group', label: 'Customers', path: '/admin/customers', roles: [UserRole.Owner, UserRole.Admin] },
        { icon: 'schedule', label: 'Timeclock', path: '/staff/timeclock', roles: [UserRole.Owner, UserRole.Admin, UserRole.Staff, UserRole.Marketing, UserRole.Accountant] },
        { icon: 'payments', label: 'Payroll', path: '/admin/payroll', roles: [UserRole.Owner, UserRole.Admin, UserRole.Accountant] },
        { icon: 'campaign', label: 'Site Content', path: '/admin/content', roles: [UserRole.Owner, UserRole.Admin, UserRole.Marketing] },
        { icon: 'settings', label: 'Settings', path: '/admin/settings', roles: [UserRole.Owner, UserRole.Admin] },
    ]

    return items.filter((item) => role && item.roles.includes(role))
}

interface SidebarContentProps {
    sidebarItems: Array<{ icon: string; label: string; path: string; active: boolean }>
    initials: string
    name: string
    role: string
    isStaffSession: boolean
    onNavigate?: () => void
    onLogout: () => void
}

function SidebarContent({
    sidebarItems,
    initials,
    name,
    role,
    isStaffSession,
    onNavigate,
    onLogout,
}: SidebarContentProps) {
    return (
        <div className="flex h-full flex-col gap-8 p-5 sm:p-6 lg:p-8">
            <div className="space-y-8">
                <Link to="/" className="flex items-center gap-3" onClick={onNavigate}>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined font-bold">celebration</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-ocean-deep dark:text-white">Facey&apos;s</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                            Control Center
                        </p>
                    </div>
                </Link>

                <nav className="space-y-2">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            onClick={onNavigate}
                            className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                                item.active
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-ocean-deep dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto space-y-5">
                <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {isStaffSession ? 'Staff Session' : 'Admin Session'}
                </h3>
                <div className="flex items-center gap-4 rounded-2xl bg-ocean-deep px-4 py-3 text-white shadow-xl shadow-ocean-deep/20">
                    <div className="flex size-10 items-center justify-center rounded-full bg-white/20 font-black">{initials}</div>
                    <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{name}</span>
                        <span className="block truncate text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{role}</span>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                    <span className="material-symbols-outlined">logout</span>
                    Sign Out
                </button>
            </div>
        </div>
    )
}

export default function AdminLayout() {
    const { firebaseUser, userProfile, logout } = useAuth()
    const location = useLocation()
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

    const sidebarItems = useMemo(
        () =>
            getSidebarItems(userProfile?.role as UserRole).map((item) => ({
                ...item,
                active: location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path)),
            })),
        [location.pathname, userProfile?.role]
    )

    const initials = userProfile?.name ? userProfile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'PF'
    const name = userProfile?.name || firebaseUser?.email || 'Patrick Facey'
    const role = userProfile?.role || 'Site Owner'
    const isStaffSession = userProfile?.role === UserRole.Staff
    const activeLabel = sidebarItems.find((item) => item.active)?.label || (isStaffSession ? 'Timeclock' : 'Admin')

    useEffect(() => {
        setIsMobileNavOpen(false)
    }, [location.pathname])

    useEffect(() => {
        const previousOverflow = document.body.style.overflow

        if (isMobileNavOpen) {
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [isMobileNavOpen])

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark">
            <aside className="fixed left-0 top-0 hidden h-full w-72 overflow-y-auto border-r border-slate-200 bg-white z-50 hide-scrollbar dark:border-white/10 dark:bg-white/5 lg:block">
                <SidebarContent
                    sidebarItems={sidebarItems}
                    initials={initials}
                    name={name}
                    role={role}
                    isStaffSession={isStaffSession}
                    onLogout={() => {
                        void logout()
                    }}
                />
            </aside>

            <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-background-dark/90 lg:hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                            {isStaffSession ? 'Staff Workspace' : 'Admin Workspace'}
                        </p>
                        <h2 className="truncate text-lg font-black text-ocean-deep dark:text-white">{activeLabel}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/"
                            className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-ocean-deep transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                            aria-label="Return to website"
                        >
                            <span className="material-symbols-outlined">home</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsMobileNavOpen(true)}
                            className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-ocean-deep transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                            aria-label="Open admin navigation"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>
                </div>
            </div>

            {isMobileNavOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        aria-label="Close admin navigation"
                        onClick={() => setIsMobileNavOpen(false)}
                    />
                    <aside className="relative h-full w-full max-w-xs overflow-y-auto border-r border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-background-dark">
                        <SidebarContent
                            sidebarItems={sidebarItems}
                            initials={initials}
                            name={name}
                            role={role}
                            isStaffSession={isStaffSession}
                            onNavigate={() => setIsMobileNavOpen(false)}
                            onLogout={() => {
                                setIsMobileNavOpen(false)
                                void logout()
                            }}
                        />
                    </aside>
                </div>
            )}

            <main className="min-w-0 lg:ml-72">
                <Outlet />
            </main>
        </div>
    )
}
