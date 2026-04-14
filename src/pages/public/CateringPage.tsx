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
    { title: 'Local Ingredients', desc: 'We source the freshest seasonal produce from Saint Lucian farmers and fishers.', icon: 'eco' }
]

const sampleMenus = [
    {
        title: 'Island Breeze Buffet',
        items: ['Tropical Fruit Platter', 'Jerk Chicken Skewers', 'Saltfish Fritters', 'Macaroni Pie', 'Callaloo Soup'],
        theme: 'Casual & Vibrant'
    },
    {
        title: 'Lucian Fusion Plated',
        items: ['Cocoa-Rubbed Pork Tenderloin', 'Grilled Mahi-Mahi with Creole Sauce', 'Green Fig & Saltfish Salad', 'Yam Mash'],
        theme: 'Elegant & Sophisticated'
    },
    {
        title: 'Sunset Cocktail Hour',
        items: ['Coconut Shrimp', 'Plantain Crisps', 'Mini Lamb Rotis', 'Breadfruit Bites', 'Rum Punch Bar'],
        theme: 'Light & Social'
    }
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
                const cateringItems = items.filter(item =>
                    item.status === 'active' &&
                    (item.category === 'catering_equipment' || item.pricingModel === 'per_head')
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
        fetchCateringOptions()
    }, [])

    return (
        <div className="py-24 pb-20 dark:bg-background-dark min-h-screen">
            <div className="max-w-7xl mx-auto px-6 space-y-24">
                {/* Hero Section */}
                <div className="relative rounded-[3rem] overflow-hidden aspect-[21/9] min-h-[400px] shadow-2xl">
                    <img
                        className="absolute inset-0 w-full h-full object-cover"
                        alt="Authentic Saint Lucian gourmet catering spread"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdLLQ634RpC3Yi5hiZqN-8RKHUragGiBGYJsgGBzr3ygdPhCVHnJxT4N_cglvB58hTnPKHuWUqh0c39xt7mZLmHHWC4AyvTp-VC2kduluSuqsRCde0koY1kE5yy4J8N7CIiykk7-0p0QFqvfUEES4D0N7qayviUKELpgJ6DMsQIP4HYcHrlzx-W4HKv8fJZur2CaGxf75U0HJVg9sY6-bEMyFYfMVrA2MSeOei9GcNqOINaA7UAjoYaZ9Ea9LCSCI5rja3DBIfHj0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-ocean-deep/90 via-ocean-deep/40 to-transparent flex items-center px-12 md:px-20">
                        <div className="max-w-xl space-y-6 text-white">
                            <h1 className="text-4xl md:text-6xl font-black leading-tight">Authentic <span className="text-primary italic">Flavors</span>, Modern <span className="text-gradient-coral">Elegance</span></h1>
                            <p className="text-white/80 text-lg font-light">Experience the finest Caribbean fusion catering, where traditional Saint Lucian ingredients meet contemporary culinary artistry.</p>
                        </div>
                    </div>
                </div>

                {/* Menu Packages */}
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-ocean-deep dark:text-white">Our Signature Options</h2>
                        <p className="text-slate-500">Carefully crafted menus and catering equipment for every occasion.</p>
                        <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
                    </div>

                    {error && (
                        <div className="max-w-2xl mx-auto rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-red-700">
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
                            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="text-center py-20 max-w-2xl mx-auto">
                            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">restaurant</span>
                            <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-2">Check Back Soon</h3>
                            <p className="text-slate-500 font-medium">We are currently updating our catering menu. Please call us to discuss your event catering needs.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {packages.map((pkg) => (
                                <div key={pkg.id} className="group bg-white dark:bg-white/5 rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-xl hover:-translate-y-2 transition-all duration-500 flex flex-col">
                                    <div className="relative aspect-video mb-6 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
                                        {pkg.images && pkg.images.length > 0 ? (
                                            <img
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                alt={pkg.name}
                                                src={pkg.images[0]}
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl text-slate-300">restaurant_menu</span>
                                        )}
                                        {pkg.notes && (
                                            <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20">
                                                {pkg.notes}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold text-ocean-deep dark:text-white mb-4 line-clamp-1">{pkg.name}</h3>
                                    <p className="text-slate-500 dark:text-white/60 text-sm leading-relaxed mb-8 flex-grow line-clamp-3">{pkg.description}</p>

                                    <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col gap-4">
                                        <div>
                                            <span className="block text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
                                                {pkg.pricingModel === 'per_head' ? 'Starting at' : 'Rental Price'}
                                            </span>
                                            <span className="text-2xl font-black text-ocean-deep dark:text-white">
                                                ${pkg.rentalPrice?.toFixed(2) || '0.00'}
                                                {pkg.pricingModel === 'per_head' && <span className="text-sm font-medium text-slate-400">/pp</span>}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => addToCart(pkg, 1)}
                                            className="w-full py-4 bg-ocean-deep text-white rounded-xl font-bold hover:bg-primary transition-colors flex items-center justify-center gap-2"
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

                {/* Sample Menus Section */}
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-ocean-deep dark:text-white">Sample <span className="text-primary italic">Inspiration</span></h2>
                        <p className="text-slate-500">A taste of what we can create for your special day.</p>
                        <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {sampleMenus.map((menu) => (
                            <div key={menu.title} className="bg-sand-warm/10 dark:bg-white/5 p-8 rounded-[2rem] border border-primary/10 space-y-6 relative overflow-hidden group hover:bg-primary/5 transition-colors duration-500">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl">restaurant_menu</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{menu.theme}</span>
                                    <h3 className="text-2xl font-black text-ocean-deep dark:text-white">{menu.title}</h3>
                                </div>
                                <ul className="space-y-3">
                                    {menu.items.map((item) => (
                                        <li key={item} className="flex items-center gap-3 text-slate-600 dark:text-white/70 text-sm font-medium">
                                            <span className="size-1.5 bg-primary rounded-full"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* What's Included */}
                <div className="bg-ocean-gradient rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <span className="material-symbols-outlined text-[150px]">restaurant_menu</span>
                    </div>
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl font-black leading-tight">The Facey's <br /><span className="text-sand-warm italic">Standard</span></h2>
                            <p className="text-white/80 text-lg font-light leading-relaxed">
                                We believe catering is more than just food — it's an orchestration of taste, presentation, and impeccable service that defines your event's atmosphere.
                            </p>
                            <Link to="/request-quote" className="inline-block px-8 py-4 bg-white text-ocean-deep rounded-full font-bold hover:bg-sand-warm transition-colors shadow-xl text-center">
                                Customize Your Menu
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {inclusions.map((item) => (
                                <div key={item.title} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl space-y-3 hover:bg-white/20 transition-all">
                                    <span className="material-symbols-outlined text-primary text-2xl">{item.icon}</span>
                                    <h4 className="font-bold text-lg">{item.title}</h4>
                                    <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Food Gallery Section */}
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-ocean-deep dark:text-white">Culinary <span className="text-primary italic">Artistry</span></h2>
                        <p className="text-slate-500">Every plate is a masterpiece crafted with St. Lucian pride.</p>
                        <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuCfZnMi6IZVEk95FEW9IHq4qiUDGz3dPJWJeg3fgcqleJ8FJUd_p8-CjLWR-WouauRN_0nFbgpWfBA44pWOqDOsRg--Y55q6ylo1UH_8VvBFLSnw3ZqzvhXhw9PJHxaKBv1at84S4A2-nvzg6NW6DFxCHKFz4Jnm6iEQbGWYKBJm0mtpF1zv0rrckP4iVHV78ahe7FZ8jQQfGEyECRSGOC5BkwVuNQK0MNah__Tavsdxv7L3C5rcsN2c879UFAxcLLT71145QxGVGw',
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuAdLLQ634RpC3Yi5hiZqN-8RKHUragGiBGYJsgGBzr3ygdPhCVHnJxT4N_cglvB58hTnPKHuWUqh0c39xt7mZLmHHWC4AyvTp-VC2kduluSuqsRCde0koY1kE5yy4J8N7CIiykk7-0p0QFqvfUEES4D0N7qayviUKELpgJ6DMsQIP4HYcHrlzx-W4HKv8fJZur2CaGxf75U0HJVg9sY6-bEMyFYfMVrA2MSeOei9GcNqOINaA7UAjoYaZ9Ea9LCSCI5rja3DBIfHj0',
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuCC3WLReLQpP0CqrJ5IhV3Rmt4lDb3Xmljh6jA0N36zI7N73jy7JJ0gtgyD7znUdpqdeQXmoArut1iJ6-qQnnmTPHqwWCOca9XKIejbt0lX3iIo3TNDPS0Qsqf1Wl_ugsJ6aI7yiStcVHneM2iqAenUMnBAcUgojl1WKdM3f1LT5lQ7KzfVUhgNf6QD2scU5kpMfj7gxA0EokrFAmFVIS8GQq7kwPeqE6VexW8qvWtius3pE1gUiZJIgPvgv7REgNAXTiwx0L58BOk',
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuDk3hcpZKxAfHyHwoycfOqwDSA_Ho1q2ZFRTvpCcyQRDqVPBCutvU7hgy7stJD7RAnVncwBJ-bXFyGw3Do_8U6ApmtIpZfKtJpa4oUTmSfHVID5bFp-FIGp0kBXjkXArTKCQscyP0bgcGhIwQnTgCV4JP7hTZbLGgqLdctjpDCjGtHBhYzjN3BcqXKqIjwoqmQQq7wbC8VipLXb0MbFFp0W-MhY3-XIez0j-yWq5njMGu5TaR2ngekhtViAfSrrHuHpFGECKXLhM-w'
                        ].map((src, idx) => (
                            <div key={idx} className="aspect-square rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group">
                                <img src={src} alt={`Catering dish ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            </div>
                        ))}
                    </div>
                </div>

                <Testimonials />

                {/* CTA */}
                <div className="text-center py-12 max-w-2xl mx-auto space-y-8">
                    <h2 className="text-3xl md:text-4xl font-black text-ocean-deep dark:text-white">Ready for a Tasting?</h2>
                    <p className="text-slate-500 leading-relaxed">Let's discuss your event vision and create a bespoke menu that will leave your guests talking for years to come.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/request-quote" className="px-10 py-5 bg-primary text-white rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-primary/30 text-center">
                            Start Your Quote
                        </Link>
                        <a href="tel:+17585550123" className="px-10 py-5 border-2 border-ocean-deep text-ocean-deep dark:border-white dark:text-white rounded-full font-bold text-lg hover:bg-ocean-deep hover:text-white transition-all text-center">
                            Call Our Concierge
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
