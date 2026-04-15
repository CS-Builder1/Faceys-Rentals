import { Link } from 'react-router-dom'

const sections = [
    {
        title: 'Information We Collect',
        body: 'When you request a quote or contact Facey\'s, we may collect your name, email address, phone number, event details, venue information, and any notes you share so we can prepare and manage your booking.',
    },
    {
        title: 'How We Use Your Information',
        body: 'We use your information to respond to inquiries, prepare quotes and invoices, coordinate rentals and catering, communicate booking updates, and improve the service experience for future events.',
    },
    {
        title: 'How We Protect Your Data',
        body: 'We limit access to booking information to authorized team members who need it for customer service, scheduling, accounting, or event delivery. We do not sell customer information to third parties.',
    },
    {
        title: 'Sharing Information',
        body: 'We may share limited booking information with trusted service providers only when it is necessary to process payments, support delivery logistics, or maintain our systems securely.',
    },
    {
        title: 'Your Choices',
        body: 'You can contact us at any time to update your contact information, request corrections, or ask questions about how your booking information is being used.',
    },
]

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-background-dark pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-6 space-y-10">
                <div className="space-y-4">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Back to Home
                    </Link>
                    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl p-8 md:p-12 space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Privacy Policy</p>
                        <h1 className="text-4xl md:text-5xl font-black text-ocean-deep dark:text-white">
                            Your event details stay handled with care.
                        </h1>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            This page explains how Facey&apos;s Party Rentals & Catering collects and uses information
                            shared through quote requests, customer communication, and booking management.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {sections.map((section) => (
                        <section
                            key={section.title}
                            className="bg-white dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm p-8 space-y-3"
                        >
                            <h2 className="text-2xl font-black text-ocean-deep dark:text-white">{section.title}</h2>
                            <p className="text-slate-600 dark:text-white/70 leading-relaxed">{section.body}</p>
                        </section>
                    ))}
                </div>

                <section className="bg-ocean-deep rounded-[2rem] p-8 md:p-10 text-white space-y-4 shadow-xl">
                    <h2 className="text-2xl font-black">Questions about privacy?</h2>
                    <p className="text-white/75 leading-relaxed">
                        Reach out before or after your event and we&apos;ll help with updates to your contact details,
                        booking records, or account information.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/request-quote"
                            className="px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors"
                        >
                            Contact the Team
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    )
}
