import React, { useState, useEffect } from 'react'
import { X, FileText, Download, Clock, Loader2 } from 'lucide-react'
import { payrollService } from '../services/payrollService'
import type { PayStub } from '../types'
import { format } from 'date-fns'

interface PayStubsModalProps {
    isOpen: boolean
    onClose: () => void
    employeeId: string
    employeeName: string
}

const PayStubsModal: React.FC<PayStubsModalProps> = ({ isOpen, onClose, employeeId, employeeName }) => {
    const [stubs, setStubs] = useState<PayStub[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen && employeeId) {
            loadStubs()
        }
    }, [isOpen, employeeId])

    const loadStubs = async () => {
        setLoading(true)
        try {
            const data = await payrollService.getPayStubsByEmployeeId(employeeId)
            // Show only paid stubs for this view
            setStubs(data.filter(s => s.status === 'paid'))
        } catch (error) {
            console.error('Error loading stubs:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pay<span className="text-blue-600 italic">stubs</span></h2>
                        <p className="text-sm text-slate-500 font-medium">Payment history for {employeeName}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-full transition-colors shadow-sm border border-slate-200 bg-white"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Retrieving paystubs...</p>
                        </div>
                    ) : stubs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <FileText className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No paystubs found</h3>
                            <p className="text-slate-500 mt-2 max-w-xs mx-auto">This employee hasn't been paid through the system yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {stubs.map((stub) => (
                                <div key={stub.id} className="p-5 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition-all group relative overflow-hidden">
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-lg">
                                                    {stub.paymentDate ? format(stub.paymentDate, 'MMMM dd, yyyy') : 'Pending'}
                                                </div>
                                                <div className="text-sm text-slate-500 flex items-center gap-3 mt-1 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {stub.totalHours} hrs
                                                    </span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span>${stub.hourlyRate}/hr</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-slate-900 leading-none">
                                                ${stub.netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <button className="text-blue-600 text-xs font-bold uppercase tracking-wider hover:text-blue-700 flex items-center gap-1.5 mt-2 ml-auto transition-colors">
                                                <Download className="w-3.5 h-3.5" />
                                                PDF Details
                                            </button>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-100 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PayStubsModal
