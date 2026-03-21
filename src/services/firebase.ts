// ============================================================
// Firebase Configuration
// ============================================================
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}


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
