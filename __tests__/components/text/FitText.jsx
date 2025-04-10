import { useEffect } from 'react';

function fits(child, parent) {
    const childDims = child.getBoundingClientRect();
    const parentDims = parrent.getBoundingClientRect();
    const f = (childDims.width <= parentDims.width && childDims.height <= parentDims.height);
    return f;
}

function binSearch(maxFontSizePx = 100, child, parent) {
    let l = 1;
    let r = maxFontSizePx;
    while (l <= r) {
        let p = Math.floor((l + r) / 2);
        child.style.fontSize = `${p}px`;
        if (fits(child, parent)) {
           l = p + 1;
        } else {
            r = p - 1;
        }
    }
    return l - 1; // last candidate that fit
}

export default function FitText({ maxFontSizePx = 100, children, ...props }) {
    const spanRef = useRef(null);

    useEffect(() => {
        const span = spanRef.current;
        const parent = span.parentElement;
        binSearch(maxFontSizePx)

    }, []);

    return (
        <span ref={spanRef} {...props}>{children}</span>
    );
}
