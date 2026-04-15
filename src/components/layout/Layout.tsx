import { useEffect } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import Navbar from './Navbar'
import { useContent } from '../../contexts/ContentContext'

export default function Layout() {
    const location = useLocation()
    const { content } = useContent()
    const isAdmin = location.pathname.startsWith('/admin')

    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '')
            const scrollToTarget = () => {
                const el = document.getElementById(id)
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            }

            const frame = window.requestAnimationFrame(scrollToTarget)
            return () => window.cancelAnimationFrame(frame)
        }

        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [location.pathname, location.hash])

    if (isAdmin) {
        return <Outlet />
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-grow pt-20">
                <Outlet />
            </main>
            <footer className="bg-ocean border-t border-white/10 py-16 text-white/70 sm:py-20">
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded bg-primary text-white">
                                <span className="material-symbols-outlined text-sm">celebration</span>
                            </div>
                            <h2 className="text-xl font-extrabold tracking-tight text-white">{content?.siteName || "Facey's"}</h2>
                        </div>
                        <p className="text-sm leading-relaxed">
                            {content?.aboutUsText}
                        </p>
                        <div className="flex gap-4">
                            {content?.socialLinks?.facebook && (
                                <a className="flex size-10 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-primary" href={content.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                                    <span style={{ lineHeight: 0 }} className="h-5 w-5 fill-current">
                                        <span className="material-symbols-outlined text-lg">facebook</span>
                                    </span>
                                </a>
                            )}
                            {content?.socialLinks?.instagram && (
                                <a className="flex size-10 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-primary" href={content.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                                    <span style={{ lineHeight: 0 }} className="h-5 w-5 fill-current">
                                        <span className="material-symbols-outlined text-lg">camera_alt</span>
                                    </span>
                                </a>
                            )}
                            {content?.socialLinks?.twitter && (
                                <a className="flex size-10 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-primary" href={content.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                                    <span style={{ lineHeight: 0 }} className="h-5 w-5 fill-current">
                                        <span className="material-symbols-outlined text-lg">public</span>
                                    </span>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link className="transition-colors hover:text-primary" to="/catalog">Rentals Catalog</Link></li>
                            <li><Link className="transition-colors hover:text-primary" to="/catering">Catering Menus</Link></li>
                            <li><Link className="transition-colors hover:text-primary" to="/request-quote">Request a Quote</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Company</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link className="transition-colors hover:text-primary" to="/#about">About Us</Link></li>
                            <li><Link className="transition-colors hover:text-primary" to="/#testimonials">Testimonials</Link></li>
                            <li><Link className="transition-colors hover:text-primary" to="/privacy">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Contact Us</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                                <span className="leading-relaxed">{content?.contactAddress}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-lg text-primary">phone</span>
                                <a href={`tel:${content?.contactPhone || ''}`} className="transition-colors hover:text-primary">
                                    {content?.contactPhone}
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-lg text-primary">mail</span>
                                <a href={`mailto:${content?.contactEmail || ''}`} className="transition-colors hover:text-primary">
                                    {content?.contactEmail}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mx-auto mt-14 flex max-w-7xl flex-col items-start justify-between gap-3 border-t border-white/5 px-4 pt-8 text-xs font-medium sm:px-6 md:mt-20 md:flex-row md:items-center">
                    <p>Copyright 2026 Facey&apos;s Party Rentals & Catering. All rights reserved.</p>
                    <p>Designed for excellence in the Caribbean.</p>
                </div>
            </footer>
        </div>
    )
}
