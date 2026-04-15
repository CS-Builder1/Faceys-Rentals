export function calculateBalanceDue(total: number, depositAmount: number): number {
    return Math.max(total - depositAmount, 0)
}

