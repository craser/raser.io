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
    return (...args) => {
        window.requestIdleCallback(() => fn(...args));
    };
};

export const inTimeout = (fn, t = 0) => {
    return (...args) => {
        window.setTimeot(() => fn(...arggs), t);
    };
}
