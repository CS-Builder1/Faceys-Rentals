import test from 'node:test'
import assert from 'node:assert/strict'
import { createFollowUpUpdate, getHoursSince, isQuoteFollowUpOverdue } from './quoteWorkflow.ts'

const makeQuote = (overrides = {}) => ({
    id: 'q-1',
    eventId: '',
    total: 0,
    tax: 0,
    discount: 0,
    depositRequired: 0,
    expirationDate: new Date('2026-01-10T00:00:00.000Z'),
    status: 'sent',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
})

test('getHoursSince computes integer age in hours', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const now = new Date('2026-01-02T12:30:00.000Z')
    assert.equal(getHoursSince(createdAt, now), 36)
})

test('isQuoteFollowUpOverdue flags sent quotes older than 24h', () => {
    const quote = makeQuote()
    const now = new Date('2026-01-02T01:00:00.000Z')
    assert.equal(isQuoteFollowUpOverdue(quote, now), true)
})

test('createFollowUpUpdate increments count and marks sent quote reviewed', () => {
    const quote = makeQuote({ followUpCount: 1, status: 'sent' })
    const contactedAt = new Date('2026-01-03T08:00:00.000Z')

    assert.deepEqual(createFollowUpUpdate(quote, contactedAt), {
        followUpCount: 2,
        lastContactedAt: contactedAt,
        status: 'reviewed',
    })
})
