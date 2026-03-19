import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { employeeService } from '../../services/employeeService'
import { WorkLogContext, type Employee, type WorkLogEntry } from '../../types'
import { format } from 'date-fns'
import { Clock, AlertCircle, Play, Square, LogOut, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../services/firebase'

export default function TimeclockPage() {
    const { userProfile } = useAuth()
    const navigate = useNavigate()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [activeLog, setActiveLog] = useState<WorkLogEntry | null>(null)
    const [recentLogs, setRecentLogs] = useState<WorkLogEntry[]>([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [notes, setNotes] = useState('')
    const [selectedContext, setSelectedContext] = useState<WorkLogContext>(WorkLogContext.General)
    const [bookingId, setBookingId] = useState('')

    useEffect(() => {
        if (userProfile?.id) {
            loadTimeclockData(userProfile.id)
        }
    }, [userProfile?.id])

    const loadTimeclockData = async (uid: string) => {
        try {
            setLoading(true)
            let emp = await employeeService.getEmployeeById(uid)
            
            // Auto-provision employee profile for authorized roles if it doesn't exist
            if (!emp && userProfile) {
                const authorizedRoles = ['ADMIN', 'STAFF', 'MARKETING', 'ACCOUNTANT'] as any[]
                if (authorizedRoles.includes(userProfile.role)) {
                    await employeeService.createEmployeeWithId(uid, {
                        fullName: userProfile.name,
                        role: userProfile.role,
                        phone: userProfile.phone || '',
                        hourlyRate: 0,
                        isActive: true
                    })
                    // Reload after creation
                    emp = await employeeService.getEmployeeById(uid)
                }
            }

            setEmployee(emp)

            if (emp) {
                const logs = await employeeService.getWorkLogsByEmployee(uid)
                const pending = logs.find(l => !l.clockOutTime)
                setActiveLog(pending || null)
                setRecentLogs(logs.slice(0, 5))
            }
        } catch (err) {
            console.error('Error loading timeclock data', err)
            setError('Failed to load your timeclock profile.')
        } finally {
            setLoading(false)
        }
    }

    const handleClockIn = async () => {
        if (!employee) return
        setError(null)
        try {
            await employeeService.clockIn({
                employeeId: employee.id,
                context: selectedContext,
                bookingId: bookingId.trim() || undefined,
                clockInTime: new Date(),
            })
            loadTimeclockData(employee.id)
        } catch (err) {
            setError('Failed to clock in. Please try again.')
            console.error(err)
        }
    }

    const handleClockOut = async () => {
        if (!activeLog || !employee) return
        setError(null)
        try {
            await employeeService.clockOut(activeLog.id, new Date(), notes)
            setNotes('')
            loadTimeclockData(employee.id)
        } catch (err) {
            setError('Failed to clock out. Please try again.')
            console.error(err)
        }
    }

    const handleLogout = async () => {
        try {
            await auth.signOut()
            navigate('/login')
        } catch (error) {
            console.error('Error signing out', error)
        }
    }

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex justify-center items-center"><div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full"></div></div>
    }

    if (!employee || !employee.isActive) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6 font-medium">Your profile is not active or hasn't been set up for time tracking.</p>
                    <button onClick={handleLogout} className="w-full py-3 bg-gray-900 text-white rounded-full font-bold">Sign Out</button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[100dvh] bg-slate-50 pb-8 flex flex-col">
            {/* Header */}
            <header className="bg-white px-5 py-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-ocean-deep to-primary-600 inline-block text-transparent bg-clip-text">Timeclock</h1>
                </div>
                <button onClick={handleLogout} className="text-gray-500 hover:text-gray-800 p-2">
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <main className="flex-1 w-full max-w-md mx-auto px-4 pt-6">

                {/* Greeting */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Hi, {employee.fullName.split(' ')[0]}</h2>
                    <p className="text-gray-500 font-medium capitalize mt-1">{employee.role} Portal</p>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-800 px-4 py-3 rounded-2xl mb-6 text-sm font-medium flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Main Action Card */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-6 p-6">

                    {!activeLog ? (
                        <div className="space-y-5">
                            <div className="text-center mb-6">
                                <span className="inline-block px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-bold uppercase tracking-wider mb-2">Off the clock</span>
                            </div>

                            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Activity Type</label>
                                    <div className="relative">
                                        <select
                                            value={selectedContext}
                                            onChange={(e) => setSelectedContext(e.target.value as WorkLogContext)}
                                            className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-base rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-3 font-medium outline-none"
                                        >
                                            <option value={WorkLogContext.General}>General Tasks</option>
                                            <option value={WorkLogContext.Setup}>Setup Phase</option>
                                            <option value={WorkLogContext.Delivery}>Delivery Tracking</option>
                                            <option value={WorkLogContext.EventDuty}>On-site Event Duty</option>
                                            <option value={WorkLogContext.Breakdown}>Breakdown Phase</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <ChevronDown className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reference ID (Optional)</label>
                                    <input
                                        type="text"
                                        value={bookingId}
                                        onChange={(e) => setBookingId(e.target.value)}
                                        placeholder="E.g. Booking #1234"
                                        className="w-full bg-white border border-gray-200 text-gray-900 text-base rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-3 font-medium outline-none placeholder:font-normal placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleClockIn}
                                className="w-full py-4 bg-green-500 hover:bg-green-600 active:scale-[0.98] transition-all text-white rounded-2xl font-black text-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                            >
                                <Play className="w-6 h-6 fill-current" />
                                CLOCK IN
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold uppercase tracking-wider mb-3">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                    </span>
                                    On the clock
                                </div>

                                <div className="text-3xl font-black text-gray-900 tracking-tight">
                                    {format(activeLog.clockInTime, 'h:mm a')}
                                </div>
                                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-1">
                                    Start Time
                                </div>
                            </div>

                            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center text-center">
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Current Task</span>
                                <span className="text-lg font-bold text-blue-900 uppercase">{activeLog.context.replace('_', ' ')}</span>
                                {activeLog.bookingId && <span className="text-sm font-medium text-blue-600 mt-1">Ref: {activeLog.bookingId}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shift Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter any relevant issues or notes before clocking out..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-gray-200 text-gray-900 text-base rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-3 font-medium outline-none placeholder:font-normal placeholder:text-gray-400 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleClockOut}
                                className="w-full py-4 bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all text-white rounded-2xl font-black text-lg shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                            >
                                <Square className="w-6 h-6 fill-current" />
                                CLOCK OUT
                            </button>
                        </div>
                    )}
                </div>

                {/* Recent Logs (Mobile Compact) */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Shifts</h3>
                    </div>

                    <div className="space-y-3">
                        {recentLogs.length === 0 ? (
                            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 font-medium">No recent shifts found</p>
                            </div>
                        ) : (
                            recentLogs.map((log) => (
                                <div key={log.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-bold text-gray-900 truncate">
                                                {format(log.clockInTime, 'MMM d, yyyy')}
                                            </p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${log.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                log.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <p className="text-gray-500 font-medium flex items-center gap-1">
                                                <span>{format(log.clockInTime, 'h:mma')}</span>
                                                <span className="text-gray-300">-</span>
                                                <span>{log.clockOutTime ? format(log.clockOutTime, 'h:mma') : 'Now'}</span>
                                            </p>
                                            {log.totalHours !== undefined && (
                                                <span className="font-bold text-gray-700">
                                                    {log.totalHours.toFixed(1)}h
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 text-xs font-semibold text-primary-600 uppercase tracking-wider w-max bg-primary-50 px-2 py-0.5 rounded">
                                            {log.context.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
