import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface BusinessSettings {
    // --- Business Profile ---
    companyName: string
    tagline: string
    contactEmail: string
    contactPhone: string
    addressStreet: string
    addressCity: string
    addressState: string
    addressZip: string
    timezone: string
    logoUrl?: string

    // --- Financial & Tax ---
    defaultTaxRate: number
    depositType: 'none' | 'fixed' | 'percentage'
    defaultDepositAmount: number // Either a fixed $ amount or a % depending on type
    currency: string
    fiscalYearStart: string // e.g. "January"

    // --- Quote & Invoice ---
    quoteValidityDays: number
    quoteExpiryWarningDays: number
    defaultInvoiceDueDays: number
    lateFeePercentage: number
    defaultPaymentTerms: string
    invoicePrefix: string
    nextInvoiceNumber: number
    acceptedPaymentMethods: string[]

    // --- Notifications ---
    emailOnQuoteRequest: boolean
    emailOnInvoiceOverdue: boolean
    notificationEmailOverride?: string

    // --- Integrations ---
    stripePublishableKey?: string
    googleAnalyticsId?: string
    
    // --- Security ---
    requireTwoFactorAuth: boolean
}

export const defaultSettings: BusinessSettings = {
    companyName: "Facey's Party Rentals and Catering",
    tagline: "Making every event unforgettable.",
    contactEmail: "info@faceysrentals.com",
    contactPhone: "(555) 123-4567",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    timezone: "America/New_York",
    
    defaultTaxRate: 8.5,
    depositType: 'percentage',
    defaultDepositAmount: 50,
    currency: "USD",
    fiscalYearStart: "January",

    quoteValidityDays: 14,
    quoteExpiryWarningDays: 3,
    defaultInvoiceDueDays: 30,
    lateFeePercentage: 0,
    defaultPaymentTerms: "Payment is due upon receipt. A late fee may be applied to overdue balances.",
    invoicePrefix: "INV-",
    nextInvoiceNumber: 1000,
    acceptedPaymentMethods: ["cash", "card", "bank_transfer"],

    emailOnQuoteRequest: true,
    emailOnInvoiceOverdue: true,

    requireTwoFactorAuth: false,
}

export const settingsService = {
    async getSettings(): Promise<BusinessSettings> {
        const docRef = doc(db, 'settings', 'business')
        const snap = await getDoc(docRef)
        
        if (snap.exists()) {
            return { ...defaultSettings, ...snap.data() } as BusinessSettings
        }
        
        // If it doesn't exist yet, we'll return the defaults. 
        // We won't automatically write it here to save on writes if not necessary,
        // it will be created on the first 'save' action.
        return defaultSettings
    },

    async saveSettings(settings: Partial<BusinessSettings>): Promise<void> {
        const docRef = doc(db, 'settings', 'business')
        await setDoc(docRef, settings, { merge: true })
    }
}
