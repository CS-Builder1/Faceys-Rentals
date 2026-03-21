import { useState, useEffect } from 'react'
import { employeeService } from '../../services/employeeService'
import { payrollService } from '../../services/payrollService'
import { type Employee, type WorkLogEntry, type PayPeriod, type PayStub } from '../../types'
import { format } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'
import { Check, X, Clock, Loader2, Calendar, FileText, Download, Play } from 'lucide-react'

export default function PayrollPage() {
    const { userProfile } = useAuth()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [pendingLogs, setPendingLogs] = useState<WorkLogEntry[]>([])
    const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([])
    
    // UI State
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'approvals' | 'runs'>('approvals')

    // Payroll Run State
    const [isRunModalOpen, setIsRunModalOpen] = useState(false)
    const [runForm, setRunForm] = useState({ startDate: '', endDate: '' })
    const [activePeriod, setActivePeriod] = useState<PayPeriod | null>(null)
    const [activeStubs, setActiveStubs] = useState<PayStub[]>([])
    const [runningPayroll, setRunningPayroll] = useState(false)
    const [editingStubId, setEditingStubId] = useState<string | null>(null)
    const [stubEdits, setStubEdits] = useState({ deductions: 0, bonuses: 0 })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        setError(null)
        try {
            const [emps, logs, periods] = await Promise.all([
                employeeService.getAllEmployees(),
                employeeService.getPendingWorkLogs(),
                payrollService.getPayPeriods()
            ])
            setEmployees(emps)
            setPendingLogs(logs)
            setPayPeriods(periods)
            
            // If we have an active period focused, reload its stubs
            if (activePeriod) {
                const updatedStubs = await payrollService.getPayStubsForPeriod(activePeriod.id)
                setActiveStubs(updatedStubs)
            }
        } catch (err) {
            console.error(err)
            setError('Failed to load payroll data.')
        } finally {
            setLoading(false)
        }
    }

    // ---- Pending Approvals ----
    const handleApprove = async (logId: string) => {
        if (!userProfile) return
        try {
            await employeeService.updateWorkLogStatus(logId, 'approved', userProfile.name)
            loadData() // Reload to refresh list
        } catch (err) {
            console.error('Error approving log', err)
            alert('Failed to approve work log.')
        }
    }

    const handleReject = async (logId: string) => {
        if (!userProfile) return
        if (!window.confirm('Are you sure you want to reject this work log?')) return
        try {
            await employeeService.updateWorkLogStatus(logId, 'rejected', userProfile.name)
            loadData() // Reload to refresh list
        } catch (err) {
            console.error('Error rejecting log', err)
            alert('Failed to reject work log.')
        }
    }

    const getEmployeeName = (id: string) => {
        return employees.find(e => e.id === id)?.fullName || 'Unknown Employee'
    }

    // ---- Payroll Runs & Stubs ----
    const handleCreatePayRun = async (e: React.FormEvent) => {
        e.preventDefault()
        setRunningPayroll(true)
        try {
            // Convert to Dates based on local end of day / start of day (rudimentary)
            const sDate = new Date(`${runForm.startDate}T00:00:00`)
            const eDate = new Date(`${runForm.endDate}T23:59:59`)
            const periodId = await payrollService.createPayPeriod(sDate, eDate)
            await payrollService.generatePayStubs(periodId)
            setIsRunModalOpen(false)
            await loadData()
            // View it immediately
            const period = await payrollService.getPayPeriods().then(ps => ps.find(p => p.id === periodId))
            if (period) viewPeriodDetails(period)
        } catch (err: any) {
            console.error(err)
            alert('Failed to run payroll: ' + err.message)
        } finally {
            setRunningPayroll(false)
        }
    }

    const viewPeriodDetails = async (period: PayPeriod) => {
        setActivePeriod(period)
        try {
            const stubs = await payrollService.getPayStubsForPeriod(period.id)
            setActiveStubs(stubs)
        } catch (e) {
            console.error(e)
            alert('Failed to load stubs')
        }
    }

    const handleSaveStubEdit = async (stubId: string) => {
        try {
            await payrollService.updatePayStub(stubId, {
                deductions: stubEdits.deductions,
                bonuses: stubEdits.bonuses
            })
            setEditingStubId(null)
            if (activePeriod) {
                const stubs = await payrollService.getPayStubsForPeriod(activePeriod.id)
                setActiveStubs(stubs)
            }
        } catch (e) {
            console.error(e)
            alert('Failed to save stub adjustments')
        }
    }

    const handleCompleteRun = async () => {
        if (!activePeriod) return
        if (!window.confirm('Are you sure you want to mark this run as paid? This cannot be undone.')) return
        setRunningPayroll(true)
        try {
            await payrollService.completePayRun(activePeriod.id)
            await loadData()
            // reload active details
            const updatedPeriodSnap = payPeriods.find(p => p.id === activePeriod.id)
            if (updatedPeriodSnap) {
                setActivePeriod({ ...activePeriod, status: 'closed' })
            }
            const stubs = await payrollService.getPayStubsForPeriod(activePeriod.id)
            setActiveStubs(stubs)
        } catch (e) {
            console.error(e)
            alert('Failed to complete run.')
        } finally {
            setRunningPayroll(false)
        }
    }

    const exportCSV = () => {
        if (!activePeriod || activeStubs.length === 0) return
        
        const headers = ["Employee Name", "Total Hours", "Hourly Rate", "Gross Pay", "Bonuses", "Deductions", "Net Pay", "Status"]
        const typeRows = activeStubs.map(stub => [
            getEmployeeName(stub.employeeId),
            stub.totalHours.toFixed(2),
            stub.hourlyRate.toFixed(2),
            stub.grossPay.toFixed(2),
            stub.bonuses.toFixed(2),
            stub.deductions.toFixed(2),
            stub.netPay.toFixed(2),
            stub.status.toUpperCase()
        ])
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...typeRows.map(e => e.join(","))].join("\n")
            
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `payroll_run_${format(activePeriod.startDate, 'yyyy-MM-dd')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (loading) {
        return (
            <div className="flex justify-center mt-20">
                <Loader2 className="animate-spin text-primary-600 w-8 h-8" />
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-ocean-deep dark:text-white">Payroll & Timesheets</h1>
                    <p className="text-slate-500 mt-2">Manage employee time tracking and generate payroll data.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('approvals')}
                    className={`pb-4 px-6 font-semibold flex items-center gap-2 whitespace-nowrap ${activeTab === 'approvals' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-gray-500'}`}
                >
                    <Clock className="w-5 h-5" />
                    Pending Approvals
                    {pendingLogs.length > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full ml-1">
                            {pendingLogs.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('runs')}
                    className={`pb-4 px-6 font-semibold flex items-center gap-2 whitespace-nowrap ${activeTab === 'runs' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-gray-500'}`}
                >
                    <FileText className="w-5 h-5" />
                    Payroll Runs
                </button>
            </div>

            {/* Tab: Pending Approvals */}
            {activeTab === 'approvals' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {pendingLogs.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center text-gray-500">
                            <Check className="w-12 h-12 text-green-400 mb-2" />
                            <p>All caught up! No pending work logs to review.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Context</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Hours</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendingLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{getEmployeeName(log.employeeId)}</td>
                                            <td className="px-6 py-4 text-gray-600 truncate">{format(log.clockInTime, 'PP p')}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded inline-block uppercase tracking-wider font-semibold">
                                                    {log.context}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {log.totalHours !== undefined ? log.totalHours.toFixed(2) : 'Active'}
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate text-gray-500" title={log.notes}>
                                                {log.notes || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {log.clockOutTime ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleApprove(log.id)} className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-colors border border-green-200" title="Approve">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleReject(log.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors border border-red-200" title="Reject">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-yellow-600 font-semibold bg-yellow-50 px-2 py-1 rounded border border-yellow-200">On Clock</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Payroll Runs */}
            {activeTab === 'runs' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left List */}
                    <div className="lg:col-span-1 border-r pr-6 border-b lg:border-b-0 pb-6 lg:pb-0">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Past Runs</h2>
                            <button 
                                onClick={() => setIsRunModalOpen(true)}
                                className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-sm"
                            >
                                <Play className="w-4 h-4 fill-current"/> New Run
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {payPeriods.length === 0 && <p className="text-sm text-gray-500 italic">No pay runs generated yet.</p>}
                            {payPeriods.map(period => (
                                <div 
                                    key={period.id} 
                                    onClick={() => viewPeriodDetails(period)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${activePeriod?.id === period.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-gray-900">
                                            {format(period.startDate, 'MMM d')} - {format(period.endDate, 'MMM d')}
                                        </span>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                                            period.status === 'closed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {period.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3"/> Created {format(period.createdAt, 'PP')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Right Details */}
                    <div className="lg:col-span-2">
                        {activePeriod ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold">Run Details</h3>
                                        <p className="text-sm text-gray-500">Period: {format(activePeriod.startDate, 'PP')} - {format(activePeriod.endDate, 'PP')}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={exportCSV} 
                                            className="bg-white border text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                                        >
                                            <Download className="w-4 h-4"/> CSV Export
                                        </button>
                                        {activePeriod.status !== 'closed' && (
                                            <button 
                                                onClick={handleCompleteRun}
                                                disabled={runningPayroll}
                                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
                                            >
                                                {runningPayroll ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                                                Mark as Paid
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold text-gray-500">Employee</th>
                                                <th className="px-6 py-3 font-semibold text-gray-500">Hours</th>
                                                <th className="px-6 py-3 font-semibold text-gray-500">Gross</th>
                                                <th className="px-6 py-3 font-semibold text-gray-500">+ Bonus</th>
                                                <th className="px-6 py-3 font-semibold text-gray-500">- Deduct</th>
                                                <th className="px-6 py-3 font-semibold text-gray-500">Net Pay</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {activeStubs.length === 0 && (
                                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">No approved hours found in this period.</td></tr>
                                            )}
                                            {activeStubs.map(stub => (
                                                <tr key={stub.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-semibold">{getEmployeeName(stub.employeeId)}</td>
                                                    <td className="px-6 py-4 text-gray-600">{stub.totalHours.toFixed(2)}h  <span className="text-xs text-gray-400">(@${stub.hourlyRate})</span></td>
                                                    <td className="px-6 py-4 font-medium text-gray-700">${stub.grossPay.toFixed(2)}</td>
                                                    
                                                    {editingStubId === stub.id ? (
                                                        <>
                                                            <td className="px-6 py-4">
                                                                <input type="number" step="0.01" value={stubEdits.bonuses} onChange={e => setStubEdits({...stubEdits, bonuses: parseFloat(e.target.value) || 0})} className="w-20 px-2 py-1 border rounded text-sm"/>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <input type="number" step="0.01" value={stubEdits.deductions} onChange={e => setStubEdits({...stubEdits, deductions: parseFloat(e.target.value) || 0})} className="w-20 px-2 py-1 border rounded text-sm"/>
                                                            </td>
                                                            <td className="px-6 py-4 flex items-center gap-2">
                                                                <button onClick={() => handleSaveStubEdit(stub.id)} className="bg-primary-600 text-white text-xs px-2 py-1 rounded">Save</button>
                                                                <button onClick={() => setEditingStubId(null)} className="text-gray-500 text-xs px-2 py-1">Cancel</button>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-6 py-4 text-green-600">${stub.bonuses.toFixed(2)}</td>
                                                            <td className="px-6 py-4 text-red-600">${stub.deductions.toFixed(2)}</td>
                                                            <td className="px-6 py-4 flex items-center justify-between group">
                                                                <span className="font-bold text-gray-900">${stub.netPay.toFixed(2)}</span>
                                                                {activePeriod.status !== 'closed' && (
                                                                    <button onClick={() => { setEditingStubId(stub.id); setStubEdits({bonuses: stub.bonuses, deductions: stub.deductions}) }} className="text-xs font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
                                <FileText className="w-12 h-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Select a Pay Run</h3>
                                <p className="text-gray-500 max-w-sm">Click on a pay run from the list on the left to view employee pay stubs, make adjustments, and export data.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* New Pay Run Modal */}
            {isRunModalOpen && (
                 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
                     <div className="flex justify-between items-center p-6 border-b">
                         <h2 className="text-xl font-bold text-gray-900">Run Payroll</h2>
                         <button onClick={() => setIsRunModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                             <X className="w-6 h-6" />
                         </button>
                     </div>
                     <form onSubmit={handleCreatePayRun} className="p-6 space-y-4">
                         <p className="text-sm text-gray-500 mb-4">Select the period date range. This will aggregate all <strong className="text-gray-800">approved</strong> work logs and draft pay stubs.</p>
                         <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                             <input
                                 required
                                 type="date"
                                 value={runForm.startDate}
                                 onChange={(e) => setRunForm({ ...runForm, startDate: e.target.value })}
                                 className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                             <input
                                 required
                                 type="date"
                                 value={runForm.endDate}
                                 onChange={(e) => setRunForm({ ...runForm, endDate: e.target.value })}
                                 className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                             />
                         </div>
                         <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                             <button
                                 type="button"
                                 onClick={() => setIsRunModalOpen(false)}
                                 className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-semibold transition-colors"
                             >
                                 Cancel
                             </button>
                             <button
                                 type="submit"
                                 disabled={runningPayroll}
                                 className="px-5 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                             >
                                 {runningPayroll && <Loader2 className="w-4 h-4 animate-spin" />}
                                 {runningPayroll ? 'Drafting...' : 'Generate Pay Stubs'}
                             </button>
                         </div>
                     </form>
                 </div>
             </div>
            )}
        </div>
    )
}
