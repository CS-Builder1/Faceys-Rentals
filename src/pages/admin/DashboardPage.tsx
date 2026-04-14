import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { quoteService } from '../../services/quoteService'
import { eventService } from '../../services/eventService'
import { invoiceService } from '../../services/invoiceService'
import { Quote, Event, Invoice, QuoteStatus, InvoiceStatus, EventStatus, UserRole } from '../../types'
import { format, isSameMonth, isThisMonth, subMonths } from 'date-fns'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    Filler,
    ArcElement,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { logger } from '../../utils/logger'
import { getHoursSince, isQuoteFollowUpOverdue } from '../../utils/quoteWorkflow'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    Filler,
    ArcElement
)

export default function DashboardPage() {
    const { userProfile } = useAuth()
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isActivityOpen, setIsActivityOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            logger.debug("[DashboardPage] Fetching data...")
            setIsLoading(true)
            try {
                const [fetchedQuotes, fetchedEvents, fetchedInvoices] = await Promise.all([
                    quoteService.getAll(),
                    eventService.getAll(),
                    invoiceService.getAll()
                ])
                logger.debug("[DashboardPage] Data fetched successfully", { 
                    quotes: fetchedQuotes.length, 
                    events: fetchedEvents.length, 
                    invoices: fetchedInvoices.length 
                })
                setQuotes(fetchedQuotes || [])
                setEvents(fetchedEvents || [])
                setInvoices(fetchedInvoices || [])
            } catch (error) {
                logger.error("[DashboardPage] Critical fetch error:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (userProfile?.role === UserRole.Marketing) {
        return <Navigate to="/admin/inventory" replace />
    }

    if (isLoading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="size-16 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Analytics...</p>
            </div>
        )
    }

    // --- Derived Data ---
    const newRequests = quotes.filter(q => q.status === QuoteStatus.Pending).length
    const revenueMTD = invoices
        .filter(i => i.status === InvoiceStatus.Paid && i.createdAt && isThisMonth(i.createdAt))
        .reduce((sum, i) => sum + i.total, 0)
    const upcomingEvents = events.filter(e => e.eventDate >= new Date() && e.status !== EventStatus.Cancelled).length

    const unpaidInvoicesList = invoices.filter(i => i.status === InvoiceStatus.Unpaid || i.status === InvoiceStatus.Partial)
    const unpaidInvoicesCount = unpaidInvoicesList.length
    const unpaidInvoicesTotal = unpaidInvoicesList.reduce((sum, i) => sum + i.balanceDue, 0)

    const stats = [
        { label: 'New Requests', value: newRequests.toString(), icon: 'pending_actions', trend: 'Awaiting response', trendColor: 'text-amber-500', trendIcon: 'info' },
        { label: 'Revenue (MTD)', value: `$${revenueMTD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'payments', trend: 'This month', trendColor: 'text-emerald-500', trendIcon: 'trending_up' },
        { label: 'Upcoming Events', value: upcomingEvents.toString(), icon: 'calendar_month', trend: 'Scheduled', trendColor: 'text-ocean-deep', trendIcon: 'event' },
        { label: 'Unpaid Invoices', value: unpaidInvoicesCount.toString(), icon: 'account_balance_wallet', trend: `$${unpaidInvoicesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding`, trendColor: 'text-primary', trendIcon: 'warning' },
    ]

    const recentRequests = quotes.slice(0, 5).map(req => ({
        id: req.id,
        client: req.customerName || 'Online Request',
        email: req.customerEmail || 'No email provided',
        date: req.createdAt ? format(req.createdAt, 'MMM dd, yyyy') : 'Recently',
        type: req.eventType || 'Rental',
        status: req.status.charAt(0).toUpperCase() + req.status.slice(1),
        statusColor: req.status === QuoteStatus.Pending ? 'bg-amber-100 text-amber-700' :
            req.status === QuoteStatus.Sent ? 'bg-blue-100 text-blue-700' :
            req.status === QuoteStatus.Accepted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700',
        initials: (req.customerName || 'O').substring(0, 2).toUpperCase()
    }))

    const followUpRequests = quotes
        .filter((q) => isQuoteFollowUpOverdue(q))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, 5)

    const last6Months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i))

    const monthlyRevenueData = last6Months.map(month => {
        const total = invoices
            .filter(inv => inv.status === InvoiceStatus.Paid && inv.createdAt && isSameMonth(new Date(inv.createdAt), month))
            .reduce((sum, inv) => sum + inv.total, 0)
        return {
            month,
            label: format(month, 'MMM').toUpperCase(),
            total
        }
    })

    const totalPeriodRevenue = monthlyRevenueData.reduce((sum, m) => sum + m.total, 0)
    const lastMonthTotal = monthlyRevenueData[4]?.total || 0
    const thisMonthTotal = monthlyRevenueData[5]?.total || 0
    const growth = lastMonthTotal === 0 ? 100 : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100

    const activityFeed = [
        ...quotes.map(q => ({
            id: `q-${q.id}`,
            date: new Date(q.createdAt),
            title: `New quote request from ${q.customerName || 'Online Client'}`,
            color: 'bg-primary'
        })),
        ...invoices.filter(i => i.status === InvoiceStatus.Paid).map(i => ({
            id: `i-${i.id}`,
            date: new Date(i.createdAt),
            title: `Invoice #${i.invoiceNumber || i.id.substring(0, 8)} marked as PAID`,
            color: 'bg-emerald-500'
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 3)

    const fullActivityFeed = [
        ...quotes.map(q => ({
            id: `q-${q.id}`,
            date: new Date(q.createdAt),
            title: `New quote request from ${q.customerName || 'Online Client'}`,
            color: 'bg-primary'
        })),
        ...invoices.filter(i => i.status === InvoiceStatus.Paid).map(i => ({
            id: `i-${i.id}`,
            date: new Date(i.createdAt),
            title: `Invoice #${i.invoiceNumber || i.id.substring(0, 8)} marked as PAID`,
            color: 'bg-emerald-500'
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime())

    const conversionData = [
        { name: 'Pending', value: quotes.filter(q => q.status === QuoteStatus.Pending).length, fill: '#8B0000' },
        { name: 'Sent', value: quotes.filter(q => q.status === QuoteStatus.Sent).length, fill: '#EAB308' },
        { name: 'Accepted', value: quotes.filter(q => q.status === QuoteStatus.Accepted).length, fill: '#059669' },
        { name: 'Events', value: events.length, fill: '#1E293B' },
    ]

    const categoryStats = quotes.reduce((acc, q) => {
        const cat = q.eventType || 'Other'
        const capitalized = cat.charAt(0).toUpperCase() + cat.slice(1)
        acc[capitalized] = (acc[capitalized] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const categoryData = Object.entries(categoryStats)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0)
        
    const COLORS = ['#8B0000', '#2E4053', '#B22222', '#1E293B', '#708090', '#A52A2A']

    const handleExportDashboard = () => {
        const snapshot = {
            generatedAt: new Date().toISOString(),
            summary: {
                newRequests,
                revenueMTD,
                upcomingEvents,
                unpaidInvoicesCount,
                unpaidInvoicesTotal,
            },
            quotes,
            events,
            invoices,
        }

        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `dashboard-export-${format(new Date(), 'yyyy-MM-dd')}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="p-8 md:p-12 space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-ocean-deep dark:text-white">Admin <span className="text-primary tracking-widest uppercase text-2xl">Dashboard</span></h2>
                    <p className="text-slate-500 font-medium">Welcome back, Patrick. Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExportDashboard}
                        className="px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-primary transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Export Data
                    </button>
                    <Link to="/admin/inventory" className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all">
                        Create New Listing
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-white/5 p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 hover:shadow-xl transition-all group">
                        <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                        </div>
                        <div>
                            <span className="block text-3xl font-black text-ocean-deep dark:text-white">{stat.value}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tight ${stat.trendColor}`}>
                            <span className="material-symbols-outlined text-xs">{stat.trendIcon}</span>
                            {stat.trend}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-amber-700">Action Queue</p>
                    <p className="text-sm text-amber-900 font-medium mt-1">
                        {followUpRequests.length === 0
                            ? 'No quote follow-ups are currently overdue.'
                            : `${followUpRequests.length} quote follow-up${followUpRequests.length > 1 ? 's are' : ' is'} overdue (24h+).`}
                    </p>
                </div>
                <Link
                    to="/admin/quotes?filter=needs_followup"
                    className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors inline-flex items-center gap-2 w-fit"
                >
                    Open Follow-up Queue
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
            </div>

            {/* Content Rows */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content Area (col-span-2) */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Recent Requests */}
                    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-transparent backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-ocean-deep dark:text-white">Recent Quote Requests</h3>
                            <Link to="/admin/quotes" className="text-primary text-sm font-bold hover:gap-2 transition-all flex items-center gap-1">
                                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="px-8 py-5">Client</th>
                                        <th className="px-8 py-5">Event Date</th>
                                        <th className="px-8 py-5">Type</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {recentRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-6 text-center text-slate-500">No recent requests found.</td>
                                        </tr>
                                    ) : recentRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 bg-ocean-deep/10 dark:bg-white/10 rounded-full flex items-center justify-center text-ocean-deep dark:text-white text-xs font-black">
                                                        {req.initials}
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-bold text-ocean-deep dark:text-white">{req.client}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">{req.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-600 dark:text-white/70">{req.date}</td>
                                            <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.type}</td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${req.statusColor}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="text-slate-300 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined">more_horiz</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {followUpRequests.length > 0 && (
                        <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-ocean-deep dark:text-white">Overdue Follow-ups</h3>
                                <Link to="/admin/quotes?filter=needs_followup" className="text-primary text-xs font-bold uppercase tracking-wider">
                                    View Queue
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {followUpRequests.map((q) => (
                                    <div key={q.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-bold text-ocean-deep dark:text-white">{q.customerName || 'Online Request'}</p>
                                            <p className="text-xs text-slate-500">{q.customerEmail || 'No email provided'}</p>
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                                            {getHoursSince(new Date(q.createdAt))}h old
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quote Conversion Chart */}
                    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-ocean-deep dark:text-white">Conversion Pipeline</h3>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inquiries vs. Bookings</span>
                        </div>
                        <div className="h-64 w-full flex items-center justify-center">
                            {conversionData.some(d => d.value > 0) ? (
                                <div className="w-full h-full relative font-sans">
                                    <Bar 
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                x: { grid: { display: false }, border: { display: false } },
                                                y: { display: false, grid: { display: false } }
                                            }
                                        }}
                                        data={{
                                            labels: conversionData.map(d => d.name),
                                            datasets: [{
                                                label: 'Pipeline',
                                                data: conversionData.map(d => d.value),
                                                backgroundColor: conversionData.map(d => d.fill),
                                                borderRadius: 8,
                                                borderSkipped: false,
                                                barThickness: 40,
                                            }]
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                                    No data available
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            {conversionData.map(item => (
                                <div key={item.name} className="text-center">
                                    <span className="block text-xl font-black text-ocean-deep dark:text-white">{item.value}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Revenue Trend / Quick Actions Sidebar */}
                <div className="space-y-8">
                    {/* Revenue Trend */}
                    <div className="bg-ocean-deep dark:bg-white/5 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl border border-white/10">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold uppercase tracking-widest text-xs opacity-60">Revenue Performance</h3>
                            <span className="text-[10px] font-bold px-2 py-1 bg-white/10 rounded-full">Last 6 Months</span>
                        </div>
                        
                        <div className="h-48 w-full flex items-center justify-center rounded-3xl">
                            {monthlyRevenueData.some(d => d.total > 0) ? (
                                <div className="w-full h-full relative font-sans">
                                    <Line 
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    callbacks: {
                                                        label: (context) => `$${(context.parsed.y || 0).toLocaleString()}`
                                                    }
                                                }
                                            },
                                            scales: {
                                                x: { border: { display: false }, grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 10, weight: 'bold' } } },
                                                y: { border: { display: false }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 10, weight: 'bold' }, callback: (value) => `$${Number(value)/1000}k` } }
                                            }
                                        }}
                                        data={{
                                            labels: monthlyRevenueData.map(d => d.label),
                                            datasets: [{
                                                label: 'Revenue',
                                                data: monthlyRevenueData.map(d => d.total),
                                                borderColor: '#8B0000',
                                                backgroundColor: 'rgba(139, 0, 0, 0.4)',
                                                fill: true,
                                                tension: 0.4,
                                                borderWidth: 3,
                                                pointRadius: 0,
                                                pointHoverRadius: 6,
                                            }]
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-white/30 text-xs font-bold uppercase tracking-widest flex-col gap-2">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">monitoring</span>
                                    <span>Not enough data yet</span>
                                    <span className="text-[9px] normal-case opacity-70">Chart will appear after first payment</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <div>
                                <span className="block text-[10px] font-bold opacity-60 uppercase">Total Period</span>
                                <span className="text-xl font-black">${(totalPeriodRevenue / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-bold opacity-60 uppercase">Growth</span>
                                <span className={`text-sm font-bold ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {growth > 0 ? '+' : ''}{growth.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-ocean-deep dark:text-white uppercase tracking-widest">Recent Activity</h3>
                        <div className="space-y-6">
                            {activityFeed.length === 0 ? (
                                <div className="text-sm text-slate-500 text-center py-4 italic">No recent activity.</div>
                            ) : (
                                activityFeed.map(activity => (
                                    <div key={activity.id} className="flex gap-4">
                                        <div className={`size-2 rounded-full mt-1.5 shrink-0 ${activity.color}`} />
                                        <div className="space-y-1">
                                            <p className="text-sm text-slate-600 dark:text-white/70 font-medium line-clamp-2">
                                                {activity.title}
                                            </p>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                {format(activity.date, 'MMM dd, h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button
                            onClick={() => setIsActivityOpen(true)}
                            className="w-full py-4 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:border-primary hover:text-primary transition-all"
                        >
                            View Activity Log
                        </button>
                    </div>

                    {/* Category Popularity Chart */}
                    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-ocean-deep dark:text-white uppercase tracking-widest">Offer Breakdown</h3>
                        <div className="h-64 w-full flex items-center justify-center">
                            {categoryData.length > 0 ? (
                                <div className="w-full h-full relative font-sans">
                                    <Doughnut 
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            cutout: '60%',
                                            plugins: {
                                                legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle' } }
                                            }
                                        }}
                                        data={{
                                            labels: categoryData.map(d => d.name),
                                            datasets: [{
                                                data: categoryData.map(d => d.value),
                                                backgroundColor: COLORS,
                                                borderWidth: 0,
                                                hoverOffset: 4
                                            }]
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                                    No category data
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isActivityOpen && (
                <div className="fixed inset-0 z-50 bg-ocean-deep/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-primary">Activity Log</p>
                                <h3 className="text-2xl font-black text-ocean-deep dark:text-white mt-1">Recent revenue and quote activity</h3>
                            </div>
                            <button
                                onClick={() => setIsActivityOpen(false)}
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-5">
                            {fullActivityFeed.length === 0 ? (
                                <p className="text-sm text-slate-500">No activity has been logged yet.</p>
                            ) : (
                                fullActivityFeed.map((activity) => (
                                    <div key={activity.id} className="flex gap-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-5">
                                        <div className={`size-3 rounded-full mt-1.5 shrink-0 ${activity.color}`} />
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-slate-700 dark:text-white/80">{activity.title}</p>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                {format(activity.date, 'MMM dd, yyyy h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
