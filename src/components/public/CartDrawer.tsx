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
            {/* Backdrop */}
            <div 
                className={clsx(
                    "fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={clsx(
                "fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-background-dark shadow-2xl z-[101] transform transition-transform duration-500 ease-out flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-ocean-deep dark:text-white">Your <span className="text-primary italic">Quote</span></h2>
                        <p className="text-slate-500 dark:text-white/60 text-sm font-medium">Estimated selection</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                            <div className="size-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined text-4xl">shopping_cart</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-ocean-deep dark:text-white">Your cart is empty</h3>
                                <p className="text-sm text-slate-500">Browse our catalog and add items to your quote request.</p>
                            </div>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.inventoryItem.id} className="flex gap-4 group">
                                <div className="size-20 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10 flex-shrink-0">
                                    {item.inventoryItem.images?.[0] ? (
                                        <img src={item.inventoryItem.images[0]} alt={item.inventoryItem.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                            <span className="material-symbols-outlined">image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-ocean-deep dark:text-white truncate">{item.inventoryItem.name}</h3>
                                        <button 
                                            onClick={() => removeFromCart(item.inventoryItem.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">${item.inventoryItem.rentalPrice?.toFixed(2)} ea</p>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10 p-1">
                                            <button 
                                                onClick={() => updateQuantity(item.inventoryItem.id, Math.max(1, item.quantity - 1))}
                                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-ocean-deep"
                                            >
                                                <span className="material-symbols-outlined text-xs">remove</span>
                                            </button>
                                            <span className="text-xs font-black min-w-4 text-center">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.inventoryItem.id, item.quantity + 1)}
                                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-ocean-deep"
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

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="p-6 border-t border-slate-100 dark:border-white/10 space-y-4 bg-slate-50/50 dark:bg-white/[0.02]">
                        <div className="flex justify-between items-center text-lg font-black text-ocean-deep dark:text-white">
                            <span>Estimated Total</span>
                            <span className="text-primary">${cartSubtotal.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-tight">
                            * Pricing is estimated. Delivery, setup, and sales tax will be calculated in your final quote.
                        </p>
                        <Link 
                            to="/request-quote"
                            onClick={onClose}
                            className="block w-full py-4 bg-primary text-white rounded-2xl text-center font-black text-lg shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Request Official Quote
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
