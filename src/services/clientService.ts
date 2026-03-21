// ============================================================
// Client Service — Firestore CRUD for Client
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
    orderBy,
    where,
    type DocumentData,
} from 'firebase/firestore'
import { db, toDate, toTimestamp } from './firebase'
import type { Client } from '../types'

const COLLECTION = 'customers'
const ref = collection(db, COLLECTION)

function fromFirestore(id: string, data: DocumentData): Client {
    return {
        id,
        businessName: data.businessName,
        contactName: data.contactName ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        billingAddress: data.billingAddress ?? '',
        billingCity: data.billingCity ?? '',
        billingState: data.billingState ?? '',
        billingZip: data.billingZip ?? '',
        preferredContact: data.preferredContact,
        referralSource: data.referralSource ?? '',
        specialNotes: data.specialNotes ?? '',
        internalNotes: data.internalNotes ?? '',
        specialDiscount: data.specialDiscount,
        status: data.status,
        notes: data.notes ?? '',
        lifetimeValue: data.lifetimeValue ?? 0,
        createdAt: toDate(data.createdAt),
        quickbooksCustomerId: data.quickbooksCustomerId,
    }
}

function toFirestoreData(client: Partial<Client>): DocumentData {
    const data: DocumentData = { ...client }
    delete data.id
    if (data.createdAt instanceof Date) data.createdAt = toTimestamp(data.createdAt)
    return data
}

export const clientService = {
    async getAll(): Promise<Client[]> {
        const q = query(ref, orderBy('contactName'))
        const snap = await getDocs(q)
        return snap.docs.map((d) => fromFirestore(d.id, d.data()))
    },

    async getByEmail(email: string): Promise<Client[]> {
        const q = query(ref, where('email', '==', email))
        const snap = await getDocs(q)
        return snap.docs.map((d) => fromFirestore(d.id, d.data()))
    },

    async getById(id: string): Promise<Client | null> {
        const snap = await getDoc(doc(db, COLLECTION, id))
        if (!snap.exists()) return null
        return fromFirestore(snap.id, snap.data())
    },

    async create(client: Omit<Client, 'id'>): Promise<string> {
        const data = toFirestoreData({ ...client, createdAt: new Date(), lifetimeValue: 0 })
        const docRef = await addDoc(ref, data)
        return docRef.id
    },

    async update(id: string, updates: Partial<Client>): Promise<void> {
        await updateDoc(doc(db, COLLECTION, id), toFirestoreData(updates))
    },

    async remove(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION, id))
    },
}
