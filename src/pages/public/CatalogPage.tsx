import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { inventoryService } from '../../services/inventoryService'
import { InventoryItem } from '../../types'
import { useQuote } from '../../contexts/QuoteContext'
import QuickViewModal from '../../components/public/QuickViewModal'
import { getPublicDataErrorMessage, isFirestorePermissionDenied } from '../../utils/firestoreErrors'

const categoryIcons: Record<string, string> = {
    All: 'apps',
    tent: 'festival',
    table: 'table_restaurant',
    chair: 'chair',
    linen: 'layers',
    catering_equipment: 'restaurant',
    decoration: 'auto_awesome',
    lighting: 'lightbulb',
    backdrop: 'gallery_thumbnail',
    other: 'inventory_2',
}

const formatCategory = (cat: string) => cat.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

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

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const items = await inventoryService.getAll()
                setProducts(items.filter((item) => item.status === 'active'))
            } catch (err: any) {
                setHasPermissionError(isFirestorePermissionDenied(err))
                setError(getPublicDataErrorMessage('catalog', err))
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        void fetchInventory()
    }, [])

    const openQuickView = (item: InventoryItem) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const uniqueCategories = Array.from(new Set(products.map((product) => product.category)))
    const filterOptions = ['All', ...uniqueCategories]

    const categoryCounts = products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const filteredProducts = products
        .filter((product) => {
            const matchesFilter = activeFilter === 'All' || product.category === activeFilter
            const query = searchTerm.toLowerCase()
            const matchesSearch =
                product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)

            return matchesFilter && matchesSearch
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'price-asc':
                    return a.rentalPrice - b.rentalPrice
                case 'price-desc':
                    return b.rentalPrice - a.rentalPrice
                case 'name-asc':
                    return a.name.localeCompare(b.name)
                case 'name-desc':
                    return b.name.localeCompare(a.name)
                default:
                    return 0
            }
        })

    return (
        <main className="min-h-screen bg-background-light py-24 pb-20 dark:bg-background-dark">
            <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:space-y-10">
                <div className="page-header">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-ocean-deep dark:text-white sm:text-5xl">
                            Rentals <span className="tracking-widest text-primary">Catalog</span>
                        </h1>
                        <p className="max-w-2xl text-base text-slate-500 sm:text-lg">
                            Curated event essentials, polished presentation pieces, and dependable inventory for celebrations of every size.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row md:justify-end">
                        <div className="relative w-full">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                placeholder="Search rentals..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 shadow-sm outline-none transition-all focus:border-primary dark:border-white/10 dark:bg-white/5"
                            />
                        </div>
                        <div className="relative w-full md:max-w-[220px]">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">sort</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-bold text-slate-600 shadow-sm outline-none transition-all focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white/70"
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

                {!loading && !error && (
                    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-white/60">
                            Showing <span className="font-bold text-ocean-deep dark:text-white">{filteredProducts.length}</span> items
                            {activeFilter !== 'All' ? ` in ${formatCategory(activeFilter)}` : ''}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
                                {products.length} active listings
                            </span>
                            {searchTerm && (
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                                    Filtered by "{searchTerm}"
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                            {filterOptions.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveFilter(category)}
                                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-all ${
                                        activeFilter === category
                                            ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white/70'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-base">{categoryIcons[category] || 'inventory_2'}</span>
                                    <span>{category === 'All' ? 'All Items' : formatCategory(category)}</span>
                                    {category !== 'All' && (
                                        <span
                                            className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                                                activeFilter === category ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 dark:bg-white/10'
                                            }`}
                                        >
                                            {categoryCounts[category] || 0}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredProducts.map((product) => (
                                <div key={product.id} className="group flex flex-col gap-4">
                                    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 shadow-sm dark:border-white/10 dark:bg-white/5">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                alt={product.name}
                                                src={product.images[0]}
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-6xl text-slate-300">image</span>
                                        )}

                                        <div className="absolute inset-x-4 bottom-4 flex translate-y-0 justify-center opacity-100 transition-all md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                                            <button
                                                onClick={() => openQuickView(product)}
                                                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ocean-deep shadow-lg transition-transform hover:scale-105 dark:bg-background-dark dark:text-white"
                                                title="Quick View"
                                            >
                                                <span className="material-symbols-outlined text-base">visibility</span>
                                                Quick View
                                            </button>
                                        </div>

                                        {product.notes && (
                                            <div className="absolute right-4 top-4 rounded-full border border-primary/20 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary backdrop-blur-md dark:bg-background-dark/90">
                                                {product.notes}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 px-1">
                                        <div className="space-y-1">
                                            <h3 className="line-clamp-1 font-bold text-ocean-deep transition-colors group-hover:text-primary dark:text-white">
                                                {product.name}
                                            </h3>
                                            <p className="line-clamp-2 text-sm text-slate-500 dark:text-white/60">{product.description}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:bg-white/10 dark:text-white/60">
                                                {formatCategory(product.category)}
                                            </span>
                                            <p className="text-lg font-black text-primary">${product.rentalPrice?.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => addToCart(product, 1)}
                                        className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-ocean-deep py-3 text-sm font-bold text-white transition-all active:scale-[0.98] hover:bg-primary"
                                    >
                                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                                        Add to Quote
                                    </button>
                                </div>
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="py-20 text-center">
                                <span className="material-symbols-outlined mb-4 text-6xl text-slate-300">search_off</span>
                                <p className="font-medium text-slate-500">No items found in this category.</p>
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
