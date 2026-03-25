import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { invoiceService } from '../../services/invoiceService'
import { quoteService } from '../../services/quoteService'
import { Invoice, InvoiceStatus, DepositType, InvoiceLineItem, QuoteStatus, Quote } from '../../types'
import { format, addDays } from 'date-fns'
import { Plus, X, Loader2, FileText, CheckCircle, Trash2 } from 'lucide-react'

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    
    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

    // Form state for new invoice
    const [eventId, setEventId] = useState('')
    const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'))
    const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([])
    const [taxRate, setTaxRate] = useState(0) // percentage
    const [depositType, setDepositType] = useState<DepositType>(DepositType.None)
    const [depositValue, setDepositValue] = useState(0) // percentage or fixed amount
    const [linkedQuoteId, setLinkedQuoteId] = useState<string>('')
    const location = useLocation()

    useEffect(() => {
        if (location.state && location.state.quoteForInvoice) {
            const quote = location.state.quoteForInvoice as Quote
            setIsCreateModalOpen(true)
            setEventId(quote.eventId || '')
            setLinkedQuoteId(quote.id)
            if (quote.items && quote.items.length > 0) {
                const newItems = quote.items.map((item: any) => ({
                    itemId: item.id || `item-${Date.now()}`,
                    description: item.name || 'Custom Item',
                    quantity: item.quantity || 1,
                    unitPrice: item.price || 0,
                    subtotal: (item.quantity || 1) * (item.price || 0)
                }))
                setLineItems(newItems)
            }
            // Clear location state
            window.history.replaceState({}, document.title)
        }
    }, [location])

    const fetchInvoices = async () => {
        setIsLoading(true)
        try {
            const fetchedInvoices = await invoiceService.getAll()
            setInvoices(fetchedInvoices)
        } catch (error) {
            console.error("Error fetching invoices:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchInvoices()
    }, [])

    const handleAddLineItem = () => {
        setLineItems([...lineItems, { itemId: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, subtotal: 0 }])
    }

    const handleRemoveLineItem = (index: number) => {
        const newItems = [...lineItems]
        newItems.splice(index, 1)
        setLineItems(newItems)
    }

    const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
        const newItems = [...lineItems]
        newItems[index] = { ...newItems[index], [field]: value }
        
        // Recalculate subtotal for this line
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].subtotal = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0)
        }
        
        setLineItems(newItems)
    }

    // Calculations
    const subtotal = lineItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax
    
    let depositAmount = 0
    if (depositType === DepositType.Fixed) depositAmount = depositValue
    else if (depositType === DepositType.Percentage) depositAmount = total * (depositValue / 100)
    
    const balanceDue = Math.max(total - depositAmount, 0)

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (lineItems.length === 0) {
            alert("Please add at least one line item.")
            return
        }

        setIsProcessing(true)
        try {
            const invoiceNumber = `INV-${new Date().getTime().toString().slice(-6)}`
            await invoiceService.create({
                eventId: eventId || `evt-${Date.now()}`,
                quoteId: linkedQuoteId || undefined,
                invoiceNumber,
                lineItems,
                subtotal,
                tax,
                total,
                depositType,
                depositAmount,
                balanceDue,
                dueDate: new Date(dueDate),
                status: InvoiceStatus.Unpaid,
                createdAt: new Date(),
            })
            
            if (linkedQuoteId) {
                await quoteService.update(linkedQuoteId, { status: QuoteStatus.Accepted })
            }

            setIsCreateModalOpen(false)
            resetForm()
            await fetchInvoices()
        } catch (error) {
            console.error("Error creating invoice", error)
        } finally {
            setIsProcessing(false)
        }
    }

    const resetForm = () => {
        setEventId('')
        setLinkedQuoteId('')
        setDueDate(format(addDays(new Date(), 14), 'yyyy-MM-dd'))
        setLineItems([])
        setTaxRate(0)
        setDepositType(DepositType.None)
        setDepositValue(0)
    }

    const handleMarkAsPaid = async (invoice: Invoice) => {
        setIsProcessing(true)
        try {
            await invoiceService.update(invoice.id, { 
                status: InvoiceStatus.Paid,
                balanceDue: 0 
            })
            await fetchInvoices()
            setSelectedInvoice(null)
        } catch (error) {
            console.error("Error updating invoice:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="p-8 md:p-12 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-ocean-deep dark:text-white">Manage <span className="text-primary tracking-widest uppercase text-2xl">Invoices</span></h2>
                    <p className="text-slate-500 font-medium">Track payments and manage outstanding balances.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Invoice
                    </button>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="px-8 py-5">Invoice #</th>
                                <th className="px-8 py-5">Issue Date</th>
                                <th className="px-8 py-5">Due Date</th>
                                <th className="px-8 py-5">Amount</th>
                                <th className="px-8 py-5">Balance Due</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-6 text-center text-slate-500">Loading invoices...</td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-6 text-center text-slate-500">No invoices found.</td>
                                </tr>
                            ) : (
                                invoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-ocean-deep dark:text-white uppercase tracking-widest">{invoice.invoiceNumber || invoice.id.substring(0, 8)}</span>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-medium text-slate-600 dark:text-white/70">
                                            {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-slate-700 dark:text-white">
                                            {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-medium text-slate-600 dark:text-white/70">${invoice.total.toFixed(2)}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-sm font-bold ${invoice.balanceDue > 0 ? 'text-primary' : 'text-emerald-500'}`}>
                                                ${invoice.balanceDue.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    invoice.status === InvoiceStatus.Paid ? 'bg-emerald-100 text-emerald-700' :
                                                    invoice.status === InvoiceStatus.Overdue ? 'bg-red-100 text-red-700' :
                                                    invoice.status === InvoiceStatus.Partial ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right space-x-2">
                                            <button 
                                                onClick={() => setSelectedInvoice(invoice)}
                                                className="px-4 py-2 bg-slate-100 text-ocean-deep hover:bg-ocean-deep hover:text-white rounded-lg text-xs font-bold transition-colors"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Invoice Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ocean-deep/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-ocean-deep dark:text-white">{selectedInvoice.invoiceNumber}</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Due: {format(new Date(selectedInvoice.dueDate), 'MMM dd, yyyy')}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedInvoice(null)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1 space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Line Items</h4>
                                <div className="space-y-3">
                                    {(selectedInvoice.lineItems || []).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                                            <div>
                                                <p className="font-bold text-ocean-deep dark:text-white">{item.description}</p>
                                                <p className="text-xs text-slate-500">{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                                            </div>
                                            <div className="font-bold text-primary">${item.subtotal.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="border-t border-slate-100 dark:border-white/5 pt-6 space-y-2 text-sm">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Tax</span>
                                    <span>${selectedInvoice.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-black text-ocean-deep dark:text-white pt-2">
                                    <span>Total</span>
                                    <span>${selectedInvoice.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-primary pt-2">
                                    <span>Balance Due</span>
                                    <span>${selectedInvoice.balanceDue.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end items-center">
                            {selectedInvoice.status !== InvoiceStatus.Paid && (
                                <button 
                                    onClick={() => handleMarkAsPaid(selectedInvoice)}
                                    disabled={isProcessing}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Mark as Paid
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Invoice Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ocean-deep/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-ocean-deep dark:text-white">Create Invoice</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Draft a new invoice manually.</p>
                            </div>
                            <button 
                                onClick={() => { setIsCreateModalOpen(false); resetForm(); }}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateInvoice} className="p-8 overflow-y-auto flex-1 space-y-8">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Event Reference</label>
                                    <input 
                                        type="text" 
                                        placeholder="E.g. Johnson Wedding"
                                        value={eventId}
                                        onChange={(e) => setEventId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-ocean-deep dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Due Date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-ocean-deep dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Line Items</h4>
                                    <button 
                                        type="button"
                                        onClick={handleAddLineItem}
                                        className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Item
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {lineItems.map((item, idx) => (
                                        <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-start bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10">
                                            <div className="flex-1 min-w-[200px]">
                                                <input 
                                                    type="text" 
                                                    required
                                                    placeholder="Item description"
                                                    value={item.description}
                                                    onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div className="w-24">
                                                <input 
                                                    type="number" 
                                                    required
                                                    min="1"
                                                    placeholder="Qty"
                                                    value={item.quantity === 0 ? '' : item.quantity}
                                                    onChange={(e) => handleLineItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none text-right"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-slate-400 font-medium text-sm">$</span>
                                                    <input 
                                                        type="number" 
                                                        required
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="Price"
                                                        value={item.unitPrice === 0 ? '' : item.unitPrice}
                                                        onChange={(e) => handleLineItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg pl-6 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none text-right"
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-24 flex items-center justify-end px-3 py-2 font-bold text-ocean-deep dark:text-white">
                                                ${item.subtotal.toFixed(2)}
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveLineItem(idx)}
                                                className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {lineItems.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400 text-sm font-medium">
                                            No line items added yet. Click "Add Item" to begin.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 justify-between border-t border-slate-100 dark:border-white/5 pt-8">
                                <div className="space-y-4 md:max-w-xs w-full">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tax Rate (%)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            step="0.1"
                                            value={taxRate === 0 ? '' : taxRate}
                                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Deposit Type</label>
                                            <select 
                                                value={depositType}
                                                onChange={(e) => setDepositType(e.target.value as DepositType)}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                                            >
                                                <option value={DepositType.None}>None</option>
                                                <option value={DepositType.Fixed}>Fixed Amount</option>
                                                <option value={DepositType.Percentage}>Percentage</option>
                                            </select>
                                        </div>
                                        {depositType !== DepositType.None && (
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Value</label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={depositValue === 0 ? '' : depositValue}
                                                    onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 min-w-[250px] space-y-3 self-end md:self-stretch flex flex-col justify-center border border-slate-100 dark:border-white/5">
                                    <div className="flex justify-between text-sm font-medium text-slate-500">
                                        <span>Subtotal</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-slate-500">
                                        <span>Tax ({taxRate}%)</span>
                                        <span>${tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-black text-ocean-deep dark:text-white pt-3 border-t border-slate-200 dark:border-white/10">
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                    {depositAmount > 0 && (
                                        <div className="flex justify-between text-sm font-bold text-slate-400">
                                            <span>Deposit Required</span>
                                            <span>-${depositAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </form>

                        <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end items-center">
                            <button 
                                type="button"
                                onClick={() => { setIsCreateModalOpen(false); resetForm(); }}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateInvoice}
                                disabled={isProcessing || lineItems.length === 0}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                Save Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
