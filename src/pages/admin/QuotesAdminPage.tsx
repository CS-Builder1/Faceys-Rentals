import { useState, useEffect } from 'react'
import { quoteService } from '../../services/quoteService'
import { Quote, QuoteStatus } from '../../types'
import { format } from 'date-fns'
import { Eye, X, Mail, FileText, Loader2, Phone } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createFollowUpUpdate, getHoursSince, isQuoteFollowUpOverdue } from '../../utils/quoteWorkflow'

type QueueFilter = 'all' | QuoteStatus | 'needs_followup'

export default function QuotesAdminPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusFilter, setStatusFilter] = useState<QueueFilter>('all')
    const [searchTerm, setSearchTerm] = useState('')

    const fetchQuotes = async () => {
        setIsLoading(true)
        try {
            const fetchedQuotes = await quoteService.getAll()
            setQuotes(fetchedQuotes)
        } catch (error) {
            console.error('Error fetching quotes:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void fetchQuotes()
    }, [])

    useEffect(() => {
        const queryFilter = searchParams.get('filter')
        if (
            queryFilter === 'needs_followup' ||
            queryFilter === QuoteStatus.Pending ||
            queryFilter === QuoteStatus.Sent ||
            queryFilter === QuoteStatus.Drafting ||
            queryFilter === QuoteStatus.Accepted
        ) {
            setStatusFilter(queryFilter as QueueFilter)
        }
    }, [searchParams])

    const handleMarkAsReviewed = async (quote: Quote) => {
        setIsProcessing(true)
        try {
            await quoteService.update(quote.id, { status: QuoteStatus.Drafting })
            await fetchQuotes()
            setSelectedQuote(null)
        } catch (error) {
            console.error('Error marking quote as drafting', error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleMarkAsSent = async (quote: Quote) => {
        setIsProcessing(true)
        try {
            await quoteService.update(quote.id, { status: QuoteStatus.Sent })
            await fetchQuotes()
            setSelectedQuote(null)
        } catch (error) {
            console.error('Error marking quote as sent', error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleConvertToInvoice = async (quote: Quote) => {
        navigate('/admin/invoices', { state: { quoteForInvoice: quote } })
        setSelectedQuote(null)
    }

    const handleLogFollowUp = async (quote: Quote) => {
        try {
            await quoteService.update(quote.id, createFollowUpUpdate(quote))
            await fetchQuotes()
        } catch (error) {
            console.error('Failed to log follow-up interaction:', error)
        }
    }

    const hoursSince = (quote: Quote) => getHoursSince(new Date(quote.createdAt))
    const needsFollowUp = (quote: Quote) => isQuoteFollowUpOverdue(quote)

    const summary = {
        total: quotes.length,
        pending: quotes.filter((quote) => quote.status === QuoteStatus.Pending).length,
        followUp: quotes.filter(needsFollowUp).length,
        drafting: quotes.filter((quote) => quote.status === QuoteStatus.Drafting).length,
        sent: quotes.filter((quote) => quote.status === QuoteStatus.Sent).length,
        accepted: quotes.filter((quote) => quote.status === QuoteStatus.Accepted).length,
    }

    const filteredQuotes = quotes
        .filter((quote) => {
            if (statusFilter === 'needs_followup') return needsFollowUp(quote)
            if (statusFilter !== 'all') return quote.status === statusFilter
            return true
        })
        .filter((quote) => {
            const haystack = `${quote.customerName || ''} ${quote.customerEmail || ''} ${quote.customerPhone || ''} ${quote.venue || ''}`.toLowerCase()
            return haystack.includes(searchTerm.toLowerCase())
        })
        .sort((a, b) => {
            const aPriority = needsFollowUp(a) ? 2 : a.status === QuoteStatus.Pending ? 1 : 0
            const bPriority = needsFollowUp(b) ? 2 : b.status === QuoteStatus.Pending ? 1 : 0
            if (aPriority !== bPriority) return bPriority - aPriority
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })

    return (
        <div className="page-shell page-stack">
            <div className="page-header">
                <div>
                    <h2 className="text-3xl font-black text-ocean-deep dark:text-white">
                        Manage <span className="text-2xl uppercase tracking-widest text-primary">Quotes</span>
                    </h2>
                    <p className="font-medium text-slate-500">Review and respond to incoming quote requests.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                <SummaryCard label="Total" value={summary.total} tone="slate" />
                <SummaryCard label="Pending" value={summary.pending} tone="amber" />
                <SummaryCard label="Needs Follow-up" value={summary.followUp} tone="red" />
                <SummaryCard label="Drafting" value={summary.drafting} tone="blue" />
                <SummaryCard label="Sent" value={summary.sent} tone="purple" />
                <SummaryCard label="Accepted" value={summary.accepted} tone="emerald" />
            </div>

            <div className="panel-card flex flex-col gap-3 p-4 md:p-5 lg:flex-row lg:items-center">
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, phone, venue..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 lg:max-w-md"
                />
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'all', label: 'All' },
                        { key: QuoteStatus.Pending, label: 'Pending' },
                        { key: 'needs_followup', label: 'Needs Follow-up' },
                        { key: QuoteStatus.Drafting, label: 'Drafting' },
                        { key: QuoteStatus.Sent, label: 'Sent' },
                        { key: QuoteStatus.Accepted, label: 'Accepted' },
                    ].map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => setStatusFilter(filter.key as QueueFilter)}
                            className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                                statusFilter === filter.key
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="panel-card-strong overflow-hidden">
                <div className="data-table-shell">
                    <table className="data-table">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:bg-white/5">
                            <tr>
                                <th>Client</th>
                                <th>Event Date & Venue</th>
                                <th>Items</th>
                                <th>Est. Total</th>
                                <th>Status</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-slate-500">Loading quotes...</td>
                                </tr>
                            ) : filteredQuotes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-slate-500">No quotes found for current filters.</td>
                                </tr>
                            ) : (
                                filteredQuotes.map((quote) => (
                                    <tr key={quote.id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                                        <td>
                                            <div className="space-y-1">
                                                <span className="block text-sm font-bold text-ocean-deep dark:text-white">{quote.customerName || 'Online Request'}</span>
                                                <span className="text-[10px] font-medium text-slate-400">
                                                    {quote.company ? `${quote.company} • ` : ''}{quote.customerEmail || 'No email provided'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="space-y-1">
                                                <span className="text-sm font-bold text-slate-600 dark:text-white/70">
                                                    {quote.eventDate ? format(new Date(quote.eventDate), 'MMM dd, yyyy') : 'TBD'}
                                                </span>
                                                <span className="block text-[10px] font-medium text-slate-400">{quote.venue || 'No venue provided'}</span>
                                            </div>
                                        </td>
                                        <td className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {quote.items?.length || 0} ITEMS
                                        </td>
                                        <td>
                                            <span className="text-sm font-bold text-ocean-deep dark:text-white">${quote.total?.toFixed(2) || '0.00'}</span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col items-start gap-1.5">
                                                <span
                                                    className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                                                        needsFollowUp(quote)
                                                            ? 'bg-red-100 text-red-700'
                                                            : quote.status === QuoteStatus.Pending
                                                              ? 'bg-amber-100 text-amber-700'
                                                              : quote.status === QuoteStatus.Drafting
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : quote.status === QuoteStatus.Sent
                                                                  ? 'bg-purple-100 text-purple-700'
                                                                  : quote.status === QuoteStatus.Accepted
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {needsFollowUp(quote) ? 'follow-up overdue' : quote.status}
                                                </span>
                                                {quote.status === QuoteStatus.Pending && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                        {hoursSince(quote)}h since received
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-medium text-slate-500">
                                                    Follow-ups: {quote.followUpCount || 0}
                                                    {quote.lastContactedAt ? ` • Last contact ${format(new Date(quote.lastContactedAt), 'MMM dd')}` : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                                {quote.status === QuoteStatus.Pending && (
                                                    <button
                                                        onClick={() => handleMarkAsReviewed(quote)}
                                                        disabled={isProcessing}
                                                        className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-700 transition-colors hover:bg-blue-200 disabled:opacity-50"
                                                    >
                                                        Start Drafting
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setSelectedQuote(quote)}
                                                    className="inline-block rounded-lg bg-slate-100 p-2 text-ocean-deep transition-colors hover:bg-primary hover:text-white"
                                                    title="Review Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedQuote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-deep/80 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-5 dark:border-white/5 dark:bg-slate-800/50 sm:px-8 sm:py-6">
                            <div>
                                <h3 className="text-xl font-black text-ocean-deep dark:text-white">Quote Request</h3>
                                <p className="mt-1 text-sm font-medium text-slate-500">Submitted {format(selectedQuote.createdAt, 'MMM dd, yyyy')}</p>
                            </div>
                            <button
                                onClick={() => setSelectedQuote(null)}
                                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:space-y-8 sm:p-8">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Customer Details</h4>
                                    <div className="space-y-3 rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</p>
                                            <p className="text-sm font-bold text-ocean-deep dark:text-white">{selectedQuote.customerName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                                            <p className="text-sm font-bold text-ocean-deep dark:text-white">{selectedQuote.customerEmail || 'N/A'}</p>
                                        </div>
                                        {selectedQuote.company && (
                                            <div>
                                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Organization</p>
                                                <p className="text-sm font-bold text-ocean-deep dark:text-white">{selectedQuote.company}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
                                            <p className="text-sm font-bold text-ocean-deep dark:text-white">{selectedQuote.customerPhone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Event Details</h4>
                                    <div className="space-y-3 rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Event Type & Date</p>
                                            <p className="text-sm font-bold text-ocean-deep dark:text-white">
                                                {selectedQuote.eventType || 'N/A'} • {selectedQuote.eventDate ? format(new Date(selectedQuote.eventDate), 'PPP') : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Venue & Guests</p>
                                            <p className="text-sm font-bold text-ocean-deep dark:text-white">
                                                {selectedQuote.venue || 'N/A'} • {selectedQuote.guestCount || 0} Guests
                                            </p>
                                        </div>
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
                                            <p className="text-sm italic text-slate-600 dark:text-white/70">
                                                &quot;{selectedQuote.notes || 'None provided'}&quot;
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Requested Items</h4>
                                <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-white/5">
                                    <div className="data-table-shell">
                                        <table className="data-table min-w-[560px]">
                                            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 dark:bg-white/5">
                                                <tr>
                                                    <th>Item</th>
                                                    <th className="text-right">Qty</th>
                                                    <th className="text-right">Unit Rate</th>
                                                    <th className="text-right">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm dark:divide-white/5">
                                                {selectedQuote.items?.map((item, idx) => (
                                                    <tr key={idx} className="bg-white dark:bg-transparent">
                                                        <td className="font-bold text-ocean-deep dark:text-white">{item.name}</td>
                                                        <td className="text-right">{item.quantity}</td>
                                                        <td className="text-right text-slate-500">${item.price?.toFixed(2)}</td>
                                                        <td className="text-right font-bold text-primary">
                                                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!selectedQuote.items || selectedQuote.items.length === 0) && (
                                                    <tr>
                                                        <td colSpan={4} className="text-center italic text-slate-400">No specific items requested.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            <tfoot className="bg-slate-50 dark:bg-white/5">
                                                <tr>
                                                    <td colSpan={3} className="text-right font-bold text-slate-500">Estimated Total:</td>
                                                    <td className="text-right text-lg font-black text-ocean-deep dark:text-white">
                                                        ${selectedQuote.total?.toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-stretch gap-3 border-t border-slate-100 bg-slate-50 px-5 py-5 dark:border-white/5 dark:bg-slate-800/50 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:px-8">
                            {selectedQuote.customerEmail ? (
                                <a
                                    href={`mailto:${selectedQuote.customerEmail}?subject=Regarding your quote request - Facey's Party Rentals`}
                                    onClick={() => {
                                        void handleLogFollowUp(selectedQuote)
                                    }}
                                    className="mr-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 sm:justify-start"
                                >
                                    <Mail className="h-4 w-4" />
                                    Email Client
                                </a>
                            ) : selectedQuote.customerPhone ? (
                                <a
                                    href={`tel:${selectedQuote.customerPhone}`}
                                    onClick={() => {
                                        void handleLogFollowUp(selectedQuote)
                                    }}
                                    className="mr-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 sm:justify-start"
                                >
                                    <Phone className="h-4 w-4" />
                                    Call Client
                                </a>
                            ) : (
                                <div className="mr-auto hidden sm:block" />
                            )}

                            {selectedQuote.status === QuoteStatus.Accepted ? (
                                <button
                                    onClick={() => handleConvertToInvoice(selectedQuote)}
                                    disabled={isProcessing}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                    Convert to Invoice
                                </button>
                            ) : (
                                <>
                                    {selectedQuote.status === QuoteStatus.Pending && (
                                        <button
                                            onClick={() => handleMarkAsReviewed(selectedQuote)}
                                            disabled={isProcessing}
                                            className="flex items-center justify-center gap-2 rounded-xl bg-blue-100 px-5 py-2.5 text-sm font-bold text-blue-700 transition-all hover:bg-blue-200 disabled:opacity-50"
                                        >
                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                            Start Drafting
                                        </button>
                                    )}
                                    {selectedQuote.status === QuoteStatus.Drafting && (
                                        <button
                                            onClick={() => handleMarkAsSent(selectedQuote)}
                                            disabled={isProcessing}
                                            className="flex items-center justify-center gap-2 rounded-xl bg-purple-100 px-5 py-2.5 text-sm font-bold text-purple-700 transition-all hover:bg-purple-200 disabled:opacity-50"
                                        >
                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                            Mark as Sent
                                        </button>
                                    )}
                                    {selectedQuote.status === QuoteStatus.Sent && (
                                        <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-100 px-5 py-2.5 text-sm font-bold text-amber-700">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Waiting for Client Acceptance
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string
    value: number
    tone: 'slate' | 'amber' | 'red' | 'blue' | 'purple' | 'emerald'
}) {
    const toneClasses = {
        slate: 'border-slate-200 bg-slate-50 text-slate-700',
        amber: 'border-amber-200 bg-amber-50 text-amber-700',
        red: 'border-red-200 bg-red-50 text-red-700',
        blue: 'border-blue-200 bg-blue-50 text-blue-700',
        purple: 'border-purple-200 bg-purple-50 text-purple-700',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    }[tone]

    return (
        <div className={`rounded-2xl border p-4 ${toneClasses}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</p>
            <p className="mt-1 text-2xl font-black">{value}</p>
        </div>
    )
}
