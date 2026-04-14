import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { inventoryService } from '../../services/inventoryService'
import { InventoryItem } from '../../types'
import { useQuote } from '../../contexts/QuoteContext'
import QuickViewModal from '../../components/public/QuickViewModal'
import { getPublicDataErrorMessage, isFirestorePermissionDenied } from '../../utils/firestoreErrors'

const categoryEmojis: Record<string, string> = {
    'All': '🌈',
    'tent': '🎪',
    'table': '🍽️',
    'chair': '🪑',
    'linen': '🧺',
    'catering_equipment': '👨‍🍳',
    'decoration': '✨',
    'lighting': '💡',
    'backdrop': '🖼️',
    'other': '📦'
}

// Convert ItemCategory values to display names
const formatCategory = (cat: string) => {
    return cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function CatalogPage() {
    const [activeFilter, setActiveFilter] = useState('All')
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('name-asc')
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [products, setProducts] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [hasPermissionError, setHasPermissionError] = useState(false)
    const { addToCart } = useQuote()

    const openQuickView = (item: InventoryItem) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const items = await inventoryService.getAll()
                setProducts(items.filter(item => item.status === 'active'))
            } catch (err: any) {
                setHasPermissionError(isFirestorePermissionDenied(err))
                setError(getPublicDataErrorMessage('catalog', err))
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchInventory()
    }, [])

    // Derive active categories from the items we actually have
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)))
    const filterOptions = ['All', ...uniqueCategories]

    // Category counts mapping
    const categoryCounts = products.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const filtered = products
        .filter(p => {
            const matchesFilter = activeFilter === 'All' || p.category === activeFilter
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description.toLowerCase().includes(searchTerm.toLowerCase())
            return matchesFilter && matchesSearch
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'price-asc': return a.rentalPrice - b.rentalPrice
                case 'price-desc': return b.rentalPrice - a.rentalPrice
                case 'name-asc': return a.name.localeCompare(b.name)
                case 'name-desc': return b.name.localeCompare(a.name)
                default: return 0
            }
        })

    return (
        <main className="py-24 pb-20 dark:bg-background-dark min-h-screen">
            <div className="max-w-7xl mx-auto px-6 space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black text-ocean-deep dark:text-white">
                            Rentals <span className="text-primary tracking-widest">Catalog</span>
                        </h1>
                        <p className="text-slate-500 text-lg">Curated collection of premium event essentials for your perfect day.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full sm:w-64">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                placeholder="Search rentals..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="relative w-full sm:w-48">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">sort</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary outline-none transition-all shadow-sm appearance-none cursor-pointer font-bold text-sm text-slate-600 dark:text-white/70"
                            >
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="price-asc">Price (Low-High)</option>
                                <option value="price-desc">Price (High-Low)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                        <p className="font-bold">{error}</p>
                        {hasPermissionError && (
                            <div className="mt-4">
                                <Link
                                    to="/request-quote"
                                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
                                >
                                    Continue With a Quote Request
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar">
                            {filterOptions.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveFilter(cat)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-bold shrink-0 transition-all border flex items-center gap-2 ${activeFilter === cat
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-white/70 border-slate-200 dark:border-white/10 hover:border-primary'
                                        }`}
                                >
                                    <span>{categoryEmojis[cat] || '📦'}</span>
                                    <span>{cat === 'All' ? 'All Items' : formatCategory(cat)}</span>
                                    {cat !== 'All' && (
                                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeFilter === cat ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}>
                                            {categoryCounts[cat] || 0}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filtered.map((product) => (
                                <div key={product.id} className="group space-y-4">
                                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                alt={product.name}
                                                src={product.images[0]}
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-6xl text-slate-300">image</span>
                                        )}
                                        
                                        {/* Overlay Buttons */}
                                        <div className="absolute inset-0 bg-ocean-deep/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button 
                                                onClick={() => openQuickView(product)}
                                                className="size-12 bg-white text-ocean-deep rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                                title="Quick View"
                                            >
                                                <span className="material-symbols-outlined">visibility</span>
                                            </button>
                                        </div>

                                        {product.notes && (
                                            <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20">
                                                {product.notes}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1 px-1">
                                        <h3 className="font-bold text-ocean-deep dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-slate-400 line-clamp-1">{product.description}</p>
                                            <p className="text-primary font-black ml-2">${product.rentalPrice?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addToCart(product, 1)}
                                        className="w-full py-3 bg-ocean-deep text-white rounded-xl text-sm font-bold hover:bg-primary active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                                        Add to Quote
                                    </button>
                                </div>
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className="text-center py-20">
                                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
                                <p className="text-slate-500 font-medium">No items found in this category.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <QuickViewModal 
                item={selectedItem}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddToCart={addToCart}
            />
        </main>
    )
}
