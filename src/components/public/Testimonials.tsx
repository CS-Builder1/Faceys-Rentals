export interface Testimonial {
    id: string
    name: string
    role: string
    content: string
    rating: number
    image?: string
}

const testimonials: Testimonial[] = [
    {
        id: '1',
        name: 'Sarah J.',
        role: 'Wedding at Pigeon Island',
        content: "Facey's made our dream wedding a reality! The decor was breathtaking and the catering received rave reviews from every guest. Patrick's attention to detail is unmatched in Saint Lucia.",
        rating: 5,
        image: 'https://i.pravatar.cc/150?u=sarah'
    },
    {
        id: '2',
        name: 'Mark T.',
        role: 'Corporate Retreat',
        content: "The catering was the highlight of our week-long summit. Fresh, authentic, and perfectly presented. Their rentals were top-tier and transformed our venue into a premium workspace.",
        rating: 5,
        image: 'https://i.pravatar.cc/150?u=mark'
    },
    {
        id: '3',
        name: 'Elena R.',
        role: '50th Birthday Celebration',
        content: "Patrick and his team are true professionals. They handled everything from the initial quote to the final cleanup with such grace. I didn't have to worry about a single thing.",
        rating: 5,
        image: 'https://i.pravatar.cc/150?u=elena'
    }
]

export default function Testimonials() {
    return (
        <section id="testimonials" className="py-24 bg-sand-warm/20 dark:bg-white/[0.02]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl font-extrabold text-ocean-deep dark:text-white">What Our <span className="text-primary italic">Clients Say</span></h2>
                    <p className="text-slate-500 max-w-2xl mx-auto">Real stories from the beautiful celebrations we've been honored to be a part of.</p>
                    <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t) => (
                        <div key={t.id} className="bg-white dark:bg-background-dark p-8 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col">
                            <div className="flex gap-1 text-gold-accent mb-6">
                                {[...Array(t.rating)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined fill-current text-sm">star</span>
                                ))}
                            </div>
                            
                            <p className="text-slate-600 dark:text-white/70 italic leading-relaxed mb-8 flex-grow">
                                "{t.content}"
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full overflow-hidden border-2 border-primary/20">
                                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-ocean-deep dark:text-white leading-tight">{t.name}</h4>
                                    <p className="text-xs text-slate-400 font-medium">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
