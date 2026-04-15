import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QuoteStatus } from '../../types'
import { useQuote } from '../../contexts/QuoteContext'
import { quoteService } from '../../services/quoteService'

const quickItems = [
    { label: 'Tents', icon: 'celebration' },
    { label: 'Chairs', icon: 'event_seat' },
    { label: 'Tables', icon: 'restaurant' },
    { label: 'Linens', icon: 'layers' },
    { label: 'Catering Gear', icon: 'outdoor_grill' },
    { label: 'Decor', icon: 'auto_awesome' },
]

export default function RequestQuotePage() {
    const [submitted, setSubmitted] = useState(false)
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        eventType: '',
        eventDate: '',
        guestCount: '',
        location: '',
        details: '',
    })

    const { cartItems, cartSubtotal, removeFromCart, updateQuantity, clearCart } = useQuote()

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        const keyMap: Record<string, keyof typeof formData> = {
            name: 'name',
            email: 'email',
            phone: 'phone',
            company: 'company',
            'event-type': 'eventType',
            'event-date': 'eventDate',
            'guest-count': 'guestCount',
            location: 'location',
            details: 'details',
        }

        if (keyMap[id]) {
            setFormData((prev) => ({ ...prev, [keyMap[id]]: value }))
        }
    }

    const toggleItem = (label: string) => {
        setSelectedItems((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitError('')

        try {
            let finalDetails = formData.details

            if (formData.company) {
                finalDetails += `${finalDetails ? '\n\n' : ''}Organization: ${formData.company}`
            }

            if (selectedItems.length > 0) {
                finalDetails += `${finalDetails ? '\n\n' : ''}Interested in: ${selectedItems.join(', ')}`
            }

            await quoteService.create({
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                company: formData.company,
                eventDate: formData.eventDate,
                eventType: formData.eventType,
                guestCount: parseInt(formData.guestCount) || 0,
                venue: formData.location,
                status: QuoteStatus.Pending,
                items: cartItems.map((item) => ({
                    productId: item.inventoryItem.id,
                    name: item.inventoryItem.name,
                    quantity: item.quantity,
                    price: item.inventoryItem.rentalPrice || 0,
                })),
                total: cartSubtotal || 0,
                notes: finalDetails,
                eventId: '',
                tax: 0,
                discount: 0,
                depositRequired: 0,
                followUpCount: 0,
                expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
            })

            setSubmitted(true)
            clearCart()
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
            <main className="hero-pattern flex min-h-screen items-center justify-center bg-background-light px-4 pb-20 pt-28 dark:bg-background-dark sm:px-6 sm:pt-32">
                <div className="w-full max-w-2xl">
                    <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-500 dark:border-white/10 dark:bg-white/5 sm:space-y-8 sm:rounded-[3rem] sm:p-12 md:p-16">
                        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/20 text-primary sm:size-24">
                            <span className="material-symbols-outlined text-4xl sm:text-5xl">check_circle</span>
                        </div>
                        <h1 className="text-3xl font-black text-ocean-deep dark:text-white sm:text-4xl">
                            Submission <span className="text-primary italic">Received!</span>
                        </h1>
                        <p className="text-base leading-relaxed text-slate-500 dark:text-white/60 sm:text-lg">
                            Thank you for reaching out! Patrick and the team will review your details and get back to you within 24 hours with a personalized proposal.
                        </p>
                        <Link
                            to="/"
                            className="inline-block rounded-full bg-ocean-deep px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:bg-primary sm:px-10 sm:py-5 sm:text-lg"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="hero-pattern min-h-screen bg-background-light pb-20 pt-28 dark:bg-background-dark sm:px-0 sm:pt-32">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-white/5 sm:rounded-[2.5rem]">
                    <div className="bg-ocean-deep px-6 py-8 text-center sm:px-10 sm:py-12 md:px-16 md:py-14">
                        <h1 className="text-3xl font-black text-white sm:text-4xl md:text-5xl">
                            Let&apos;s Create <span className="text-primary italic">Magic</span>
                        </h1>
                        <p className="mt-3 text-base text-white/70 sm:text-lg">Tell us about your event and we&apos;ll handle the rest.</p>
                    </div>

                    <form className="space-y-10 p-6 sm:p-8 md:p-12 lg:p-16" onSubmit={handleSubmit}>
                        {cartItems.length > 0 && (
                            <div className="space-y-6 rounded-[2rem] border border-slate-100 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5 sm:p-6 md:p-8">
                                <h2 className="flex items-center gap-3 text-xl font-bold text-ocean-deep dark:text-white">
                                    <span className="material-symbols-outlined text-primary">shopping_cart</span>
                                    Your Estimated Quote
                                </h2>

                                <div className="space-y-4">
                                    {cartItems.map((item) => (
                                        <div
                                            key={item.inventoryItem.id}
                                            className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-background-dark sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex flex-1 items-center gap-4">
                                                {item.inventoryItem.images && item.inventoryItem.images.length > 0 ? (
                                                    <img src={item.inventoryItem.images[0]} alt={item.inventoryItem.name} className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16" />
                                                ) : (
                                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 sm:h-16 sm:w-16">
                                                        <span className="material-symbols-outlined text-slate-400">image</span>
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="line-clamp-1 font-bold text-ocean-deep dark:text-white">{item.inventoryItem.name}</h3>
                                                    <p className="text-sm text-slate-500">${item.inventoryItem.rentalPrice?.toFixed(2)} / item</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-4">
                                                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-1 dark:bg-white/5">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.inventoryItem.id, Math.max(1, item.quantity - 1))}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-ocean-deep dark:hover:bg-white/10 dark:hover:text-white"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">remove</span>
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.inventoryItem.id, item.quantity + 1)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-ocean-deep dark:hover:bg-white/10 dark:hover:text-white"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">add</span>
                                                    </button>
                                                </div>
                                                <p className="text-right font-bold text-ocean-deep dark:text-white sm:min-w-[96px]">
                                                    ${((item.inventoryItem.rentalPrice || 0) * item.quantity).toFixed(2)}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.inventoryItem.id)}
                                                    className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/10">
                                    <span className="font-bold text-slate-500">Estimated Total</span>
                                    <span className="text-2xl font-black text-primary">${cartSubtotal.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-8">
                            <h2 className="flex items-center gap-3 text-xl font-bold text-ocean-deep dark:text-white">
                                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">01</span>
                                Contact Details
                            </h2>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-slate-500">Full Name *</label>
                                    <input type="text" id="name" required value={formData.name} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5" placeholder="Eleanor Facey" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-bold uppercase tracking-wider text-slate-500">Email Address *</label>
                                    <input type="email" id="email" required value={formData.email} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5" placeholder="hello@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-bold uppercase tracking-wider text-slate-500">Phone Number *</label>
                                    <input type="tel" id="phone" required value={formData.phone} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5" placeholder="+1 (758) 555-0123" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="company" className="text-sm font-bold uppercase tracking-wider text-slate-500">Organization</label>
                                    <input type="text" id="company" value={formData.company} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5" placeholder="Optional" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h2 className="flex items-center gap-3 text-xl font-bold text-ocean-deep dark:text-white">
                                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">02</span>
                                Event Logistics
                            </h2>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="event-type" className="text-sm font-bold uppercase tracking-wider text-slate-500">Event Type *</label>
                                    <select id="event-type" required value={formData.eventType} onChange={handleInputChange} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5">
                                        <option value="">Select type...</option>
                                        <option value="wedding">Wedding</option>
                                        <option value="corporate">Corporate Event</option>
                                        <option value="birthday">Private Party</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="event-date" className="text-sm font-bold uppercase tracking-wider text-slate-500">Date *</label>
                                    <input type="date" id="event-date" required value={formData.eventDate} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="guest-count" className="text-sm font-bold uppercase tracking-wider text-slate-500">Estimated Guests</label>
                                    <input type="number" id="guest-count" value={formData.guestCount} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5" placeholder="e.g. 100" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="location" className="text-sm font-bold uppercase tracking-wider text-slate-500">Venue Location</label>
                                    <input type="text" id="location" value={formData.location} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5" placeholder="e.g. Pigeon Island" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h2 className="flex items-center gap-3 text-xl font-bold text-ocean-deep dark:text-white">
                                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">03</span>
                                Requirements
                            </h2>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                                {quickItems.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => toggleItem(item.label)}
                                        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 text-center transition-all sm:p-6 ${
                                            selectedItems.includes(item.label)
                                                ? 'scale-[0.98] border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-primary/50 dark:border-white/10 dark:bg-white/5 dark:text-white/60'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                        <span className="text-xs font-bold uppercase tracking-tight sm:text-sm">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="details" className="text-sm font-bold uppercase tracking-wider text-slate-500">Message / Specific Needs</label>
                                <textarea id="details" rows={5} value={formData.details} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5" placeholder="Tell us about your theme, specific menu interests, or quantities needed..." />
                            </div>
                        </div>

                        {submitError && (
                            <div className="flex items-center justify-center gap-3 rounded-xl bg-red-100 p-4 font-bold text-red-600">
                                <span className="material-symbols-outlined">error</span>
                                {submitError}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-lg font-black text-white shadow-2xl shadow-primary/40 transition-all active:scale-[0.98] hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="size-6 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                                        Processing...
                                    </>
                                ) : (
                                    'Secure Your Quote Request'
                                )}
                            </button>
                            <p className="mt-6 text-center text-sm text-slate-400">
                                Patrick will personally review your request within 24 hours.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    )
}
