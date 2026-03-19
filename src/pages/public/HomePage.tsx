import { Link } from 'react-router-dom'
import Testimonials from '../../components/public/Testimonials'
import { useContent } from '../../contexts/ContentContext'

export default function HomePage() {
    const { content } = useContent()
    return (
        <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased">
            {/* Hero Section */}
            <section className="relative h-screen min-h-[700px] flex items-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        className="w-full h-full object-cover"
                        alt="Luxury Caribbean outdoor wedding with string lights at sunset"
                        src={content?.heroImage}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-ocean-deep/90 via-ocean-deep/60 to-transparent"></div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20">
                    <div className="max-w-2xl space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
                            <span>🌴</span> Saint Lucia's Premier Event Partner
                        </div>
                        <h1 className="text-6xl md:text-7xl font-black text-white leading-tight" dangerouslySetInnerHTML={{ __html: content?.heroTitle || '' }}>
                        </h1>
                        <p className="text-xl text-white/80 leading-relaxed font-light">
                            {content?.heroSubtitle}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link
                                to="/catalog"
                                className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg shadow-xl shadow-primary/40 hover:bg-primary/90 transition-all text-center"
                            >
                                Browse Our Catalog
                            </Link>
                            <Link
                                to="/request-quote"
                                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-ocean-deep transition-all text-center"
                            >
                                Request a Quote
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof Strip */}
            <section className="bg-white dark:bg-background-dark border-b border-primary/5">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 md:gap-4 opacity-70">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-gold-accent">verified</span>
                            <span className="text-lg font-semibold tracking-tight">500+ Luxury Events</span>
                        </div>
                        <div className="h-6 w-px bg-slate-300 hidden md:block"></div>
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-gold-accent">thumb_up</span>
                            <span className="text-lg font-semibold tracking-tight">98% Client Satisfaction</span>
                        </div>
                        <div className="h-6 w-px bg-slate-300 hidden md:block"></div>
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-gold-accent">history</span>
                            <span className="text-lg font-semibold tracking-tight">10+ Years Experience</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-24 bg-sand-warm/30 dark:bg-background-dark/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl font-extrabold text-ocean-deep dark:text-white">What We Offer</h2>
                        <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {content?.services?.map((service, idx) => (
                            <div key={idx} className="group relative overflow-hidden rounded-2xl aspect-[3/4] shadow-xl hover:-translate-y-2 transition-transform duration-500">
                                <img
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    alt={service.title}
                                    src={service.image}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/90 via-transparent to-transparent"></div>
                                <div className="absolute bottom-0 left-0 p-6 w-full glass-card border-none rounded-t-2xl translate-y-4 group-hover:translate-y-0 transition-transform">
                                    <h3 className="text-white text-xl font-bold mb-2">{service.title}</h3>
                                    <p className="text-white/70 text-sm">{service.description}</p>
                                    <Link to={service.linkUrl} className="mt-4 inline-block text-primary font-bold text-sm hover:underline">{service.linkText}</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Testimonials />

            {/* Gallery Preview */}
            <section className="py-24 bg-white dark:bg-background-dark">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-end mb-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-extrabold text-ocean-deep dark:text-white">Recent Events</h2>
                            <p className="text-slate-500 max-w-lg">A glimpse into the stunning celebrations we've helped create across the shores of Saint Lucia.</p>
                        </div>
                        <Link to="/catalog" className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
                            View Gallery <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                    </div>
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {content?.recentEvents?.map((event, idx) => (
                            <div key={idx} className="break-inside-avoid shadow-md hover:scale-[1.02] transition-transform">
                                <img className="w-full rounded-2xl" alt={event.alt} src={event.image} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto bg-ocean-gradient rounded-[2.5rem] p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-ocean-deep/30">
                    <div className="absolute top-0 right-0 p-20 opacity-10">
                        <span className="material-symbols-outlined text-[200px] text-white">celebration</span>
                    </div>
                    <div className="relative z-10 text-center space-y-8">
                        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight" dangerouslySetInnerHTML={{ __html: content?.ctaTitle || '' }}></h2>
                        <p className="text-white/80 text-lg max-w-xl mx-auto font-light">
                            {content?.ctaSubtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/request-quote"
                                className="px-10 py-5 bg-primary text-white rounded-full font-bold text-xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform text-center"
                            >
                                Request a Quote Now
                            </Link>
                            <Link
                                to="/request-quote"
                                className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-xl hover:bg-white/20 transition-all text-center"
                            >
                                Talk to an Expert
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
