import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    where,
    type DocumentData,
    writeBatch
} from 'firebase/firestore'
import { db, toDate, toTimestamp } from './firebase'
import type { PayPeriod, PayStub, WorkLogEntry } from '../types'
import { employeeService } from './employeeService'

const PAY_PERIODS_COLLECTION = 'payPeriods'
const PAY_STUBS_COLLECTION = 'payStubs'
const WORKLOGS_COLLECTION = 'worklogs'

// Parsers
function payPeriodFromFirestore(id: string, data: DocumentData): PayPeriod {
    return {
        id,
        startDate: toDate(data.startDate),
        endDate: toDate(data.endDate),
        status: data.status ?? 'open',
        paymentDate: data.paymentDate ? toDate(data.paymentDate) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt)
    }
}

function payPeriodToFirestoreData(period: Partial<PayPeriod>): DocumentData {
    const data: DocumentData = { ...period }
    delete data.id
    if (data.startDate instanceof Date) data.startDate = toTimestamp(data.startDate)
    if (data.endDate instanceof Date) data.endDate = toTimestamp(data.endDate)
    if (data.paymentDate instanceof Date) data.paymentDate = toTimestamp(data.paymentDate)
    if (data.createdAt instanceof Date) data.createdAt = toTimestamp(data.createdAt)
    if (data.updatedAt instanceof Date) data.updatedAt = toTimestamp(data.updatedAt)
    Object.keys(data).forEach(key => { if (data[key] === undefined) delete data[key] })
    return data
}

function payStubFromFirestore(id: string, data: DocumentData): PayStub {
    return {
        id,
        employeeId: data.employeeId ?? '',
        payPeriodId: data.payPeriodId ?? '',
        totalHours: data.totalHours ?? 0,
        hourlyRate: data.hourlyRate ?? 0,
        grossPay: data.grossPay ?? 0,
        deductions: data.deductions ?? 0,
        bonuses: data.bonuses ?? 0,
        netPay: data.netPay ?? 0,
        status: data.status ?? 'draft',
        paymentDate: data.paymentDate ? toDate(data.paymentDate) : undefined,
        workLogIds: data.workLogIds ?? [],
        notes: data.notes,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt)
    }
}

function payStubToFirestoreData(stub: Partial<PayStub>): DocumentData {
    const data: DocumentData = { ...stub }
    delete data.id
    if (data.paymentDate instanceof Date) data.paymentDate = toTimestamp(data.paymentDate)
    if (data.createdAt instanceof Date) data.createdAt = toTimestamp(data.createdAt)
    if (data.updatedAt instanceof Date) data.updatedAt = toTimestamp(data.updatedAt)
    Object.keys(data).forEach(key => { if (data[key] === undefined) delete data[key] })
    return data
}

export const payrollService = {
    // ---- Pay Periods ----
    async getPayPeriods(): Promise<PayPeriod[]> {
        const q = query(collection(db, PAY_PERIODS_COLLECTION), orderBy('startDate', 'desc'))
        const snap = await getDocs(q)
        return snap.docs.map(d => payPeriodFromFirestore(d.id, d.data()))
    },

    async createPayPeriod(startDate: Date, endDate: Date): Promise<string> {
        const data = payPeriodToFirestoreData({
            startDate,
            endDate,
            status: 'open',
            createdAt: new Date(),
            updatedAt: new Date()
        })
        const docRef = await addDoc(collection(db, PAY_PERIODS_COLLECTION), data)
        return docRef.id
    },

    async updatePayPeriodStatus(id: string, status: 'open' | 'processing' | 'closed'): Promise<void> {
        await updateDoc(doc(db, PAY_PERIODS_COLLECTION, id), payPeriodToFirestoreData({ status, updatedAt: new Date() }))
    },

    async deletePayPeriod(id: string): Promise<void> {
        // Technically should use writeBatch to delete stubs as well, but for simplicity:
        // (Firestore doesn't auto-cascade). We assume user can only delete if empty or 'open'.
        // This usually isn't standard in production (better to disable/archive) but we'll leave as a placeholder if needed.
        throw new Error(`Pay period deletion not implemented for ${id}. Mark as closed/archived instead.`)
    },

    // ---- Pay Stubs ----
    async getPayStubsForPeriod(payPeriodId: string): Promise<PayStub[]> {
        const q = query(
            collection(db, PAY_STUBS_COLLECTION),
            where('payPeriodId', '==', payPeriodId)
        )
        const snap = await getDocs(q)
        return snap.docs.map(d => payStubFromFirestore(d.id, d.data()))
    },

    async updatePayStub(id: string, updates: Partial<PayStub>): Promise<void> {
        // Recalculate netPay if there are financial changes
        const currentSnap = await getDoc(doc(db, PAY_STUBS_COLLECTION, id))
        if (!currentSnap.exists()) throw new Error('Pay stub not found')
        
        const current = payStubFromFirestore(currentSnap.id, currentSnap.data())
        const merged = { ...current, ...updates }
        merged.netPay = merged.grossPay - merged.deductions + merged.bonuses
        merged.updatedAt = new Date()

        await updateDoc(doc(db, PAY_STUBS_COLLECTION, id), payStubToFirestoreData({
            ...updates,
            netPay: merged.netPay, // Ensure net pay is updated
            updatedAt: new Date()
        }))
    },

    // ---- Core Processing Logic ----
    
    /**
     * Finds all 'approved' worklogs between the period dates and generates drafted PayStubs.
     * Overwrites any existing 'draft' stubs for this period. 
     */
    async generatePayStubs(payPeriodId: string): Promise<void> {
        // 1. Get the pay period
        const periodSnap = await getDoc(doc(db, PAY_PERIODS_COLLECTION, payPeriodId))
        if (!periodSnap.exists()) throw new Error('Pay period not found')
        const period = payPeriodFromFirestore(periodSnap.id, periodSnap.data())

        // 2. Fetch all approved work logs in the date range
        // Since we can't easily compound query a single date range without composite indexes on 'status' and 'clockInTime',
        // we'll fetch all approved and filter locally to avoid firestore index errors for now.
        const worklogsQ = query(
            collection(db, WORKLOGS_COLLECTION),
            where('status', '==', 'approved')
        )
        const worklogsSnap = await getDocs(worklogsQ)
        
        // This parsing function lives in employeeService, we need to adapt it or duplicate momentarily
        // For simplicity, we parse here using a quick map 
        const approvedLogs: WorkLogEntry[] = worklogsSnap.docs.map(d => {
            const data = d.data()
            return {
                id: d.id,
                employeeId: data.employeeId,
                status: data.status,
                clockInTime: toDate(data.clockInTime),
                clockOutTime: data.clockOutTime ? toDate(data.clockOutTime) : undefined,
                totalHours: data.totalHours ?? 0,
                // ... other fields that don't matter for this computation
            } as WorkLogEntry;
        })

        const periodLogs = approvedLogs.filter(log => 
            log.clockInTime >= period.startDate && log.clockInTime <= period.endDate && (log.totalHours || 0) > 0
        )

        // 3. Group by employee
        const logMap = new Map<string, WorkLogEntry[]>()
        periodLogs.forEach(log => {
            if (!logMap.has(log.employeeId)) logMap.set(log.employeeId, [])
            logMap.get(log.employeeId)!.push(log)
        })

        // 4. Fetch employees to get hourly rate
        const employees = await employeeService.getAllEmployees()
        const empMap = new Map(employees.map(e => [e.id, e]))

        // 5. Delete existing draft stubs for this period (clean regeneration)
        const existingStubsQ = query(collection(db, PAY_STUBS_COLLECTION), where('payPeriodId', '==', payPeriodId))
        const existingStubsSnap = await getDocs(existingStubsQ)
        
        const batch = writeBatch(db)

        existingStubsSnap.docs.forEach(d => {
            const data = d.data()
            if (data.status === 'draft') {
                batch.delete(d.ref)
            }
        })

        // 6. Generate new stubs
        for (const [employeeId, logs] of logMap.entries()) {
            const employee = empMap.get(employeeId)
            if (!employee) continue // Skip if employee deleted

            const totalHours = logs.reduce((sum, log) => sum + (log.totalHours || 0), 0)
            const hourlyRate = employee.hourlyRate || 0
            const grossPay = totalHours * hourlyRate

            const newStub: Omit<PayStub, 'id'> = {
                employeeId,
                payPeriodId,
                totalHours,
                hourlyRate,
                grossPay,
                deductions: 0,
                bonuses: 0,
                netPay: grossPay,
                status: 'draft',
                workLogIds: logs.map(l => l.id),
                createdAt: new Date(),
                updatedAt: new Date()
            }

            const stubRef = doc(collection(db, PAY_STUBS_COLLECTION))
            batch.set(stubRef, payStubToFirestoreData(newStub))
        }

        // Commit all generated stubs
        await batch.commit()
        
        // Update period status to processing
        await this.updatePayPeriodStatus(payPeriodId, 'processing')
    },

    /**
     * Completes a pay run: Marks stubs as paid, updates work logs to paid, and closes the period.
     */
    async completePayRun(payPeriodId: string): Promise<void> {
        const periodSnap = await getDoc(doc(db, PAY_PERIODS_COLLECTION, payPeriodId))
        if (!periodSnap.exists()) throw new Error('Period not found')

        const stubs = await this.getPayStubsForPeriod(payPeriodId)
        
        const batch = writeBatch(db)
        const now = new Date()

        // 1. Mark period as closed
        batch.update(periodSnap.ref, payPeriodToFirestoreData({ 
            status: 'closed', 
            paymentDate: now,
            updatedAt: now 
        }))

        for (const stub of stubs) {
            // 2. Mark stubs as paid
            const stubRef = doc(db, PAY_STUBS_COLLECTION, stub.id)
            batch.update(stubRef, payStubToFirestoreData({
                status: 'paid',
                paymentDate: now,
                updatedAt: now
            }))

            // 3. Mark underlying worklogs as paid
            for (const logId of stub.workLogIds) {
                const logRef = doc(db, WORKLOGS_COLLECTION, logId)
                // Need to use raw firebase update map since we don't have the parsing func exported, 
                // but just updating the raw fields is fine
                batch.update(logRef, { 
                    status: 'paid',
                    updatedAt: toTimestamp(now)
                })
            }
        }

        await batch.commit()
    },

    async getPayStubsByEmployeeId(employeeId: string): Promise<PayStub[]> {
        const q = query(
            collection(db, PAY_STUBS_COLLECTION),
            where('employeeId', '==', employeeId),
            orderBy('createdAt', 'desc')
        )
        const snap = await getDocs(q)
        return snap.docs.map(d => payStubFromFirestore(d.id, d.data()))
    }
}
