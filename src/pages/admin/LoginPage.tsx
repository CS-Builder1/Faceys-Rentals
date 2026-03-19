import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../services/firebase'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setIsLoading(true)

        try {
            await login(email, password)
            navigate('/admin')
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to log in.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (!email) {
            setError('Please enter your email address to reset your password.')
            return
        }
        setIsLoading(true)
        setError('')
        setMessage('')
        try {
            await sendPasswordResetEmail(auth, email)
            setMessage('Password reset link sent! Check your email.')
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to send reset email.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark p-6">
            <div className="max-w-md w-full bg-white dark:bg-white/5 rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-xl">
                <div className="text-center mb-8">
                    <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl">lock</span>
                    </div>
                    <h1 className="text-2xl font-black text-ocean-deep dark:text-white">Admin Login</h1>
                    <p className="text-slate-500 text-sm mt-2">Sign in to manage Facey's rentals.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-100/50 text-red-600 rounded-xl text-sm font-bold border border-red-200">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="mb-6 p-4 bg-emerald-100/50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-200">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            placeholder="admin@faceys.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleResetPassword}
                            disabled={isLoading}
                            className="text-sm font-bold text-primary hover:text-ocean-deep dark:hover:text-white transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isLoading ? 'Processing...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-white/5">
                    <Link to="/" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Return to Homepage
                    </Link>
                </div>
            </div>
        </main>
    )
}
