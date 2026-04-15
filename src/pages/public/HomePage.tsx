import { Link } from 'react-router-dom'
import Testimonials from '../../components/public/Testimonials'
import { useContent } from '../../contexts/ContentContext'

export default function HomePage() {
    const { content } = useContent()

    return (
        <div className="bg-background-light font-display text-slate-900 antialiased dark:bg-background-dark dark:text-slate-100">
            <section className="relative flex min-h-[680px] items-center overflow-hidden sm:min-h-[740px]">
                <div className="absolute inset-0 z-0">
                    <img
                        className="h-full w-full object-cover"
                        alt="Luxury Caribbean outdoor wedding with string lights at sunset"
                        src={content?.heroImage}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-ocean-deep/90 via-ocean-deep/65 to-transparent"></div>
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-28">
                    <div className="max-w-2xl space-y-6 sm:space-y-8">
                        <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                            Saint Lucia&apos;s Premier Event Partner
                        </div>
                        <h1
                            className="text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
                            dangerouslySetInnerHTML={{ __html: content?.heroTitle || '' }}
                        />
                        <p className="text-lg font-light leading-relaxed text-white/80 sm:text-xl">
                            {content?.heroSubtitle}
                        </p>
                        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:gap-4 sm:pt-4">
                            <Link
                                to="/catalog"
                                className="w-full rounded-full bg-primary px-7 py-4 text-center text-base font-bold text-white shadow-xl shadow-primary/40 transition-all hover:bg-primary/90 sm:w-auto sm:px-8 sm:text-lg"
                            >
                                Browse Our Catalog
                            </Link>
                            <Link
                                to="/request-quote"
                                className="w-full rounded-full border-2 border-white bg-transparent px-7 py-4 text-center text-base font-bold text-white transition-all hover:bg-white hover:text-ocean-deep sm:w-auto sm:px-8 sm:text-lg"
                            >
                                Request a Quote
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-primary/5 bg-white dark:bg-background-dark">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                    <div className="grid gap-4 opacity-70 sm:grid-cols-3">
                        <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50/70 px-4 py-4 text-center dark:bg-white/5">
                            <span className="material-symbols-outlined text-gold-accent">verified</span>
                            <span className="text-base font-semibold tracking-tight sm:text-lg">500+ Luxury Events</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50/70 px-4 py-4 text-center dark:bg-white/5">
                            <span className="material-symbols-outlined text-gold-accent">thumb_up</span>
                            <span className="text-base font-semibold tracking-tight sm:text-lg">98% Client Satisfaction</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50/70 px-4 py-4 text-center dark:bg-white/5">
                            <span className="material-symbols-outlined text-gold-accent">history</span>
                            <span className="text-base font-semibold tracking-tight sm:text-lg">10+ Years Experience</span>
                        </div>
                    </div>
                </div>
            </section>

            <section id="about" className="bg-white py-20 dark:bg-background-dark sm:py-24">
                <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-5">
                        <p className="text-xs font-black uppercase tracking-[0.35em] text-primary">About Facey&apos;s</p>
                        <h2 className="text-3xl font-extrabold text-ocean-deep dark:text-white sm:text-4xl">
                            Seamless rentals, polished catering, and calm event execution.
                        </h2>
                        <p className="text-base leading-relaxed text-slate-500 sm:text-lg">
                            {content?.aboutUsText}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                to="/request-quote"
                                className="rounded-full bg-ocean-deep px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-primary sm:text-base"
                            >
                                Start Your Event Plan
                            </Link>
                            <Link
                                to="/catalog"
                                className="rounded-full border border-slate-300 px-7 py-3 text-sm font-bold text-ocean-deep transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white sm:text-base"
                            >
                                Explore Inventory
                            </Link>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 rounded-[2.5rem] bg-primary/10 blur-3xl" />
                        <div className="relative space-y-6 rounded-[2rem] border border-primary/10 bg-sand-warm/40 p-6 shadow-xl dark:bg-white/5 sm:rounded-[2.5rem] sm:p-8 md:p-10">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-background-dark">
                                    <p className="text-3xl font-black text-ocean-deep dark:text-white">500+</p>
                                    <p className="mt-1 text-sm font-bold uppercase tracking-wider text-slate-400">Events Supported</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-background-dark">
                                    <p className="text-3xl font-black text-ocean-deep dark:text-white">24h</p>
                                    <p className="mt-1 text-sm font-bold uppercase tracking-wider text-slate-400">Typical Quote Response</p>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-ocean-deep p-6 text-white">
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60">What Clients Need Most</p>
                                <p className="mt-3 text-lg font-semibold text-white/85">
                                    Clear communication, dependable setup timelines, and a team that keeps the event day feeling under control.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-sand-warm/30 py-20 dark:bg-background-dark/50 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="mb-16 space-y-4 text-center">
                        <h2 className="text-3xl font-extrabold text-ocean-deep dark:text-white sm:text-4xl">What We Offer</h2>
                        <div className="mx-auto h-1.5 w-20 rounded-full bg-primary"></div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {content?.services?.map((service, idx) => (
                            <div key={idx} className="group relative aspect-[3/4] overflow-hidden rounded-2xl shadow-xl transition-transform duration-500 hover:-translate-y-2">
                                <img
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    alt={service.title}
                                    src={service.image}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/90 via-transparent to-transparent"></div>
                                <div className="glass-card absolute bottom-0 left-0 w-full rounded-t-2xl border-none p-5 transition-transform sm:p-6 md:translate-y-4 md:group-hover:translate-y-0">
                                    <h3 className="mb-2 text-xl font-bold text-white">{service.title}</h3>
                                    <p className="text-sm text-white/70">{service.description}</p>
                                    <Link to={service.linkUrl} className="mt-4 inline-block text-sm font-bold text-primary hover:underline">
                                        {service.linkText}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Testimonials />

            <section className="bg-white py-20 dark:bg-background-dark sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-extrabold text-ocean-deep dark:text-white sm:text-4xl">Recent Events</h2>
                            <p className="max-w-lg text-slate-500">
                                A glimpse into the stunning celebrations we&apos;ve helped create across the shores of Saint Lucia.
                            </p>
                        </div>
                        <Link to="/catalog" className="flex items-center gap-2 font-bold text-primary transition-all hover:gap-3">
                            View Gallery <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                    </div>
                    <div className="columns-1 space-y-6 gap-6 md:columns-2 lg:columns-3">
                        {content?.recentEvents?.map((event, idx) => (
                            <div key={idx} className="break-inside-avoid shadow-md transition-transform hover:scale-[1.02]">
                                <img className="w-full rounded-2xl" alt={event.alt} src={event.image} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 py-20 sm:px-6 sm:py-24">
                <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-ocean-gradient p-8 shadow-2xl shadow-ocean-deep/30 sm:rounded-[2.5rem] sm:p-10 md:p-16 lg:p-20">
                    <div className="absolute right-0 top-0 p-20 opacity-10">
                        <span className="material-symbols-outlined text-[200px] text-white">celebration</span>
                    </div>
                    <div className="relative z-10 space-y-8 text-center">
                        <h2
                            className="text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl"
                            dangerouslySetInnerHTML={{ __html: content?.ctaTitle || '' }}
                        ></h2>
                        <p className="mx-auto max-w-xl text-base font-light text-white/80 sm:text-lg">
                            {content?.ctaSubtitle}
                        </p>
                        <div className="flex flex-col justify-center gap-4 sm:flex-row">
                            <Link
                                to="/request-quote"
                                className="rounded-full bg-primary px-8 py-4 text-center text-lg font-bold text-white shadow-xl shadow-primary/30 transition-transform hover:scale-105 sm:px-10 sm:py-5 sm:text-xl"
                            >
                                Request a Quote Now
                            </Link>
                            <Link
                                to="/request-quote"
                                className="rounded-full border border-white/20 bg-white/10 px-8 py-4 text-center text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 sm:px-10 sm:py-5 sm:text-xl"
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
