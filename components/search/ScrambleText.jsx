// ABOUTME: A component that displays text with a terminal-style scramble animation.
// ABOUTME: Characters cycle through random glyphs before settling on the final text.

import React, { useState, useEffect, useRef } from 'react';

// Characters used during the scramble effect - mix of letters, numbers, and block chars
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789█▓░│─┌┐└┘';

/**
 * Displays text with a scramble animation effect.
 * When the text prop changes, characters scramble then resolve to the new value.
 *
 * @param {string} text - The final text to display
 * @param {number} duration - Animation duration in ms (default 1000)
 */
export default function ScrambleText({ text, duration = 1000 }) {
    const [displayText, setDisplayText] = useState(text);
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);

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
    }, [text, duration]);

    return (
        <span data-testid="scramble-text">{displayText}</span>
    );
}
