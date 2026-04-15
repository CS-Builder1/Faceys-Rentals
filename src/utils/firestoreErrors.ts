type ErrorWithCode = {
    code?: unknown
}

function getErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
        return null
    }

    const { code } = error as ErrorWithCode
    return typeof code === 'string' ? code : null
}

export function isFirestorePermissionDenied(error: unknown): boolean {
    return getErrorCode(error) === 'permission-denied'
}

export function getPublicDataErrorMessage(resourceName: string, error: unknown): string {
    const code = getErrorCode(error)

    switch (code) {
        case 'permission-denied':
            return `The ${resourceName} is temporarily unavailable while secure database access is being restored. Please request a quote and our team will help you directly.`
        case 'unavailable':
        case 'deadline-exceeded':
            return `We are having trouble reaching the ${resourceName} right now. Please try again shortly.`
        default:
            return `Failed to load ${resourceName}. Please try again later.`
    }
}
