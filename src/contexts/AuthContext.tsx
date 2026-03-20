import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import type { User } from '../types'

interface AuthContextValue {
    firebaseUser: FirebaseUser | null
    userProfile: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string) => Promise<any>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
    const [userProfile, setUserProfile] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            console.log("[AuthContext] onAuthStateChanged fired with:", fbUser?.uid)
            
            // If we have a user, start fetching profile but KEEP loading true
            if (fbUser) {
                setFirebaseUser(fbUser)
                try {
                    console.log("[AuthContext] Fetching user profile from Firestore...")
                    const snap = await getDoc(doc(db, 'users', fbUser.uid))
                    console.log("[AuthContext] Profile fetched. Exists:", snap.exists())
                    if (snap.exists()) {
                        setUserProfile({ id: snap.id, ...snap.data() } as User)
                    } else {
                        console.warn("[AuthContext] User document missing for UID:", fbUser.uid)
                        setUserProfile(null)
                    }
                } catch (err) {
                    console.error("[AuthContext] Error fetching profile:", err)
                    setUserProfile(null)
                }
            } else {
                setFirebaseUser(null)
                setUserProfile(null)
            }
            
            // Finalize loading state once both auth and profile (if applicable) are handled
            console.log("[AuthContext] Auth initialization complete, setting loading to false")
            setLoading(false)
        })
        return unsub
    }, [])

    const login = async (email: string, password: string) => {
        setLoading(true)
        try {
            await signInWithEmailAndPassword(auth, email, password)
        } catch (error) {
            setLoading(false)
            throw error
        }
    }

    const signup = async (email: string, password: string) => {
        setLoading(true)
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            return userCredential
        } catch (error) {
            setLoading(false)
            throw error
        }
    }

    const logout = async () => {
        await signOut(auth)
        setUserProfile(null)
    }

    return (
        <AuthContext.Provider value={{ firebaseUser, userProfile, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
