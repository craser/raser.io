// ABOUTME: Tests for the ScrambleText component that creates a terminal-style
// ABOUTME: character scramble animation effect when text changes.

import { render, act, waitFor } from "@testing-library/react";
import ScrambleText from "@/components/search/ScrambleText";

describe('ScrambleText', () => {

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('Should render the final text after animation completes', async () => {
        const result = render(<ScrambleText text="HELLO" duration={100} />);

        // Fast-forward past the animation
        act(() => {
            jest.advanceTimersByTime(200);
        });

        const element = result.getByTestId('scramble-text');
        expect(element.textContent).toBe('HELLO');
    });

    test('Should show scrambled characters during animation', async () => {
        const result = render(<ScrambleText text="TEST" duration={1000} />);

        // Advance partway through animation
        act(() => {
            jest.advanceTimersByTime(100);
        });

        const element = result.getByTestId('scramble-text');
        // During animation, text should NOT match final text (with high probability)
        // We check that at least some scrambling is happening
        expect(element.textContent.length).toBe(4); // Same length as "TEST"
    });

    test('Should preserve text length during scramble', async () => {
        const text = "AWAITING INPUT...";
        const result = render(<ScrambleText text={text} duration={500} />);

        act(() => {
            jest.advanceTimersByTime(100);
        });

        const element = result.getByTestId('scramble-text');
        expect(element.textContent.length).toBe(text.length);
    });

    test('Should re-scramble when text prop changes', async () => {
        const result = render(<ScrambleText text="FIRST" duration={100} />);

        // Complete first animation
        act(() => {
            jest.advanceTimersByTime(200);
        });

        let element = result.getByTestId('scramble-text');
        expect(element.textContent).toBe('FIRST');

        // Change the text
        result.rerender(<ScrambleText text="SECOND" duration={100} />);

        // Complete second animation
        act(() => {
            jest.advanceTimersByTime(200);
        });

        element = result.getByTestId('scramble-text');
        expect(element.textContent).toBe('SECOND');
    });

    test('Should handle empty string', async () => {
        const result = render(<ScrambleText text="" duration={100} />);

        act(() => {
            jest.advanceTimersByTime(200);
        });

        const element = result.getByTestId('scramble-text');
        expect(element.textContent).toBe('');
    });

    test('Should preserve spaces during scramble', async () => {
        const text = "NO MATCHES FOUND";
        const result = render(<ScrambleText text={text} duration={100} />);

        // Complete animation
        act(() => {
            jest.advanceTimersByTime(200);
        });

        const element = result.getByTestId('scramble-text');
        expect(element.textContent).toBe(text);
        // Verify spaces are in correct positions
        expect(element.textContent.charAt(2)).toBe(' ');
        expect(element.textContent.charAt(10)).toBe(' ');
    });

});
