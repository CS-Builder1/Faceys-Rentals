import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateBalanceDue } from './invoiceCalculations.ts'

test('calculateBalanceDue subtracts deposit from total', () => {
    assert.equal(calculateBalanceDue(1000, 250), 750)
})

test('calculateBalanceDue never returns a negative value', () => {
    assert.equal(calculateBalanceDue(500, 600), 0)
})

