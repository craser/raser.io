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
