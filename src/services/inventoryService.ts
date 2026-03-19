// ============================================================
// Inventory Service — Firestore CRUD for InventoryItem
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
import { db, toDate, toTimestamp } from './firebase'
import type { InventoryItem, ItemCategory } from '../types'

const COLLECTION = 'catalog_items'
const ref = collection(db, COLLECTION)

/** Convert Firestore doc → InventoryItem */
function fromFirestore(id: string, data: DocumentData): InventoryItem {
    return {
        id,
        name: data.name ?? '',
        category: data.category ?? 'other',
        description: data.description ?? '',
        images: data.images ?? [],
        totalQuantity: data.totalQuantity ?? 0,
        internalCost: data.internalCost ?? 0,
        rentalPrice: data.rentalPrice ?? 0,
        cateringPrice: data.cateringPrice,
        pricingModel: data.pricingModel ?? 'per_day',
        status: data.status ?? 'active',
        allowOverbooking: data.allowOverbooking ?? false,
        maintenanceStatus: data.maintenanceStatus,
        notes: data.notes ?? '',
        createdAt: toDate(data.createdAt),
        quickbooksItemId: data.quickbooksItemId,
    }
}

/** Prepare data for Firestore */
function toFirestore(item: Partial<InventoryItem>): DocumentData {
    const data: DocumentData = { ...item }
    delete data.id
    if (data.createdAt instanceof Date) {
        data.createdAt = toTimestamp(data.createdAt)
    }
    return data
}

export const inventoryService = {
    async getAll(): Promise<InventoryItem[]> {
        const q = query(ref, orderBy('name'))
        const snap = await getDocs(q)
        return snap.docs.map((d) => fromFirestore(d.id, d.data()))
    },

    async getByCategory(category: ItemCategory): Promise<InventoryItem[]> {
        const q = query(ref, where('category', '==', category), orderBy('name'))
        const snap = await getDocs(q)
        return snap.docs.map((d) => fromFirestore(d.id, d.data()))
    },

    async getActive(): Promise<InventoryItem[]> {
        const q = query(ref, where('status', '==', 'active'), orderBy('name'))
        const snap = await getDocs(q)
        return snap.docs.map((d) => fromFirestore(d.id, d.data()))
    },

    async getById(id: string): Promise<InventoryItem | null> {
        const snap = await getDoc(doc(db, COLLECTION, id))
        if (!snap.exists()) return null
        return fromFirestore(snap.id, snap.data())
    },

    async create(item: Omit<InventoryItem, 'id' | 'createdAt'>): Promise<string> {
        const data = toFirestore({ ...item, createdAt: new Date() })
        const docRef = await addDoc(ref, data)
        return docRef.id
    },

    async update(id: string, updates: Partial<InventoryItem>): Promise<void> {
        const data = toFirestore(updates)
        await updateDoc(doc(db, COLLECTION, id), data)
    },

    async remove(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION, id))
    },
}
