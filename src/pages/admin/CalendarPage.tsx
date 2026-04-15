import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { eventService } from '../../services/eventService'
import { quoteService } from '../../services/quoteService'
import { invoiceService } from '../../services/invoiceService'
import type { Event as AppEvent, Quote, Invoice } from '../../types'
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

interface CalendarItem extends BigCalendarEvent {
    title: string;
    type: 'event' | 'quote' | 'invoice';
    originalData: AppEvent | Quote | Invoice;
}

export default function CalendarPage() {
    const [calendarEvents, setCalendarEvents] = useState<CalendarItem[]>([])
    const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const [events, quotes, invoices] = await Promise.all([
                    eventService.getAll(),
                    quoteService.getAll(),
                    invoiceService.getAll()
                ])

                const mappedItems: CalendarItem[] = []

                // Map Events
                events.forEach(e => {
                    const start = new Date(e.eventDate)
                    const end = new Date(e.eventDate)
                    
                    if (e.startTime) {
                        const [hours, minutes] = e.startTime.split(':')
                        start.setHours(parseInt(hours || '0', 10), parseInt(minutes || '0', 10), 0)
                    }
                    if (e.endTime) {
                        const [hours, minutes] = e.endTime.split(':')
                        end.setHours(parseInt(hours || '0', 10), parseInt(minutes || '0', 10), 0)
                    } else {
                        end.setHours(start.getHours() + 1) // default 1 hour
                    }

                    mappedItems.push({
                        title: `${e.eventType} Event`,
                        start,
                        end,
                        type: 'event',
                        originalData: e
                    })
                })

                // Map Quotes (Use eventDate if available, otherwise expirationDate)
                quotes.forEach(q => {
                    const targetDate = q.eventDate ? new Date(q.eventDate) : new Date(q.expirationDate)
                    // adjust target date to local midnight to avoid timezone shift dropping it to previous day
                    targetDate.setHours(12, 0, 0, 0)
                    
                    mappedItems.push({
                        title: `Quote: ${q.customerName || 'Client'}`,
                        start: targetDate,
                        end: targetDate,
                        allDay: true,
                        type: 'quote',
                        originalData: q
                    })
                })

                // Map Invoices
                invoices.forEach(i => {
                    const targetDate = new Date(i.dueDate)
                    targetDate.setHours(12, 0, 0, 0)

                    mappedItems.push({
                        title: `Invoice Due: ${i.invoiceNumber}`,
                        start: targetDate,
                        end: targetDate,
                        allDay: true,
                        type: 'invoice',
                        originalData: i
                    })
                })

                setCalendarEvents(mappedItems)
            } catch (error) {
                console.error("Error fetching calendar data:", error)
            } finally {
                setIsLoading(false)
            }
        }
        
        fetchData()
    }, [])

    const eventStyleGetter = (event: CalendarItem) => {
        let backgroundColor = '#3b82f6' // default blue
        if (event.type === 'event') backgroundColor = '#f43f5e' // primary coral
        if (event.type === 'quote') backgroundColor = '#f59e0b' // amber
        if (event.type === 'invoice') backgroundColor = '#10b981' // emerald

        return {
            style: {
                backgroundColor,
                borderRadius: '8px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                padding: '2px 6px'
            }
        }
    }

    const getDetailLink = (item: CalendarItem) => {
        if (item.type === 'quote') return '/admin/quotes'
        if (item.type === 'invoice') return '/admin/invoices'
        return '/admin'
    }

    const getTypeLabel = (item: CalendarItem) => {
        if (item.type === 'quote') return 'Quote Request'
        if (item.type === 'invoice') return 'Invoice Reminder'
        return 'Booking'
    }

    const getDisplayDate = (item: CalendarItem) =>
        format(item.start as Date, item.allDay ? 'PPP' : 'PPP p')

    return (
        <div className="p-8 md:p-12 space-y-8 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
                <div>
                    <h2 className="text-3xl font-black text-ocean-deep dark:text-white">Event <span className="text-primary tracking-widest uppercase text-2xl">Calendar</span></h2>
                    <p className="text-slate-500 font-medium">View and manage upcoming scheduled events, quotes, and invoices.</p>
                </div>
                <div className="flex gap-4">
                     <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                         <div className="w-3 h-3 rounded-full bg-primary"></div> Events
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                         <div className="w-3 h-3 rounded-full bg-amber-500"></div> Quotes
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                         <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Invoices
                     </div>
                </div>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl p-8 flex-grow overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex-grow flex items-center justify-center text-slate-500 font-medium tracking-widest uppercase text-sm">
                        Loading calendar data...
                    </div>
                ) : (
                    <div className="flex-grow min-h-0 calendar-container">
                        <style>{`
                            .calendar-container .rbc-calendar {
                                font-family: inherit;
                                border: none;
                            }
                            .calendar-container .rbc-month-view {
                                border: 1px solid #e2e8f0;
                                border-radius: 1rem;
                                overflow: hidden;
                            }
                            .calendar-container .rbc-header {
                                padding: 12px 0;
                                font-weight: 800;
                                text-transform: uppercase;
                                letter-spacing: 0.1em;
                                font-size: 0.75rem;
                                color: #64748b;
                                border-bottom: 1px solid #e2e8f0;
                            }
                            .calendar-container .rbc-today {
                                background-color: #f1f5f9;
                            }
                            .calendar-container .rbc-off-range-bg {
                                background-color: #f8fafc;
                            }
                            .calendar-container .rbc-day-bg + .rbc-day-bg {
                                border-left: 1px solid #e2e8f0;
                            }
                            .calendar-container .rbc-month-row + .rbc-month-row {
                                border-top: 1px solid #e2e8f0;
                            }
                            .calendar-container .rbc-date-cell {
                                padding: 8px;
                                font-weight: 700;
                                font-size: 0.875rem;
                                color: #334155;
                            }
                            .calendar-container .rbc-event {
                                transition: transform 0.2s, box-shadow 0.2s;
                            }
                            .calendar-container .rbc-event:hover {
                                transform: translateY(-1px);
                                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                            }
                            .calendar-container .rbc-toolbar button {
                                padding: 8px 16px;
                                border-radius: 0.75rem;
                                border: 1px solid #e2e8f0;
                                font-weight: 700;
                                color: #475569;
                                text-transform: capitalize;
                            }
                            .calendar-container .rbc-toolbar button:active, .calendar-container .rbc-toolbar button.rbc-active {
                                background-color: #f43f5e;
                                color: white;
                                border-color: #f43f5e;
                                box-shadow: none;
                            }
                        `}</style>
                        <Calendar
                            localizer={localizer}
                            events={calendarEvents}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%' }}
                            eventPropGetter={eventStyleGetter}
                            views={['month', 'week', 'day']}
                            defaultView="month"
                            tooltipAccessor="title"
                            onSelectEvent={(event) => setSelectedItem(event as CalendarItem)}
                        />
                    </div>
                )}
            </div>

            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-ocean-deep/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-primary">{getTypeLabel(selectedItem)}</p>
                                <h3 className="text-2xl font-black text-ocean-deep dark:text-white mt-1">{selectedItem.title}</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {getDisplayDate(selectedItem)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {selectedItem.type === 'event' && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-5 border border-slate-200 dark:border-white/10">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Operational Status</p>
                                        <p className="mt-3 text-sm font-bold text-ocean-deep dark:text-white capitalize">
                                            {(selectedItem.originalData as AppEvent).status}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-2">
                                            Delivery: {(selectedItem.originalData as AppEvent).deliveryStatus.replace(/_/g, ' ')}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-5 border border-slate-200 dark:border-white/10">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Venue</p>
                                        <p className="mt-3 text-sm text-slate-700 dark:text-white/75">
                                            {(selectedItem.originalData as AppEvent).venueAddress || 'Venue not set'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedItem.type === 'quote' && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-5 border border-slate-200 dark:border-white/10">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Customer</p>
                                        <p className="mt-3 text-sm font-bold text-ocean-deep dark:text-white">
                                            {(selectedItem.originalData as Quote).customerName || 'Online Request'}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {(selectedItem.originalData as Quote).customerEmail || 'No email'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-5 border border-slate-200 dark:border-white/10">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Status</p>
                                        <p className="mt-3 text-sm font-bold text-ocean-deep dark:text-white capitalize">
                                            {(selectedItem.originalData as Quote).status}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {(selectedItem.originalData as Quote).venue || 'Venue not set'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedItem.type === 'invoice' && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-5 border border-slate-200 dark:border-white/10">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Invoice</p>
                                        <p className="mt-3 text-sm font-bold text-ocean-deep dark:text-white">
                                            {(selectedItem.originalData as Invoice).invoiceNumber}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Status: {(selectedItem.originalData as Invoice).status}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-5 border border-slate-200 dark:border-white/10">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Balance Due</p>
                                        <p className="mt-3 text-sm font-bold text-ocean-deep dark:text-white">
                                            ${(selectedItem.originalData as Invoice).balanceDue.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Total: ${(selectedItem.originalData as Invoice).total.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Link
                                    to={getDetailLink(selectedItem)}
                                    className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                                >
                                    Open Related Page
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
