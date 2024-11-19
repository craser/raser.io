import { getLatest, updateCache } from '@/lib/edge/latest';

/**
 * - If there is no cached value, retrieve a fresh value and return it, then add that value to the cache.
 * - Else, if the current cached value is less than 5 minutes old, return the cached value.
 * - Else, try to retrieve a fresh value. If that takes longer than 300ms, return the cached value, but refresh the cash
 *   with the value when it arrives.  If retrieving the fresh value happens in less than 300ms, return the fresh value
 *   and then cache it.
 *
 * @param request
 * @returns {Promise<NextResponse<{latest}>>}
 */
export function GET(request) {
    return getLatest();
}
