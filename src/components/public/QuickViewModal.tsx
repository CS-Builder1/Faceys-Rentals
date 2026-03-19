import { InventoryItem } from '../../types'

interface QuickViewModalProps {
    item: InventoryItem | null
    isOpen: boolean
    onClose: () => void
    onAddToCart: (item: InventoryItem, qty: number) => void
}

export default function QuickViewModal({ item, isOpen, onClose, onAddToCart }: QuickViewModalProps) {
    if (!isOpen || !item) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-ocean-deep/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-white dark:bg-background-dark rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 size-10 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-ocean-deep dark:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="flex flex-col md:flex-row min-h-[400px]">
                    {/* Image Section */}
                    <div className="md:w-1/2 relative bg-slate-100 dark:bg-white/5">
                        {item.images && item.images.length > 0 ? (
                            <img 
                                src={item.images[0]} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <span className="material-symbols-outlined text-8xl">image</span>
                            </div>
                        )}
                        {item.notes && (
                            <div className="absolute top-6 left-6 px-4 py-1.5 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/30">
                                {item.notes}
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-8">
                        <div className="space-y-2">
                            <p className="text-primary font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">label</span>
                                {item.category.replace('_', ' ')}
                            </p>
                            <h2 className="text-3xl md:text-4xl font-black text-ocean-deep dark:text-white leading-tight">
                                {item.name}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Description</h4>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
                                {item.description || "No description available for this item."}
                            </p>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Rental Cost</p>
                                <p className="text-4xl font-black text-ocean-deep dark:text-white">
                                    ${item.rentalPrice.toFixed(2)}
                                    <span className="text-sm font-medium text-slate-400 ml-2">/ day</span>
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    onAddToCart(item, 1)
                                    onClose()
                                }}
                                className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center gap-3"
                            >
                                <span className="material-symbols-outlined">add_shopping_cart</span>
                                Add to Quote
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
