// ============================================================
// Firebase Configuration
// ============================================================
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
    apiKey: "AIzaSyAZeSB045KZk6RhQawGmGYesy2EodtgGvg",
    authDomain: "faceys-rentals-catering-prod.firebaseapp.com",
    projectId: "faceys-rentals-catering-prod",
    storageBucket: "faceys-rentals-catering-prod.firebasestorage.app",
    messagingSenderId: "660273786597",
    appId: "1:660273786597:web:58519c78b3223716a86e0c",
}

console.log("Firebase Config Initialization:", firebaseConfig)

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
import { initializeFirestore } from 'firebase/firestore'

export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
})
export const storage = getStorage(app)

// Secondary App for Admin actions (e.g., creating other users without logging out)
export const secondaryApp = initializeApp(firebaseConfig, "Secondary")
export const secondaryAuth = getAuth(secondaryApp)

// --- Helpers ---

/** Convert a Firestore Timestamp or Date to a JS Date */
export function toDate(value: Timestamp | Date | undefined | null): Date {
    if (!value) return new Date()
    if (value instanceof Timestamp) return value.toDate()
    return value
}

/** Convert a JS Date to a Firestore Timestamp */
export function toTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date)
}
