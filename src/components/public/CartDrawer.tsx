import { useQuote } from '../../contexts/QuoteContext'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

interface CartDrawerProps {
    isOpen: boolean
    onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { cartItems, cartSubtotal, removeFromCart, updateQuantity } = useQuote()

    return (
        <>
            <div
                className={clsx(
                    'fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                )}
                onClick={onClose}
            />

            <div className={clsx(
                'fixed right-0 top-0 z-[101] flex h-full w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-500 ease-out dark:bg-background-dark',
                isOpen ? 'translate-x-0' : 'translate-x-full'
            )}>
                <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/10 sm:p-6">
                    <div>
                        <h2 className="text-2xl font-black text-ocean-deep dark:text-white">Your <span className="text-primary italic">Quote</span></h2>
                        <p className="text-slate-500 dark:text-white/60 text-sm font-medium">Estimated selection</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
                    {cartItems.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 text-center opacity-70">
                            <div className="flex size-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5">
                                <span className="material-symbols-outlined text-4xl">shopping_cart</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-ocean-deep dark:text-white">Your cart is empty</h3>
                                <p className="text-sm text-slate-500">Browse our catalog and add items to your quote request.</p>
                            </div>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.inventoryItem.id} className="group flex gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                                <div className="size-20 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 dark:border-white/10">
                                    {item.inventoryItem.images?.[0] ? (
                                        <img src={item.inventoryItem.images[0]} alt={item.inventoryItem.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                            <span className="material-symbols-outlined">image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-bold text-ocean-deep dark:text-white truncate">{item.inventoryItem.name}</h3>
                                        <button
                                            onClick={() => removeFromCart(item.inventoryItem.id)}
                                            className="text-slate-400 transition-colors hover:text-red-500"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">${item.inventoryItem.rentalPrice?.toFixed(2)} ea</p>

                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-1 dark:border-white/10 dark:bg-white/5">
                                            <button
                                                onClick={() => updateQuantity(item.inventoryItem.id, Math.max(1, item.quantity - 1))}
                                                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-ocean-deep dark:hover:bg-white/10"
                                            >
                                                <span className="material-symbols-outlined text-xs">remove</span>
                                            </button>
                                            <span className="text-xs font-black min-w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.inventoryItem.id, item.quantity + 1)}
                                                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-ocean-deep dark:hover:bg-white/10"
                                            >
                                                <span className="material-symbols-outlined text-xs">add</span>
                                            </button>
                                        </div>
                                        <p className="font-black text-ocean-deep dark:text-white text-sm">
                                            ${((item.inventoryItem.rentalPrice || 0) * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="space-y-4 border-t border-slate-100 bg-slate-50/70 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-white/[0.02] sm:p-6">
                        <div className="flex items-center justify-between text-lg font-black text-ocean-deep dark:text-white">
                            <span>Estimated Total</span>
                            <span className="text-primary">${cartSubtotal.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-tight">
                            * Pricing is estimated. Delivery, setup, and sales tax will be calculated in your final quote.
                        </p>
                        <Link
                            to="/request-quote"
                            onClick={onClose}
                            className="block w-full rounded-2xl bg-primary py-4 text-center text-lg font-black text-white shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Request Official Quote
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
