/**
 * Returns a wrapper function that logs the elapsed time of the wrapped function.
 *
 * @param fn
 * @returns {function(...[*]): *}
 */
export function time(fn) {
    return (...args) => {
        const start = performance.now();
        const result = fn(...args);
        console.log(`Execution time of ${fn.name}: ${performance.now() - start} ms`);
        return result;
    }
}
