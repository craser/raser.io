/* A few standard Set operations aren't well-supported in browsers just yet, so we'll implement them here. (Considered
 * a polyfill, decided this was simpler. Time will tell.)
 */

export function setIntersection(a, b) {
    let i = new Set();
    a.forEach(e => {
        if (b.has(e)) {
            i.add(e);
        }
    });
    return i;
}
