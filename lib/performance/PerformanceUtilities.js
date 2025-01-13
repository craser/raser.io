export function time(fn) {
    return (...args) => {
        const start = performance.now();
        const result = fn(...args);
        console.log(`Execution time: ${performance.now() - start} ms`);
        return result;
    }
}
