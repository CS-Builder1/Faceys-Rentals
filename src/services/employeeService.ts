// ============================================================
// Employee Service — Firestore CRUD for Employees & WorkLogs
// ============================================================
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    query,
    orderBy,
    where,
    type DocumentData,
} from 'firebase/firestore'
import { db, secondaryAuth, toDate, toTimestamp } from './firebase'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import type { Employee, WorkLogEntry, UserRole } from '../types'

const EMPLOYEES_COLLECTION = 'employees'
const WORKLOGS_COLLECTION = 'worklogs'

// Employee Parsing
function employeeFromFirestore(id: string, data: DocumentData): Employee {
    return {
        id,
        fullName: data.fullName ?? '',
        role: data.role ?? '',
        phone: data.phone ?? '',
        hourlyRate: data.hourlyRate ?? 0,
        isActive: data.isActive ?? true,
    }
}

function employeeToFirestoreData(employee: Partial<Employee>): DocumentData {
    const data: DocumentData = { ...employee }
    delete data.id
    return data
}

// WorkLog Parsing
function workLogFromFirestore(id: string, data: DocumentData): WorkLogEntry {
    return {
        id,
        employeeId: data.employeeId ?? '',
        bookingId: data.bookingId,
        context: data.context ?? 'general',
        clockInTime: toDate(data.clockInTime),
        clockOutTime: data.clockOutTime ? toDate(data.clockOutTime) : undefined,
        totalHours: data.totalHours,
        notes: data.notes,
        status: data.status ?? 'pending',
        approvedBy: data.approvedBy,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
    }
}

function workLogToFirestoreData(entry: Partial<WorkLogEntry>): DocumentData {
    const data: DocumentData = { ...entry }
    delete data.id
    if (data.clockInTime instanceof Date) data.clockInTime = toTimestamp(data.clockInTime)
    if (data.clockOutTime instanceof Date) data.clockOutTime = toTimestamp(data.clockOutTime)
    if (data.createdAt instanceof Date) data.createdAt = toTimestamp(data.createdAt)
    if (data.updatedAt instanceof Date) data.updatedAt = toTimestamp(data.updatedAt)
    // Remove undefined fields
    Object.keys(data).forEach(key => {
        if (data[key] === undefined) {
            delete data[key]
        }
    })
    return data
}

export const employeeService = {
    // ---- Employee Methods ----
    async getAllEmployees(): Promise<Employee[]> {
        const q = query(collection(db, EMPLOYEES_COLLECTION), orderBy('fullName'))
        const snap = await getDocs(q)
        return snap.docs.map((d) => employeeFromFirestore(d.id, d.data()))
    },

    async getEmployeeById(id: string): Promise<Employee | null> {
        const snap = await getDoc(doc(db, EMPLOYEES_COLLECTION, id))
        if (!snap.exists()) return null
        return employeeFromFirestore(snap.id, snap.data())
    },

    async createEmployee(employee: Omit<Employee, 'id'>): Promise<string> {
        const data = employeeToFirestoreData(employee)
        const docRef = await addDoc(collection(db, EMPLOYEES_COLLECTION), data)
        return docRef.id
    },

    async createEmployeeWithId(id: string, employee: Omit<Employee, 'id'>): Promise<void> {
        await setDoc(doc(db, EMPLOYEES_COLLECTION, id), employeeToFirestoreData(employee))
    },

    async updateEmployee(id: string, updates: Partial<Employee>): Promise<void> {
        await updateDoc(doc(db, EMPLOYEES_COLLECTION, id), employeeToFirestoreData(updates))
    },

    /**
     * Creates a new Auth user via a secondary Firebase app instance (to not log out the Admin)
     * and adds their documents to both the 'users' and 'employees' collections.
     */
    async createStaffAccount(data: {
        email: string
        password: string
        fullName: string
        role: UserRole
        phone: string
        hourlyRate: number
    }): Promise<string> {
        // 1. Create the user in Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password)
        const uid = userCredential.user.uid

        // Sign out the secondary instance immediately
        await signOut(secondaryAuth)

        // 2. Create the User Document (for RBAC and App login)
        const userDocRef = doc(db, 'users', uid)
        await setDoc(userDocRef, {
            role: data.role,
            name: data.fullName,
            email: data.email,
            phone: data.phone,
            status: 'active',
            createdAt: new Date(),
        })

        // 3. Create the Employee Document (for Payroll)
        const employeeData: Employee = {
            id: uid, // Use the same UID!
            fullName: data.fullName,
            role: data.role,
            phone: data.phone,
            hourlyRate: data.hourlyRate,
            isActive: true
        }
        await setDoc(doc(db, EMPLOYEES_COLLECTION, uid), employeeToFirestoreData(employeeData))

        return uid
    },

    // ---- WorkLog Methods ----
    async getWorkLogsByEmployee(employeeId: string): Promise<WorkLogEntry[]> {
        const q = query(
            collection(db, WORKLOGS_COLLECTION),
            where('employeeId', '==', employeeId)
        )
        const snap = await getDocs(q)
        const logs = snap.docs.map((d) => workLogFromFirestore(d.id, d.data()))
        return logs.sort((a, b) => b.clockInTime.getTime() - a.clockInTime.getTime())
    },

    async getPendingWorkLogs(): Promise<WorkLogEntry[]> {
        // We removed the orderBy clause to prevent requiring a composite index.
        const q = query(
            collection(db, WORKLOGS_COLLECTION),
            where('status', '==', 'pending')
        )
        const snap = await getDocs(q)
        const logs = snap.docs.map((d) => workLogFromFirestore(d.id, d.data()))
        // Sort manually by clockInTime descending
        return logs.sort((a, b) => b.clockInTime.getTime() - a.clockInTime.getTime())
    },

    async clockIn(entry: Omit<WorkLogEntry, 'id' | 'createdAt' | 'updatedAt' | 'clockOutTime' | 'totalHours' | 'status'>): Promise<string> {
        const data = workLogToFirestoreData({
            ...entry,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        const docRef = await addDoc(collection(db, WORKLOGS_COLLECTION), data)
        return docRef.id
    },

    async clockOut(id: string, clockOutTime: Date, notes?: string): Promise<void> {
        // Fetch the existing log to calculate total hours
        const snap = await getDoc(doc(db, WORKLOGS_COLLECTION, id))
        if (!snap.exists()) throw new Error('WorkLog not found')

        const log = workLogFromFirestore(snap.id, snap.data())
        const msDiff = clockOutTime.getTime() - log.clockInTime.getTime()
        const totalHours = msDiff / (1000 * 60 * 60)

        const updates: Partial<WorkLogEntry> = {
            clockOutTime,
            totalHours,
            updatedAt: new Date(),
        }
        if (notes) updates.notes = notes

        await updateDoc(doc(db, WORKLOGS_COLLECTION, id), workLogToFirestoreData(updates))
    },

    async updateWorkLogStatus(id: string, status: 'approved' | 'rejected', approvedBy?: string): Promise<void> {
        const updates: Partial<WorkLogEntry> = {
            status,
            updatedAt: new Date(),
        }
        if (approvedBy) updates.approvedBy = approvedBy
        await updateDoc(doc(db, WORKLOGS_COLLECTION, id), workLogToFirestoreData(updates))
    }
}
