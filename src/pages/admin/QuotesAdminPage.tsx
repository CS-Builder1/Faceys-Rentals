import { useState, useEffect } from 'react'
import { quoteService } from '../../services/quoteService'
import { Quote, QuoteStatus } from '../../types'
import { format } from 'date-fns'
import { Eye, X, Mail, FileText, CheckCircle, Loader2, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function QuotesAdminPage() {
    const navigate = useNavigate()
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const fetchQuotes = async () => {
        setIsLoading(true)
        try {
            const fetchedQuotes = await quoteService.getAll()
            setQuotes(fetchedQuotes)
        } catch (error) {
            console.error("Error fetching quotes:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchQuotes()
    }, [])

    const handleMarkAsReviewed = async (quote: Quote) => {
        setIsProcessing(true)
        try {
            await quoteService.update(quote.id, { status: QuoteStatus.Reviewed })
            await fetchQuotes()
            setSelectedQuote(null)
        } catch (error) {
            console.error("Error marking quote as reviewed", error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleConvertToInvoice = async (quote: Quote) => {
        // Navigate to invoices page and pass quote state for review/editing
        navigate('/admin/invoices', { state: { quoteForInvoice: quote } })
        setSelectedQuote(null)
    }

    return (
        <div className="p-8 md:p-12 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-ocean-deep dark:text-white">Manage <span className="text-primary tracking-widest uppercase text-2xl">Quotes</span></h2>
                    <p className="text-slate-500 font-medium">Review and respond to incoming quote requests.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="px-8 py-5">Client</th>
                                <th className="px-8 py-5">Event Date & Venue</th>
                                <th className="px-8 py-5">Items</th>
                                <th className="px-8 py-5">Est. Total</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-6 text-center text-slate-500">Loading quotes...</td>
                                </tr>
                            ) : quotes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-6 text-center text-slate-500">No quotes found.</td>
                                </tr>
                            ) : (
                                quotes.map(quote => (
                                    <tr key={quote.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <span className="block text-sm font-bold text-ocean-deep dark:text-white">{quote.customerName || 'Online Request'}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{quote.customerEmail || 'No email provided'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <span className="text-sm font-bold text-slate-600 dark:text-white/70">{quote.eventDate ? format(new Date(quote.eventDate), 'MMM dd, yyyy') : 'TBD'}</span>
                                                <span className="text-[10px] text-slate-400 font-medium block">{quote.venue || 'No venue provided'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {quote.items?.length || 0} ITEMS
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-bold text-ocean-deep dark:text-white">${quote.total?.toFixed(2) || '0.00'}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                quote.status === QuoteStatus.Sent ? 'bg-amber-100 text-amber-700' :
                                                quote.status === QuoteStatus.Reviewed ? 'bg-blue-100 text-blue-700' :
                                                quote.status === QuoteStatus.Accepted ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {quote.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => setSelectedQuote(quote)}
                                                className="p-2 bg-slate-100 text-ocean-deep hover:bg-primary hover:text-white rounded-lg transition-colors inline-block"
                                                title="Review Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {selectedQuote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ocean-deep/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-ocean-deep dark:text-white">Quote Request</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Submitted {format(selectedQuote.createdAt, 'MMM dd, yyyy')}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedQuote(null)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto flex-1 space-y-8">
                            
                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Customer Details</h4>
                                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 space-y-3">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Name</p>
                                            <p className="text-sm font-bold text-ocean-deep dark:text-white">{selectedQuote.customerName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Email</p>
                                            <p className="text-sm font-bold text-ocean-deep dark:text-white">{selectedQuote.customerEmail || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Phone</p>
                                            <p className="text-sm font-bold text-ocean-deep dark:text-white">{selectedQuote.customerPhone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Event Details</h4>
                                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 space-y-3">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Event Type & Date</p>
                                            <p className="text-sm font-bold text-ocean-deep dark:text-white">
                                                {selectedQuote.eventType} • {selectedQuote.eventDate ? format(new Date(selectedQuote.eventDate), 'PPP') : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Venue & Guests</p>
                                            <p className="text-sm font-bold text-ocean-deep dark:text-white">
                                                {selectedQuote.venue || 'N/A'} • {selectedQuote.guestCount || 0} Guests
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Notes</p>
                                            <p className="text-sm font-medium text-slate-600 dark:text-white/70 italic">
                                                "{selectedQuote.notes || 'None provided'}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Requested Items */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Requested Items</h4>
                                <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-bold text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3">Item</th>
                                                <th className="px-5 py-3 text-right">Qty</th>
                                                <th className="px-5 py-3 text-right">Unit Rate</th>
                                                <th className="px-5 py-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                                            {selectedQuote.items?.map((item, idx) => (
                                                <tr key={idx} className="bg-white dark:bg-transparent">
                                                    <td className="px-5 py-4 font-bold text-ocean-deep dark:text-white">{item.name}</td>
                                                    <td className="px-5 py-4 text-right">{item.quantity}</td>
                                                    <td className="px-5 py-4 text-right text-slate-500">${item.price?.toFixed(2)}</td>
                                                    <td className="px-5 py-4 text-right font-bold text-primary">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {(!selectedQuote.items || selectedQuote.items.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400 italic">No specific items requested.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-slate-50 dark:bg-white/5">
                                            <tr>
                                                <td colSpan={3} className="px-5 py-4 text-right font-bold text-slate-500">Estimated Total:</td>
                                                <td className="px-5 py-4 text-right font-black text-ocean-deep dark:text-white text-lg">${selectedQuote.total?.toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                        </div>

                        {/* Footer / Actions */}
                        <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap gap-3 justify-end items-center">
                            {selectedQuote.customerEmail ? (
                                <a 
                                    href={`mailto:${selectedQuote.customerEmail}?subject=Regarding your quote request - Facey's Party Rentals`}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 mr-auto shadow-sm"
                                >
                                    <Mail className="w-4 h-4" />
                                    Email Client
                                </a>
                            ) : selectedQuote.customerPhone ? (
                                <a 
                                    href={`tel:${selectedQuote.customerPhone}`}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 mr-auto shadow-sm"
                                >
                                    <Phone className="w-4 h-4" />
                                    Call Client
                                </a>
                            ) : (
                                <div className="mr-auto"></div>
                            )}

                            {selectedQuote.status === QuoteStatus.Accepted ? (
                                <div className="px-5 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-100 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Invoice Created
                                </div>
                            ) : (
                                <>
                                    {selectedQuote.status === QuoteStatus.Sent && (
                                        <button 
                                            onClick={() => handleMarkAsReviewed(selectedQuote)}
                                            disabled={isProcessing}
                                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                                            Mark as Reviewed
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleConvertToInvoice(selectedQuote)}
                                        disabled={isProcessing}
                                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50"
                                    >
                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                        Convert to Invoice
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}

