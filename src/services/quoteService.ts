// ============================================================
// Quote Service — Firestore CRUD for Quote
// ============================================================
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    type DocumentData,
} from 'firebase/firestore'
import { db, toDate, toOptionalDate, toTimestamp } from './firebase'
import { QuoteStatus, type Quote } from '../types'

const COLLECTION = 'booking_requests'
const ref = collection(db, COLLECTION)

function fromFirestore(id: string, data: DocumentData): Quote {
    return {
        id,
        eventId: data.eventId ?? '',
        clientId: data.clientId,
        total: data.total ?? 0,
        tax: data.tax ?? 0,
        discount: data.discount ?? 0,
        depositRequired: data.depositRequired ?? 0,
        expirationDate: toDate(data.expirationDate),
        status: data.status ?? QuoteStatus.Pending,
        pdfUrl: data.pdfUrl,
        createdAt: toDate(data.createdAt),
        // Inquiry fields
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        company: data.company,
        eventDate: data.eventDate,
        eventType: data.eventType,
        guestCount: data.guestCount,
        venue: data.venue,
        notes: data.notes,
        items: data.items,
        followUpCount: data.followUpCount ?? 0,
        lastContactedAt: toOptionalDate(data.lastContactedAt),
    }
}

function toFirestoreData(quote: Partial<Quote>): DocumentData {
    const data: DocumentData = { ...quote }
    delete data.id
    if (data.expirationDate instanceof Date) data.expirationDate = toTimestamp(data.expirationDate)
    if (data.createdAt instanceof Date) data.createdAt = toTimestamp(data.createdAt)
    if (data.lastContactedAt instanceof Date) data.lastContactedAt = toTimestamp(data.lastContactedAt)
    return data
}

export const quoteService = {
    async getAll(): Promise<Quote[]> {
        const q = query(ref, orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        return snap.docs.map((d) => fromFirestore(d.id, d.data()))
    },

    async getByStatus(status: QuoteStatus): Promise<Quote[]> {
        const q = query(ref, where('status', '==', status))
        const snap = await getDocs(q)
        return snap.docs
            .map((d) => fromFirestore(d.id, d.data()))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },

    async getByEvent(eventId: string): Promise<Quote[]> {
        const q = query(ref, where('eventId', '==', eventId))
        const snap = await getDocs(q)
        return snap.docs.map((d) => fromFirestore(d.id, d.data()))
    },

    async getByClient(clientId: string): Promise<Quote[]> {
        const q = query(ref, where('clientId', '==', clientId))
        const snap = await getDocs(q)
        return snap.docs
            .map((d) => fromFirestore(d.id, d.data()))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },

    async getByCustomerEmail(email: string): Promise<Quote[]> {
        const q = query(ref, where('customerEmail', '==', email))
        const snap = await getDocs(q)
        return snap.docs
            .map((d) => fromFirestore(d.id, d.data()))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },

    async getById(id: string): Promise<Quote | null> {
        const snap = await getDoc(doc(db, COLLECTION, id))
        if (!snap.exists()) return null
        return fromFirestore(snap.id, snap.data())
    },

    async create(quote: Omit<Quote, 'id'>): Promise<string> {
        const data = toFirestoreData({ ...quote, createdAt: new Date() })
        const docRef = await addDoc(ref, data)
        return docRef.id
    },

    async update(id: string, updates: Partial<Quote>): Promise<void> {
        await updateDoc(doc(db, COLLECTION, id), toFirestoreData(updates))
    },

    async remove(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION, id))
    },
}
