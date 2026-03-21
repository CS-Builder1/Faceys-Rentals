import { useState, useEffect } from 'react'
import { X, Loader2, Briefcase, MessageSquare, Save, Calendar, FileText, User, Mail, Phone, MapPin, Building2 } from 'lucide-react'
import { Client, Event, Quote, Invoice } from '../types'
import { clientService } from '../services/clientService'
import { eventService } from '../services/eventService'
import { quoteService } from '../services/quoteService'
import { invoiceService } from '../services/invoiceService'
import { format } from 'date-fns'

interface CustomerDetailDrawerProps {
    isOpen: boolean
    customer: Client | null
    onClose: () => void
    onUpdate: () => void
}

export default function CustomerDetailDrawer({ isOpen, customer, onClose, onUpdate }: CustomerDetailDrawerProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'financials'>('overview')
    const [isLoading, setIsLoading] = useState(false)
    const [events, setEvents] = useState<Event[]>([])
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])

    // Form State for CRM
    const [formData, setFormData] = useState<Partial<Client>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [msg, setMsg] = useState({ text: '', type: '' })

    useEffect(() => {
        if (isOpen && customer) {
            setFormData({
                contactName: customer.contactName,
                businessName: customer.businessName || '',
                email: customer.email,
                phone: customer.phone,
                billingAddress: customer.billingAddress,
                billingCity: customer.billingCity || '',
                billingState: customer.billingState || '',
                billingZip: customer.billingZip || '',
                preferredContact: customer.preferredContact || 'email',
                referralSource: customer.referralSource || '',
                specialNotes: customer.specialNotes || '',
                internalNotes: customer.internalNotes || '',
                specialDiscount: customer.specialDiscount || 0,
                status: customer.status || 'active',
                notes: customer.notes || ''
            })
            fetchHistory(customer)
        }
    }, [isOpen, customer])

    const fetchHistory = async (client: Client) => {
        setIsLoading(true)
        try {
            // Fetch events
            const clientEvents = await eventService.getByClient(client.id)
            setEvents(clientEvents)

            // Fetch invoices
            const invoicePromises = clientEvents.map(ev => invoiceService.getByEvent(ev.id))
            const invoicesArrays = await Promise.all(invoicePromises)
            const allInvoices = invoicesArrays.flat()
            setInvoices(allInvoices)

            // Fetch quotes
            let clientQuotes = await quoteService.getByClient(client.id)
            if (clientQuotes.length === 0 && client.email) {
                 const allQuotes = await quoteService.getAll();
                 clientQuotes = allQuotes.filter(q => q.customerEmail === client.email)
            }
            setQuotes(clientQuotes)

        } catch (err) {
            console.error("Error fetching customer history:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveCRM = async () => {
        if (!customer) return
        setIsSaving(true)
        setMsg({ text: '', type: '' })
        try {
            await clientService.update(customer.id, formData)
            setMsg({ text: 'Customer details updated successfully.', type: 'success' })
            onUpdate() // refresh parent
        } catch (err: any) {
            console.error(err)
            setMsg({ text: err.message || 'Failed to save.', type: 'error' })
        } finally {
            setIsSaving(false)
            setTimeout(() => setMsg({ text: '', type: '' }), 3000)
        }
    }

    if (!isOpen || !customer) return null

    // Calculate Financials
    const totalRevenue = invoices.filter(i => i.status === 'paid' || i.status === 'partial').reduce((acc, curr) => acc + (curr.total - curr.balanceDue), 0)
    const outstandingBalance = invoices.reduce((acc, curr) => acc + curr.balanceDue, 0)
    const avgOrderValue = invoices.length > 0 ? (totalRevenue / invoices.length) : 0

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden border-l border-slate-200 dark:border-white/10">
                
                {/* Header Section */}
                <div className="flex-shrink-0 border-b border-slate-200 dark:border-white/10 p-6 bg-slate-50 dark:bg-slate-900">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-black">
                                {customer.contactName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-ocean-deep dark:text-white">{customer.contactName}</h2>
                                {customer.businessName && <p className="text-slate-500 font-medium flex items-center gap-1"><Building2 className="w-4 h-4" /> {customer.businessName}</p>}
                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {customer.email}</span>
                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {customer.phone}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">LTV</p>
                            <p className="text-lg font-black text-ocean-deep dark:text-white">${totalRevenue.toFixed(2)}</p>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Outstanding</p>
                            <p className="text-lg font-black text-rose-500">${outstandingBalance.toFixed(2)}</p>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Events</p>
                            <p className="text-lg font-black text-ocean-deep dark:text-white">{events.length}</p>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Avg Order</p>
                            <p className="text-lg font-black text-ocean-deep dark:text-white">${avgOrderValue.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-6 border-b border-slate-200 dark:border-white/10">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            CRM Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('bookings')}
                            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'bookings' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            Bookings
                        </button>
                        <button 
                            onClick={() => setActiveTab('financials')}
                            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'financials' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            Quotes & Invoices
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="space-y-6 animate-fade-in">
                                    {msg.text && (
                                        <div className={`p-3 rounded-xl text-sm font-bold border ${msg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                            {msg.text}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Name</label>
                                            <input type="text" value={formData.contactName || ''} onChange={(e) => setFormData({...formData, contactName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Business Name</label>
                                            <input type="text" value={formData.businessName || ''} onChange={(e) => setFormData({...formData, businessName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                                            <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                                            <input type="text" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Street Address</label>
                                            <input type="text" value={formData.billingAddress || ''} onChange={(e) => setFormData({...formData, billingAddress: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">City</label>
                                            <input type="text" value={formData.billingCity || ''} onChange={(e) => setFormData({...formData, billingCity: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zip Code</label>
                                            <input type="text" value={formData.billingZip || ''} onChange={(e) => setFormData({...formData, billingZip: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-4">
                                        <h3 className="font-black text-ocean-deep dark:text-white flex items-center gap-2"><User className="w-4 h-4 text-primary"/> CRM Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Referral Source</label>
                                                <input type="text" value={formData.referralSource || ''} onChange={(e) => setFormData({...formData, referralSource: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" placeholder="e.g. Google, Friend" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Status</label>
                                                <select value={formData.status || 'active'} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                    <option value="lead">Lead</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Special Discount (%)</label>
                                                <input type="number" value={formData.specialDiscount || 0} onChange={(e) => setFormData({...formData, specialDiscount: parseFloat(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Notes (Admin Only)</label>
                                            <textarea value={formData.internalNotes || ''} onChange={(e) => setFormData({...formData, internalNotes: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm min-h-[80px]" placeholder="Private notes about this client..." />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button onClick={handleSaveCRM} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50">
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                                            Save Details
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bookings' && (
                                <div className="space-y-4 animate-fade-in">
                                    {events.length === 0 ? (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <h3 className="text-lg font-bold text-ocean-deep dark:text-white mb-1">No Bookings Yet</h3>
                                            <p className="text-slate-500 text-sm">This customer hasn't booked any events.</p>
                                        </div>
                                    ) : (
                                        events.map(ev => (
                                            <div key={ev.id} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-ocean-deep dark:text-white text-lg">{ev.eventType}</h4>
                                                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Calendar className="w-4 h-4"/> {ev.eventDate ? format(ev.eventDate, 'MMM do, yyyy') : 'No Date'}</p>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white border border-slate-200 dark:border-white/10">
                                                        {ev.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1"><MapPin className="w-4 h-4"/> {ev.venueAddress || 'No venue'}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'financials' && (
                                <div className="space-y-8 animate-fade-in">
                                    {/* Quotes */}
                                    <div>
                                        <h3 className="font-black text-ocean-deep dark:text-white mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Quotes</h3>
                                        <div className="space-y-3">
                                            {quotes.length === 0 ? (
                                                <p className="text-sm text-slate-500 p-4 bg-slate-50 dark:bg-white/5 rounded-xl text-center">No quotes found.</p>
                                            ) : (
                                                quotes.map(q => (
                                                    <div key={q.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-primary/50 transition-colors">
                                                        <div>
                                                            <p className="font-bold text-ocean-deep dark:text-white">Quote - {q.createdAt ? format(q.createdAt, 'MMM d, yyyy') : 'Unknown'}</p>
                                                            <p className="text-sm text-slate-500">{q.eventType} • {q.items?.length || 0} items</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-ocean-deep dark:text-white">${q.total?.toFixed(2) || '0.00'}</p>
                                                            <span className="text-xs font-bold text-slate-400 uppercase">{q.status}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Invoices */}
                                    <div>
                                        <h3 className="font-black text-ocean-deep dark:text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500" /> Invoices</h3>
                                        <div className="space-y-3">
                                            {invoices.length === 0 ? (
                                                <p className="text-sm text-slate-500 p-4 bg-slate-50 dark:bg-white/5 rounded-xl text-center">No invoices found.</p>
                                            ) : (
                                                invoices.map(inv => (
                                                    <div key={inv.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 transition-colors">
                                                        <div>
                                                            <p className="font-bold text-ocean-deep dark:text-white">INV-{inv.invoiceNumber}</p>
                                                            <p className="text-sm text-slate-500">Due: {inv.dueDate ? format(inv.dueDate, 'MMM d, yyyy') : 'Unknown'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-ocean-deep dark:text-white">${inv.total?.toFixed(2) || '0.00'}</p>
                                                            <span className={`text-xs font-bold uppercase ${inv.status === 'paid' ? 'text-emerald-500' : inv.status === 'unpaid' ? 'text-rose-500' : 'text-amber-500'}`}>
                                                                {inv.status} • Bal: ${inv.balanceDue?.toFixed(2) || '0.00'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
