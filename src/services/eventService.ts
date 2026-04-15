// ============================================================
// Event Service — Firestore CRUD for Event & EventItem
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
import type { Event, EventItem, EventStatus } from '../types'

const EVENTS = 'bookings'
const EVENT_ITEMS = 'eventItems'
const eventsRef = collection(db, EVENTS)

function eventFromFirestore(id: string, data: DocumentData): Event {
    return {
        id,
        clientId: data.clientId ?? '',
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        sourceQuoteId: data.sourceQuoteId,
        eventDate: toDate(data.eventDate),
        startTime: data.startTime ?? '',
        endTime: data.endTime ?? '',
        venueAddress: data.venueAddress ?? '',
        eventType: data.eventType ?? 'rental',
        status: data.status ?? 'inquiry',
        deliveryStatus: data.deliveryStatus ?? 'scheduled',
        assignedStaffIds: data.assignedStaffIds ?? [],
        internalNotes: data.internalNotes ?? '',
        createdAt: toDate(data.createdAt),
    }
}

function eventToFirestore(event: Partial<Event>): DocumentData {
    const data: DocumentData = { ...event }
    delete data.id
    if (data.eventDate instanceof Date) data.eventDate = toTimestamp(data.eventDate)
    if (data.createdAt instanceof Date) data.createdAt = toTimestamp(data.createdAt)
    return data
}

export const eventService = {
    async getAll(): Promise<Event[]> {
        const q = query(eventsRef, orderBy('eventDate', 'desc'))
        const snap = await getDocs(q)
        return snap.docs.map((d) => eventFromFirestore(d.id, d.data()))
    },

    async getByStatus(status: EventStatus): Promise<Event[]> {
        const q = query(eventsRef, where('status', '==', status))
        const snap = await getDocs(q)
        return snap.docs
            .map((d) => eventFromFirestore(d.id, d.data()))
            .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
    },

    async getByClient(clientId: string): Promise<Event[]> {
        const q = query(eventsRef, where('clientId', '==', clientId))
        const snap = await getDocs(q)
        return snap.docs
            .map((d) => eventFromFirestore(d.id, d.data()))
            .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
    },

    async getByClientEmail(clientEmail: string): Promise<Event[]> {
        const q = query(eventsRef, where('clientEmail', '==', clientEmail))
        const snap = await getDocs(q)
        return snap.docs
            .map((d) => eventFromFirestore(d.id, d.data()))
            .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
    },

    async getById(id: string): Promise<Event | null> {
        const snap = await getDoc(doc(db, EVENTS, id))
        if (!snap.exists()) return null
        return eventFromFirestore(snap.id, snap.data())
    },

    async create(event: Omit<Event, 'id'>): Promise<string> {
        const data = eventToFirestore({ ...event, createdAt: new Date() })
        const docRef = await addDoc(eventsRef, data)
        return docRef.id
    },

    async update(id: string, updates: Partial<Event>): Promise<void> {
        await updateDoc(doc(db, EVENTS, id), eventToFirestore(updates))
    },

    async remove(id: string): Promise<void> {
        await deleteDoc(doc(db, EVENTS, id))
    },

    // --- Event Items ---
    async getEventItems(eventId: string): Promise<EventItem[]> {
        const q = query(collection(db, EVENT_ITEMS), where('eventId', '==', eventId))
        const snap = await getDocs(q)
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventItem))
    },

    async addEventItem(item: Omit<EventItem, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, EVENT_ITEMS), item)
        return docRef.id
    },

    async updateEventItem(id: string, updates: Partial<EventItem>): Promise<void> {
        await updateDoc(doc(db, EVENT_ITEMS, id), updates as DocumentData)
    },

    async removeEventItem(id: string): Promise<void> {
        await deleteDoc(doc(db, EVENT_ITEMS, id))
    },
}
