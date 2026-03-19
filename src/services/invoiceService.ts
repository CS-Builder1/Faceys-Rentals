// ============================================================
// Invoice & Payment Service — Firestore CRUD
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
import type { Invoice, Payment, InvoiceStatus } from '../types'

// --- Invoice ---
const INVOICES = 'invoices'
const invoicesRef = collection(db, INVOICES)

function invoiceFromFirestore(id: string, data: DocumentData): Invoice {
    return {
        id,
        eventId: data.eventId ?? '',
        quoteId: data.quoteId,
        invoiceNumber: data.invoiceNumber ?? '',
        lineItems: data.lineItems ?? [],
        subtotal: data.subtotal ?? 0,
        tax: data.tax ?? 0,
        total: data.total ?? 0,
        depositType: data.depositType ?? 'none',
        depositAmount: data.depositAmount ?? 0,
        balanceDue: data.balanceDue ?? 0,
        dueDate: toDate(data.dueDate),
        status: data.status ?? 'unpaid',
        createdAt: toDate(data.createdAt),
        quickbooksInvoiceId: data.quickbooksInvoiceId,
    }
}

function invoiceToFirestore(invoice: Partial<Invoice>): DocumentData {
    const data: DocumentData = { ...invoice }
    delete data.id
    if (data.dueDate instanceof Date) data.dueDate = toTimestamp(data.dueDate)
    if (data.createdAt instanceof Date) data.createdAt = toTimestamp(data.createdAt)
    return data
}

export const invoiceService = {
    async getAll(): Promise<Invoice[]> {
        const q = query(invoicesRef, orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        return snap.docs.map((d) => invoiceFromFirestore(d.id, d.data()))
    },

    async getByStatus(status: InvoiceStatus): Promise<Invoice[]> {
        const q = query(invoicesRef, where('status', '==', status), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        return snap.docs.map((d) => invoiceFromFirestore(d.id, d.data()))
    },

    async getByEvent(eventId: string): Promise<Invoice[]> {
        const q = query(invoicesRef, where('eventId', '==', eventId))
        const snap = await getDocs(q)
        return snap.docs.map((d) => invoiceFromFirestore(d.id, d.data()))
    },

    async getById(id: string): Promise<Invoice | null> {
        const snap = await getDoc(doc(db, INVOICES, id))
        if (!snap.exists()) return null
        return invoiceFromFirestore(snap.id, snap.data())
    },

    async create(invoice: Omit<Invoice, 'id'>): Promise<string> {
        const data = invoiceToFirestore({ ...invoice, createdAt: new Date() })
        const docRef = await addDoc(invoicesRef, data)
        return docRef.id
    },

    async update(id: string, updates: Partial<Invoice>): Promise<void> {
        await updateDoc(doc(db, INVOICES, id), invoiceToFirestore(updates))
    },

    async remove(id: string): Promise<void> {
        await deleteDoc(doc(db, INVOICES, id))
    },
}

// --- Payments ---
const PAYMENTS = 'payments'
const paymentsRef = collection(db, PAYMENTS)

function paymentFromFirestore(id: string, data: DocumentData): Payment {
    return {
        id,
        invoiceId: data.invoiceId ?? '',
        amount: data.amount ?? 0,
        paymentMethod: data.paymentMethod ?? 'cash',
        stripeId: data.stripeId,
        reference: data.reference,
        paymentDate: toDate(data.paymentDate),
        recordedBy: data.recordedBy ?? '',
        createdAt: toDate(data.createdAt),
        quickbooksPaymentId: data.quickbooksPaymentId,
    }
}

function paymentToFirestore(payment: Partial<Payment>): DocumentData {
    const data: DocumentData = { ...payment }
    delete data.id
    if (data.paymentDate instanceof Date) data.paymentDate = toTimestamp(data.paymentDate)
    if (data.createdAt instanceof Date) data.createdAt = toTimestamp(data.createdAt)
    return data
}

export const paymentService = {
    async getByInvoice(invoiceId: string): Promise<Payment[]> {
        const q = query(paymentsRef, where('invoiceId', '==', invoiceId), orderBy('paymentDate', 'desc'))
        const snap = await getDocs(q)
        return snap.docs.map((d) => paymentFromFirestore(d.id, d.data()))
    },

    async create(payment: Omit<Payment, 'id'>): Promise<string> {
        const data = paymentToFirestore({ ...payment, createdAt: new Date() })
        const docRef = await addDoc(paymentsRef, data)
        return docRef.id
    },

    async remove(id: string): Promise<void> {
        await deleteDoc(doc(db, PAYMENTS, id))
    },
}
