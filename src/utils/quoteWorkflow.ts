import type { Quote } from '../types'

const QUOTE_STATUS_SENT = 'sent'
const QUOTE_STATUS_REVIEWED = 'reviewed'

export function getHoursSince(createdAt: Date, now: Date = new Date()): number {
    return Math.max(Math.floor((now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60)), 0)
}

export function isQuoteFollowUpOverdue(quote: Quote, now: Date = new Date()): boolean {
    return quote.status === QUOTE_STATUS_SENT && getHoursSince(new Date(quote.createdAt), now) >= 24
}

export function createFollowUpUpdate(quote: Quote, contactedAt: Date = new Date()): Partial<Quote> {
    return {
        followUpCount: (quote.followUpCount || 0) + 1,
        lastContactedAt: contactedAt,
        status: quote.status === QUOTE_STATUS_SENT ? (QUOTE_STATUS_REVIEWED as Quote['status']) : quote.status,
    }
}
