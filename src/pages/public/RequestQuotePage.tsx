import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QuoteStatus } from '../../types'
import { useQuote } from '../../contexts/QuoteContext'
import { quoteService } from '../../services/quoteService'
import { clientService } from '../../services/clientService'

const quickItems = [
    { label: 'Tents', icon: 'celebration' },
    { label: 'Chairs', icon: 'event_seat' },
    { label: 'Tables', icon: 'restaurant' },
    { label: 'Linens', icon: 'layers' },
    { label: 'Catering Gear', icon: 'outdoor_grill' },
    { label: 'Decor', icon: 'temp_preserve' },
]

export default function RequestQuotePage() {
    const [submitted, setSubmitted] = useState(false)
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        eventType: '',
        eventDate: '',
        guestCount: '',
        location: '',
        details: ''
    })

    const { cartItems, cartSubtotal, removeFromCart, updateQuantity, clearCart } = useQuote()

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        // Map HTML IDs back to form state keys
        const keyMap: Record<string, keyof typeof formData> = {
            'name': 'name',
            'email': 'email',
            'phone': 'phone',
            'company': 'company',
            'event-type': 'eventType',
            'event-date': 'eventDate',
            'guest-count': 'guestCount',
            'location': 'location',
            'details': 'details'
        }

        if (keyMap[id]) {
            setFormData(prev => ({ ...prev, [keyMap[id]]: value }))
        }
    }

    const toggleItem = (label: string) => {
        setSelectedItems(prev =>
            prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitError('')

        try {
            let linkedClientId: string | undefined

            // Resolve/Create client first so quote can be linked end-to-end
            if (formData.email) {
                const existingClients = await clientService.getByEmail(formData.email)
                if (existingClients.length > 0) {
                    linkedClientId = existingClients[0].id
                } else {
                    const newClientId = await clientService.create({
                        contactName: formData.name,
                        businessName: '',
                        email: formData.email,
                        phone: formData.phone || '',
                        billingAddress: '',
                        billingCity: '',
                        billingState: '',
                        billingZip: '',
                        status: 'lead',
                        notes: `Automatically created as Lead from quote request on ${new Date().toLocaleDateString()}`,
                        createdAt: new Date(),
                        lifetimeValue: 0
                    } as any)
                    linkedClientId = newClientId
                }
            }

            // Include quick items in the details if selected
            let finalDetails = formData.details
            if (selectedItems.length > 0) {
                finalDetails += `\n\nInterested in: ${selectedItems.join(', ')}`
            }

            await quoteService.create({
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                eventDate: formData.eventDate,
                eventType: formData.eventType,
                guestCount: parseInt(formData.guestCount) || 0,
                venue: formData.location,
                status: QuoteStatus.Sent,
                items: cartItems.map(item => ({
                    productId: item.inventoryItem.id,
                    name: item.inventoryItem.name,
                    quantity: item.quantity,
                    price: item.inventoryItem.rentalPrice || 0
                })), // Attach the cart items
                total: cartSubtotal || 0,
                notes: finalDetails,
                // Defaults for Quote interface
                eventId: '',
                clientId: linkedClientId,
                tax: 0,
                discount: 0,
                depositRequired: 0,
                followUpCount: 0,
                expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days expiration
                createdAt: new Date()
            })

            setSubmitted(true)
            clearCart() // Empty cart after successful submission
            window.scrollTo(0, 0)
        } catch (error: any) {
            console.error('Submission error:', error)
            setSubmitError('Failed to submit quote request. Please try again or call us.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <main className="pt-32 pb-20 dark:bg-background-dark min-h-screen hero-pattern flex items-center justify-center">
                <div className="max-w-2xl w-full px-6">
                    <div className="bg-white dark:bg-white/5 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl p-12 md:p-20 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="size-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mx-auto">
                            <span className="material-symbols-outlined text-5xl">check_circle</span>
                        </div>
                        <h1 className="text-4xl font-black text-ocean-deep dark:text-white">Submission <span className="text-primary italic">Received!</span></h1>
                        <p className="text-slate-500 dark:text-white/60 text-lg leading-relaxed">
                            Thank you for reaching out! Patrick and the team will review your details and get back to you within 24 hours with a personalized proposal.
                        </p>
                        <Link
                            to="/"
                            className="inline-block px-10 py-5 bg-ocean-deep text-white rounded-full font-bold text-lg hover:bg-primary transition-all shadow-xl"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="pt-32 pb-20 dark:bg-background-dark min-h-screen hero-pattern">
            <div className="max-w-4xl mx-auto px-6">
                <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
                    <div className="bg-ocean-deep p-10 md:p-16 text-center space-y-4">
                        <h1 className="text-3xl md:text-5xl font-black text-white">Let's Create <span className="text-primary italic">Magic</span></h1>
                        <p className="text-white/70 text-lg">Tell us about your event and we'll handle the rest.</p>
                    </div>

                    <form className="p-10 md:p-16 space-y-12" onSubmit={handleSubmit}>

                        {/* Cart Summary Section */}
                        {cartItems.length > 0 && (
                            <div className="space-y-6 bg-slate-50 dark:bg-white/5 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-white/10">
                                <h2 className="text-xl font-bold text-ocean-deep dark:text-white flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">shopping_cart</span>
                                    Your Estimated Quote
                                </h2>

                                <div className="space-y-4">
                                    {cartItems.map((item) => (
                                        <div key={item.inventoryItem.id} className="flex items-center justify-between bg-white dark:bg-background-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-4 flex-1">
                                                {item.inventoryItem.images && item.inventoryItem.images.length > 0 ? (
                                                    <img src={item.inventoryItem.images[0]} alt={item.inventoryItem.name} className="w-12 h-12 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/10 rounded-lg flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-slate-400">image</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-ocean-deep dark:text-white">{item.inventoryItem.name}</h3>
                                                    <p className="text-slate-500 text-sm">${item.inventoryItem.rentalPrice?.toFixed(2)} / item</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-lg p-1">
                                                    <button type="button" onClick={() => updateQuantity(item.inventoryItem.id, Math.max(1, item.quantity - 1))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-ocean-deep dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-white/10 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">remove</span>
                                                    </button>
                                                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                                    <button type="button" onClick={() => updateQuantity(item.inventoryItem.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-ocean-deep dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-white/10 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">add</span>
                                                    </button>
                                                </div>
                                                <p className="font-bold text-ocean-deep dark:text-white w-20 text-right">
                                                    ${((item.inventoryItem.rentalPrice || 0) * item.quantity).toFixed(2)}
                                                </p>
                                                <button type="button" onClick={() => removeFromCart(item.inventoryItem.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                                    <span className="font-bold text-slate-500">Estimated Total</span>
                                    <span className="text-2xl font-black text-primary">${cartSubtotal.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {/* Personal Info */}
                        <div className="space-y-8">
                            <h2 className="text-xl font-bold text-ocean-deep dark:text-white flex items-center gap-3">
                                <span className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-sm">01</span>
                                Contact Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                                    <input
                                        type="text" id="name" required
                                        value={formData.name} onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Eleanor Facey"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                                    <input
                                        type="email" id="email" required
                                        value={formData.email} onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="hello@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-bold text-slate-500 uppercase tracking-wider">Phone Number *</label>
                                    <input
                                        type="tel" id="phone" required
                                        value={formData.phone} onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="+1 (758) 555-0123"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="company" className="text-sm font-bold text-slate-500 uppercase tracking-wider">Organization</label>
                                    <input
                                        type="text" id="company"
                                        value={formData.company} onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Event Logistics */}
                        <div className="space-y-8">
                            <h2 className="text-xl font-bold text-ocean-deep dark:text-white flex items-center gap-3">
                                <span className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-sm">02</span>
                                Event Logistics
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="event-type" className="text-sm font-bold text-slate-500 uppercase tracking-wider">Event Type *</label>
                                    <select
                                        id="event-type" required
                                        value={formData.eventType} onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                                    >
                                        <option value="">Select type...</option>
                                        <option value="wedding">Wedding</option>
                                        <option value="corporate">Corporate Event</option>
                                        <option value="birthday">Private Party</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="event-date" className="text-sm font-bold text-slate-500 uppercase tracking-wider">Date *</label>
                                    <input
                                        type="date" id="event-date" required
                                        value={formData.eventDate} onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="guest-count" className="text-sm font-bold text-slate-500 uppercase tracking-wider">Estimated Guests</label>
                                    <input
                                        type="number" id="guest-count"
                                        value={formData.guestCount} onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="e.g. 100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="location" className="text-sm font-bold text-slate-500 uppercase tracking-wider">Venue Location</label>
                                    <input
                                        type="text" id="location"
                                        value={formData.location} onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="e.g. Pigeon Island"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="space-y-8">
                            <h2 className="text-xl font-bold text-ocean-deep dark:text-white flex items-center gap-3">
                                <span className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-sm">03</span>
                                Requirements
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {quickItems.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => toggleItem(item.label)}
                                        className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all ${selectedItems.includes(item.label)
                                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[0.98]'
                                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:border-primary/50'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                        <span className="text-xs font-bold uppercase tracking-tight">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="details" className="text-sm font-bold text-slate-500 uppercase tracking-wider">Message / Specific Needs</label>
                                <textarea
                                    id="details" rows={5}
                                    value={formData.details} onChange={handleInputChange}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="Tell us about your theme, specific menu interests, or quantities needed..."
                                />
                            </div>
                        </div>

                        {submitError && (
                            <div className="p-4 bg-red-100 text-red-600 rounded-xl font-bold flex items-center gap-3 justify-center">
                                <span className="material-symbols-outlined">error</span>
                                {submitError}
                            </div>
                        )}

                        <div className="pt-8">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-6 bg-primary text-white rounded-2xl font-black text-xl shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="size-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    'Secure Your Quote Request'
                                )}
                            </button>
                            <p className="text-center text-slate-400 text-sm mt-6">
                                Patrick will personally review your request within 24 hours.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    )
}
