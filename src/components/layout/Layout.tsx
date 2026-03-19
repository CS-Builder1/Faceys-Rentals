import { Outlet, useLocation, Link } from 'react-router-dom'
import Navbar from './Navbar'
import { useContent } from '../../contexts/ContentContext'

export default function Layout() {
    const location = useLocation()
    const { content } = useContent()
    const isAdmin = location.pathname.startsWith('/admin')

    // Admin pages use their own sidebar layout, no shared navbar/footer
    if (isAdmin) {
        return <Outlet />
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-20">
                <Outlet />
            </main>
            <footer className="bg-ocean text-white/70 py-20 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="size-8 bg-primary rounded flex items-center justify-center text-white">
                                <span className="material-symbols-outlined text-sm">celebration</span>
                            </div>
                            <h2 className="text-xl font-extrabold tracking-tight text-white">{content?.siteName || "Facey's"}</h2>
                        </div>
                        <p className="text-sm leading-relaxed">
                            {content?.aboutUsText}
                        </p>
                        <div className="flex gap-4">
                            {content?.socialLinks?.facebook && (
                                <a className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors text-white" href={content.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                                    <span style={{ lineHeight: 0 }} className="h-5 w-5 fill-current">
                                        <span className="material-symbols-outlined text-lg">facebook</span>
                                    </span>
                                </a>
                            )}
                            {content?.socialLinks?.instagram && (
                                <a className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors text-white" href={content.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                                    <span style={{ lineHeight: 0 }} className="h-5 w-5 fill-current">
                                        <span className="material-symbols-outlined text-lg">camera_alt</span>
                                    </span>
                                </a>
                            )}
                            {content?.socialLinks?.twitter && (
                                <a className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors text-white" href={content.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                                    <span style={{ lineHeight: 0 }} className="h-5 w-5 fill-current">
                                        {/* A generic public icon for twitter if logo not available */}
                                        <span className="material-symbols-outlined text-lg">public</span>
                                    </span>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-white font-bold uppercase tracking-wider text-xs">Quick Links</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link className="hover:text-primary transition-colors" to="/catalog">Rentals Catalog</Link></li>
                            <li><Link className="hover:text-primary transition-colors" to="/catering">Catering Menus</Link></li>
                            <li><Link className="hover:text-primary transition-colors" to="/request-quote">Request a Quote</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-white font-bold uppercase tracking-wider text-xs">Company</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><a className="hover:text-primary transition-colors" href="#">About Us</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Testimonials</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-white font-bold uppercase tracking-wider text-xs">Contact Us</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                                <span>{content?.contactAddress}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-lg">phone</span>
                                <span>{content?.contactPhone}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-lg">mail</span>
                                <span>{content?.contactEmail}</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
                    <p>© 2026 Facey's Party Rentals & Catering. All rights reserved.</p>
                    <p>Designed for excellence in the Caribbean.</p>
                </div>
            </footer>
        </div>
    )
}
