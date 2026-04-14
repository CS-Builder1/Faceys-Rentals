// ============================================================
// Content Service — Firestore CRUD for SiteContent
// ============================================================
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'
import type { SiteContent } from '../types'

const COLLECTION = 'site_content'
const DOC_ID = 'global'

export const defaultContent: SiteContent = {
    id: DOC_ID,
    siteName: "Facey's Party Rentals & Catering",
    contactEmail: 'hello@faceysrentals.com',
    contactPhone: '+1 (758) 555-0123',
    contactAddress: 'Castries, Saint Lucia, WI',
    heroTitle: 'Your Event, <br />Our <span className="text-gradient-coral">Passion</span>',
    heroSubtitle: 'Elevating celebrations with premium rentals and gourmet Caribbean fusion catering for luxury weddings and corporate events across Saint Lucia.',
    heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCC3WLReLQpP0CqrJ5IhV3Rmt4lDb3Xmljh6jA0N36zI7N73jy7JJ0gtgyD7znUdpqdeQXmoArut1iJ6-qQnnmTPHqwWCOca9XKIejbt0lX3iIo3TNDPS0Qsqf1Wl_ugsJ6aI7yiStcVHneM2iqAenUMnBAcUgojl1WKdM3f1LT5lQ7KzfVUhgNf6QD2scU5kpMfj7gxA0EokrFAmFVIS8GQq7kwPeqE6VexW8qvWtius3pE1gUiZJIgPvgv7REgNAXTiwx0L58BOk',
    aboutUsText: "Premium event rentals and catering services based in the beautiful island of Saint Lucia. Making every moment count since 2014.",
    ctaTitle: 'Ready to Plan Your <br />Next Unforgettable Event?',
    ctaSubtitle: "Join hundreds of happy clients who trusted Facey's to bring their vision to life. Let's create something extraordinary together.",
    seoTitle: "Facey's Party Rentals and Catering - St. Lucia",
    seoDescription: "Saint Lucia's premier luxury event rentals and gourmet catering services. Specializing in weddings, corporate events, and private functions.",
    seoKeywords: "party rentals, catering, saint lucia, weddings, corporate events, luxury furniture",
    socialLinks: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
    },
    services: [
        {
            title: 'Premium Rentals',
            description: 'Designer furniture & exquisite decor sets.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDk3hcpZKxAfHyHwoycfOqwDSA_Ho1q2ZFRTvpCcyQRDqVPBCutvU7hgy7stJD7RAnVncwBJ-bXFyGw3Do_8U6ApmtIpZfKtJpa4oUTmSfHVID5bFp-FIGp0kBXjkXArTKCQscyP0bgcGhIwQnTgCV4JP7hTZbLGgqLdctjpDCjGtHBhYzjN3BcqXKqIjwoqmQQq7wbC8VipLXb0MbFFp0W-MhY3-XIez0j-yWq5njMGu5TaR2ngekhtViAfSrrHuHpFGECKXLhM-w',
            linkText: 'View Catalog →',
            linkUrl: '/catalog'
        },
        {
            title: 'Gourmet Catering',
            description: 'Bespoke Caribbean fusion culinary experiences.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdLLQ634RpC3Yi5hiZqN-8RKHUragGiBGYJsgGBzr3ygdPhCVHnJxT4N_cglvB58hTnPKHuWUqh0c39xt7mZLmHHWC4AyvTp-VC2kduluSuqsRCde0koY1kE5yy4J8N7CIiykk7-0p0QFqvfUEES4D0N7qayviUKELpgJ6DMsQIP4HYcHrlzx-W4HKv8fJZur2CaGxf75U0HJVg9sY6-bEMyFYfMVrA2MSeOei9GcNqOINaA7UAjoYaZ9Ea9LCSCI5rja3DBIfHj0',
            linkText: 'View Menus →',
            linkUrl: '/catering'
        },
        {
            title: 'Full-Service Setup',
            description: 'Seamless on-site coordination and assembly.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDroEwzGVhYjj_r5LpSh0s-IIJWPGE2bOz29CK22lOCOrMB0mbNw9AJUiu9H5AGGTga2staZ17fE9D2CHrelWoJck7kfdKXhPRG_malkWeNWqIqIe3mTtky9SocXvxbRjtbKLOnTMbQjc3KF9Np2aS_-SEJj3i8rWoKpuuyH3_EV8CghxrfpyykZkzNEWRcUYUlKG27ku5Y_kY_QLsZ20-WnhwoGYikfEV1FPAxQo0cDaVhxvUPzw4ktpEWMI5Zh-qPFTp7pxjXOAU',
            linkText: 'Learn More →',
            linkUrl: '/request-quote'
        },
        {
            title: 'Custom Packages',
            description: 'Tailored solutions for your unique vision.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpnCXWo7LOLQ-wVrg-SEkbdb5q51pGmXsJkHKspN36EJKmZfWnJOk78muAYyu1Fi9H0PzjYS5gw8YkD-Q0RqMQwy8cg_WF1T7-7p78GNYiJU5gE09T7O4v8tWYz8jKy4Yi3pb5h6bhIFX8vV-9z9rmr6DmsOdnRqi_PcqGPIrnuz6YU6bqPpxkGaAoeDKYYcre_vlDKGwqZwjK4Jsh8P49nbMxOH9Ys-l54o8S53S13AuMMCN-oPalLHfrGnzYaVbShaXGDsm3EYY',
            linkText: 'Get Plan →',
            linkUrl: '/request-quote'
        }
    ],
    recentEvents: [
        { image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIppcNS-clX--WhoneoeFrnJ1FuM-4qRQqHIy3hOXNJ1cqo0Nu6r9JR7ql5A8yGOVmPlBIhrMt_zGbtkYUskzo0P53xfW0LI-DVHnAjNLx-df3P5PYTuRtAsuM-eTBYjAVcLilzrkzHpDgeYykpR-aTkQinXasvrryp1_6uFOtIsQdw5VMcURfNBcZwnkM2cmz3jHjwn1VYGGaGKI2h__YSmsH8x7IfySJViQEHpyZCYtiu_bliIQFFqfaBgf8jUVnpu2IpXzrmbY', alt: 'Elegant table setting with ocean view' },
        { image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARik0_hbPvZ1xnMB0EM4_O5D2bHq3pJd7xT07ebN1GnhETtzKVfPgFJ6myEGg9UOdinyV264_bQrtNEMoXUFwDegAIWdL5wCb4RgR6HhOwASRwUmnNNEmn-N3zv4WUD1irxVhDHiTy1kygMm3TGKP0GAX2nmhNpvj91y92fuPSIYLdlZW9qUlZJGEUR2V8azE64Kkfch1AF8moPQ1WIpuM0ZWSJDzWAuIcnu3rfIVpLPb1NZJBnEnnGTSpVVk7X0GPQDZa_34VjWo', alt: 'Luxury wedding tent illuminated at night' },
        { image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfZnMi6IZVEk95FEW9IHq4qiUDGz3dPJWJeg3fgcqleJ8FJUd_p8-CjLWR-WouauRN_0nFbgpWfBA44pWOqDOsRg--Y55q6ylo1UH_8VvBFLSnw3ZqzvhXhw9PJHxaKBv1at84S4A2-nvzg6NW6DFxCHKFz4Jnm6iEQbGWYKBJm0mtpF1zv0rrckP4iVHV78ahe7FZ8jQQfGEyECRSGOC5BkwVuNQK0MNah__Tavsdxv7L3C5rcsN2c879UFAxcLLT71145QxGVGw', alt: 'Close up of tropical catering appetizers' }
    ]
}

export const contentService = {
    async getGlobalContent(): Promise<SiteContent> {
        const snap = await getDoc(doc(db, COLLECTION, DOC_ID))
        if (!snap.exists()) {
            return defaultContent
        }
        return { ...defaultContent, ...snap.data() } as SiteContent
    },

    async updateGlobalContent(updates: Partial<SiteContent>): Promise<void> {
        const docRef = doc(db, COLLECTION, DOC_ID)
        const snap = await getDoc(docRef)
        if (!snap.exists()) {
            await setDoc(docRef, { ...defaultContent, ...updates })
        } else {
            await updateDoc(docRef, updates)
        }
    },

    async uploadAsset(file: File, path: string = 'site_assets'): Promise<string> {
        const uniqueFileName = `${Date.now()}_${file.name}`
        const assetRef = ref(storage, `${path}/${uniqueFileName}`)
        await uploadBytes(assetRef, file)
        return await getDownloadURL(assetRef)
    }
}
