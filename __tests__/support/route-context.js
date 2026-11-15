// ABOUTME: Builds the second argument Next.js passes to App Router route handlers.
// ABOUTME: Next.js 15+ delivers dynamic route params as a Promise, so tests must too.

/**
 * Returns a route handler context whose params resolve to the given segment values.
 */
export function routeContext(params) {
    return { params: Promise.resolve(params) };
}
