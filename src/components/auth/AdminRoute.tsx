import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../types'

interface AdminRouteProps {
    allowedRoles?: UserRole[]
}

export default function AdminRoute({ allowedRoles = [UserRole.Admin] }: AdminRouteProps) {
    const { firebaseUser, userProfile, loading } = useAuth()
    console.log("[AdminRoute] Render - loading:", loading, "firebaseUser:", firebaseUser?.uid, "userProfile:", userProfile?.role)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!firebaseUser) {
        return <Navigate to="/admin/login" replace />
    }

    if (!userProfile || !allowedRoles.includes(userProfile.role as UserRole)) {
        // Technically this shouldn't happen for a regular user unless they stumbled onto /admin
        // For right now, if they aren't authorized, send them to home.
        if (userProfile?.role === UserRole.Staff) {
            return <Navigate to="/staff/timeclock" replace />
        }
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
