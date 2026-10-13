// ABOUTME: A component that displays text with a terminal-style scramble animation.
// ABOUTME: Characters cycle through random glyphs before settling on the final text.

import React, { useState, useEffect, useRef } from 'react';

// Characters used during the scramble effect - mix of letters, numbers, and block chars
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789█▓░│─┌┐└┘';

function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Displays text with a scramble animation effect.
 *
 * trigger="change" (default): characters scramble then resolve whenever the text prop changes.
 * trigger="visible": the text renders as-is until the element first scrolls into view, then
 * scrambles and resolves once. Without IntersectionObserver support it never animates.
 *
 * No animation runs when the user prefers reduced motion.
 *
 * @param {string} text - The final text to display
 * @param {number} duration - Animation duration in ms (default 1000)
 * @param {'change'|'visible'} trigger - What starts the animation (default 'change')
 */
export default function ScrambleText({ text, duration = 1000, trigger = 'change' }) {
    const [displayText, setDisplayText] = useState(text);
    const [hasBeenSeen, setHasBeenSeen] = useState(false);
    const elementRef = useRef(null);
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);

    // In visible mode, wait for the first time the element enters the viewport.
    useEffect(() => {
        if (trigger !== 'visible' || typeof window.IntersectionObserver === 'undefined') {
            return;
        }
        const observer = new window.IntersectionObserver((entries) => {
            if (entries.some(entry => entry.isIntersecting)) {
                observer.disconnect();
                setHasBeenSeen(true);
            }
        });
        observer.observe(elementRef.current);
        return () => observer.disconnect();
    }, [trigger]);

    useEffect(() => {
        // Cancel any existing animation
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        // Handle empty string
        if (!text) {
            setDisplayText('');
            return;
        }

        if ((trigger === 'visible' && !hasBeenSeen) || prefersReducedMotion()) {
            setDisplayText(text);
            return;
        }

        startTimeRef.current = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            if (progress >= 1) {
                // Animation complete - show final text
                setDisplayText(text);
                return;
            }

            // Build scrambled text
            // Characters resolve left-to-right with some randomness
            const chars = text.split('').map((char, index) => {
                // Preserve spaces
                if (char === ' ') {
                    return ' ';
                }

                // Calculate when this character should resolve
                // Earlier characters resolve sooner, with some randomness
                const charProgress = (index / text.length) * 0.7; // Base progress threshold
                const resolveAt = charProgress + (Math.random() * 0.3); // Add randomness

                if (progress > resolveAt) {
                    return char; // Show final character
                }

                // Show random scramble character
                return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            });

            setDisplayText(chars.join(''));
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [text, duration, trigger, hasBeenSeen]);

    return (
        <span ref={elementRef} data-testid="scramble-text">{displayText}</span>
    );
}
