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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6">
            <div
                className="absolute inset-0 bg-ocean-deep/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl animate-in fade-in zoom-in duration-300 dark:bg-background-dark sm:h-auto sm:max-h-[92dvh] sm:max-w-4xl sm:rounded-[32px]">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/70 text-ocean-deep backdrop-blur-md transition-colors hover:bg-white dark:bg-slate-900/60 dark:text-white dark:hover:bg-slate-900 sm:right-6 sm:top-6"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="flex flex-1 flex-col overflow-y-auto md:min-h-[400px] md:flex-row">
                    <div className="relative h-64 bg-slate-100 dark:bg-white/5 sm:h-80 md:h-auto md:w-1/2">
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
                            <div className="absolute left-4 top-4 rounded-full bg-primary px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/30 sm:left-6 sm:top-6">
                                {item.notes}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col justify-center space-y-6 p-5 sm:p-8 md:w-1/2 md:p-12">
                        <div className="space-y-2">
                            <p className="text-primary font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">label</span>
                                {item.category.replace('_', ' ')}
                            </p>
                            <h2 className="text-3xl font-black text-ocean-deep dark:text-white leading-tight md:text-4xl">
                                {item.name}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Description</h4>
                            <p className="text-lg leading-relaxed text-slate-500 dark:text-slate-400">
                                {item.description || 'No description available for this item.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 dark:border-white/5 sm:flex-row sm:items-end sm:justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Rental Cost</p>
                                <p className="text-3xl font-black text-ocean-deep dark:text-white sm:text-4xl">
                                    ${item.rentalPrice.toFixed(2)}
                                    <span className="text-sm font-medium text-slate-400 ml-2">/ day</span>
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    onAddToCart(item, 1)
                                    onClose()
                                }}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-4 font-black text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
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
