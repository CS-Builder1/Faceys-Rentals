import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Testimonials from '../../components/public/Testimonials'
import { inventoryService } from '../../services/inventoryService'
import { InventoryItem } from '../../types'
import { useQuote } from '../../contexts/QuoteContext'
import { getPublicDataErrorMessage, isFirestorePermissionDenied } from '../../utils/firestoreErrors'

const inclusions = [
    { title: 'Chef & Service Staff', desc: 'Professional culinary team and attentive servers for your entire event.', icon: 'groups' },
    { title: 'Premium Rentals', desc: 'High-quality dinnerware, glassware, and linens included in every package.', icon: 'workspace_premium' },
    { title: 'Setup & Breakdown', desc: 'Complete arrival, station setup, and post-event cleanup handled by our team.', icon: 'auto_fix_high' },
    { title: 'Local Ingredients', desc: 'We source the freshest seasonal produce from Saint Lucian farmers and fishers.', icon: 'eco' },
]

const sampleMenus = [
    {
        title: 'Island Breeze Buffet',
        items: ['Tropical Fruit Platter', 'Jerk Chicken Skewers', 'Saltfish Fritters', 'Macaroni Pie', 'Callaloo Soup'],
        theme: 'Casual & Vibrant',
    },
    {
        title: 'Lucian Fusion Plated',
        items: ['Cocoa-Rubbed Pork Tenderloin', 'Grilled Mahi-Mahi with Creole Sauce', 'Green Fig & Saltfish Salad', 'Yam Mash'],
        theme: 'Elegant & Sophisticated',
    },
    {
        title: 'Sunset Cocktail Hour',
        items: ['Coconut Shrimp', 'Plantain Crisps', 'Mini Lamb Rotis', 'Breadfruit Bites', 'Rum Punch Bar'],
        theme: 'Light & Social',
    },
]

const galleryImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCfZnMi6IZVEk95FEW9IHq4qiUDGz3dPJWJeg3fgcqleJ8FJUd_p8-CjLWR-WouauRN_0nFbgpWfBA44pWOqDOsRg--Y55q6ylo1UH_8VvBFLSnw3ZqzvhXhw9PJHxaKBv1at84S4A2-nvzg6NW6DFxCHKFz4Jnm6iEQbGWYKBJm0mtpF1zv0rrckP4iVHV78ahe7FZ8jQQfGEyECRSGOC5BkwVuNQK0MNah__Tavsdxv7L3C5rcsN2c879UFAxcLLT71145QxGVGw',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAdLLQ634RpC3Yi5hiZqN-8RKHUragGiBGYJsgGBzr3ygdPhCVHnJxT4N_cglvB58hTnPKHuWUqh0c39xt7mZLmHHWC4AyvTp-VC2kduluSuqsRCde0koY1kE5yy4J8N7CIiykk7-0p0QFqvfUEES4D0N7qayviUKELpgJ6DMsQIP4HYcHrlzx-W4HKv8fJZur2CaGxf75U0HJVg9sY6-bEMyFYfMVrA2MSeOei9GcNqOINaA7UAjoYaZ9Ea9LCSCI5rja3DBIfHj0',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCC3WLReLQpP0CqrJ5IhV3Rmt4lDb3Xmljh6jA0N36zI7N73jy7JJ0gtgyD7znUdpqdeQXmoArut1iJ6-qQnnmTPHqwWCOca9XKIejbt0lX3iIo3TNDPS0Qsqf1Wl_ugsJ6aI7yiStcVHneM2iqAenUMnBAcUgojl1WKdM3f1LT5lQ7KzfVUhgNf6QD2scU5kpMfj7gxA0EokrFAmFVIS8GQq7kwPeqE6VexW8qvWtius3pE1gUiZJIgPvgv7REgNAXTiwx0L58BOk',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDk3hcpZKxAfHyHwoycfOqwDSA_Ho1q2ZFRTvpCcyQRDqVPBCutvU7hgy7stJD7RAnVncwBJ-bXFyGw3Do_8U6ApmtIpZfKtJpa4oUTmSfHVID5bFp-FIGp0kBXjkXArTKCQscyP0bgcGhIwQnTgCV4JP7hTZbLGgqLdctjpDCjGtHBhYzjN3BcqXKqIjwoqmQQq7wbC8VipLXb0MbFFp0W-MhY3-XIez0j-yWq5njMGu5TaR2ngekhtViAfSrrHuHpFGECKXLhM-w',
]

export default function CateringPage() {
    const [packages, setPackages] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [hasPermissionError, setHasPermissionError] = useState(false)
    const { addToCart } = useQuote()

    useEffect(() => {
        const fetchCateringOptions = async () => {
            try {
                const items = await inventoryService.getAll()
                const cateringItems = items.filter(
                    (item) => item.status === 'active' && (item.category === 'catering_equipment' || item.pricingModel === 'per_head')
                )
                setPackages(cateringItems)
            } catch (err: any) {
                setHasPermissionError(isFirestorePermissionDenied(err))
                setError(getPublicDataErrorMessage('catering options', err))
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        void fetchCateringOptions()
    }, [])

    return (
        <div className="min-h-screen bg-background-light py-24 pb-20 dark:bg-background-dark">
            <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:space-y-24">
                <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] shadow-2xl sm:min-h-[520px] sm:rounded-[3rem]">
                    <img
                        className="absolute inset-0 h-full w-full object-cover"
                        alt="Authentic Saint Lucian gourmet catering spread"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdLLQ634RpC3Yi5hiZqN-8RKHUragGiBGYJsgGBzr3ygdPhCVHnJxT4N_cglvB58hTnPKHuWUqh0c39xt7mZLmHHWC4AyvTp-VC2kduluSuqsRCde0koY1kE5yy4J8N7CIiykk7-0p0QFqvfUEES4D0N7qayviUKELpgJ6DMsQIP4HYcHrlzx-W4HKv8fJZur2CaGxf75U0HJVg9sY6-bEMyFYfMVrA2MSeOei9GcNqOINaA7UAjoYaZ9Ea9LCSCI5rja3DBIfHj0"
                    />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-r from-ocean-deep/90 via-ocean-deep/55 to-transparent px-6 py-10 sm:items-center sm:px-10 md:px-16 lg:px-20">
                        <div className="max-w-xl space-y-5 text-white">
                            <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
                                Authentic <span className="text-primary italic">Flavors</span>, Modern <span className="text-gradient-coral">Elegance</span>
                            </h1>
                            <p className="text-base font-light text-white/80 sm:text-lg">
                                Experience the finest Caribbean fusion catering, where traditional Saint Lucian ingredients meet contemporary culinary artistry.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="space-y-4 text-center">
                        <h2 className="text-3xl font-extrabold text-ocean-deep dark:text-white sm:text-4xl">Our Signature Options</h2>
                        <p className="text-slate-500">Carefully crafted menus and catering equipment for every occasion.</p>
                        <div className="mx-auto h-1.5 w-20 rounded-full bg-primary"></div>
                    </div>

                    {error && (
                        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-red-700">
                            <p className="font-bold">{error}</p>
                            {hasPermissionError && (
                                <div className="mt-4">
                                    <Link
                                        to="/request-quote"
                                        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
                                    >
                                        Request Catering Assistance
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="mx-auto max-w-2xl py-20 text-center">
                            <span className="material-symbols-outlined mb-4 text-6xl text-slate-300">restaurant</span>
                            <h3 className="mb-2 text-xl font-bold text-ocean-deep dark:text-white">Check Back Soon</h3>
                            <p className="font-medium text-slate-500">
                                We are currently updating our catering menu. Please call us to discuss your event catering needs.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {packages.map((pkg) => (
                                <div key={pkg.id} className="flex flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl transition-all duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5 sm:p-8">
                                    <div className="relative mb-6 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                                        {pkg.images && pkg.images.length > 0 ? (
                                            <img
                                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                                                alt={pkg.name}
                                                src={pkg.images[0]}
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl text-slate-300">restaurant_menu</span>
                                        )}
                                        {pkg.notes && (
                                            <div className="absolute right-4 top-4 rounded-full border border-primary/20 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary backdrop-blur-md dark:bg-background-dark/90">
                                                {pkg.notes}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="mb-4 line-clamp-2 text-2xl font-bold text-ocean-deep dark:text-white">{pkg.name}</h3>
                                    <p className="mb-8 flex-grow text-sm leading-relaxed text-slate-500 dark:text-white/60">{pkg.description}</p>

                                    <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 dark:border-white/5">
                                        <div>
                                            <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                                                {pkg.pricingModel === 'per_head' ? 'Starting at' : 'Rental Price'}
                                            </span>
                                            <span className="text-2xl font-black text-ocean-deep dark:text-white">
                                                ${pkg.rentalPrice?.toFixed(2) || '0.00'}
                                                {pkg.pricingModel === 'per_head' && <span className="ml-1 text-sm font-medium text-slate-400">/pp</span>}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => addToCart(pkg, 1)}
                                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ocean-deep py-4 font-bold text-white transition-colors hover:bg-primary"
                                        >
                                            <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                                            Add to Quote
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-10">
                    <div className="space-y-4 text-center">
                        <h2 className="text-3xl font-extrabold text-ocean-deep dark:text-white sm:text-4xl">
                            Sample <span className="text-primary italic">Inspiration</span>
                        </h2>
                        <p className="text-slate-500">A taste of what we can create for your special day.</p>
                        <div className="mx-auto h-1.5 w-20 rounded-full bg-primary"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {sampleMenus.map((menu) => (
                            <div key={menu.title} className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-sand-warm/10 p-6 transition-colors duration-500 hover:bg-primary/5 dark:bg-white/5 sm:p-8">
                                <div className="absolute right-0 top-0 p-6 opacity-5 transition-opacity group-hover:opacity-10">
                                    <span className="material-symbols-outlined text-6xl">restaurant_menu</span>
                                </div>
                                <div className="space-y-5">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{menu.theme}</span>
                                        <h3 className="text-2xl font-black text-ocean-deep dark:text-white">{menu.title}</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {menu.items.map((item) => (
                                            <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-white/70">
                                                <span className="size-1.5 rounded-full bg-primary"></span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] bg-ocean-gradient p-8 text-white sm:rounded-[3rem] sm:p-10 md:p-14 lg:p-20">
                    <div className="absolute right-0 top-0 p-10 opacity-10">
                        <span className="material-symbols-outlined text-[150px]">restaurant_menu</span>
                    </div>
                    <div className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black leading-tight sm:text-4xl">
                                The Facey&apos;s <br />
                                <span className="text-sand-warm italic">Standard</span>
                            </h2>
                            <p className="text-base font-light leading-relaxed text-white/80 sm:text-lg">
                                We believe catering is more than just food. It&apos;s an orchestration of taste, presentation, and impeccable service that defines your event atmosphere.
                            </p>
                            <Link to="/request-quote" className="inline-block rounded-full bg-white px-8 py-4 text-center font-bold text-ocean-deep shadow-xl transition-colors hover:bg-sand-warm">
                                Customize Your Menu
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                            {inclusions.map((item) => (
                                <div key={item.title} className="space-y-3 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md transition-all hover:bg-white/20 sm:p-6">
                                    <span className="material-symbols-outlined text-2xl text-primary">{item.icon}</span>
                                    <h4 className="text-lg font-bold">{item.title}</h4>
                                    <p className="text-sm leading-relaxed text-white/70">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="space-y-4 text-center">
                        <h2 className="text-3xl font-extrabold text-ocean-deep dark:text-white sm:text-4xl">
                            Culinary <span className="text-primary italic">Artistry</span>
                        </h2>
                        <p className="text-slate-500">Every plate is a masterpiece crafted with St. Lucian pride.</p>
                        <div className="mx-auto h-1.5 w-20 rounded-full bg-primary"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {galleryImages.map((src, idx) => (
                            <div key={idx} className="group aspect-square overflow-hidden rounded-3xl shadow-lg transition-all hover:shadow-2xl">
                                <img src={src} alt={`Catering dish ${idx + 1}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            </div>
                        ))}
                    </div>
                </div>

                <Testimonials />

                <div className="mx-auto max-w-2xl space-y-8 py-4 text-center">
                    <h2 className="text-3xl font-black text-ocean-deep dark:text-white sm:text-4xl">Ready for a Tasting?</h2>
                    <p className="leading-relaxed text-slate-500">
                        Let&apos;s discuss your event vision and create a bespoke menu that will leave your guests talking for years to come.
                    </p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Link to="/request-quote" className="rounded-full bg-primary px-8 py-4 text-center text-lg font-bold text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 sm:px-10 sm:py-5">
                            Start Your Quote
                        </Link>
                        <a href="tel:+17585550123" className="rounded-full border-2 border-ocean-deep px-8 py-4 text-center text-lg font-bold text-ocean-deep transition-all hover:bg-ocean-deep hover:text-white dark:border-white dark:text-white sm:px-10 sm:py-5">
                            Call Our Concierge
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
