/**
 * Debounce function to prevent multiple calls within a given time frame.
 *
 * @param callback
 * @param wait
 * @returns {(function(...[*]): void)|*}
 */
export const debounce = (callback, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), wait);
    };
};

export const inIdle = (fn) => {
    if (window.requestIdleCallback) { // hacky solution to browsers that don't support this...
        return (...args) => {
            window.requestIdleCallback(() => fn(...args));
        };
    } else {
        return inTimeout(fn, 0);
    }
};

export const inTimeout = (fn, t = 0) => {
    return (...args) => {
        window.setTimeout(() => fn(...args), t);
    };
}
