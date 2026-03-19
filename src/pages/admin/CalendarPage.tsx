import { useState, useEffect } from 'react'
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
                    let start = new Date(e.eventDate)
                    let end = new Date(e.eventDate)
                    
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
                            onSelectEvent={(event) => {
                                console.log("Selected event:", event)
                                // We can add a generic modal here to view details based on event.type
                                alert(`Clicked ${event.type}: ${event.title}`)
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
