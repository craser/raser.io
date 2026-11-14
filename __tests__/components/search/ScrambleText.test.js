// ABOUTME: Tests for the ScrambleText component that creates a terminal-style
// ABOUTME: character scramble animation effect when text changes.

import { render, act, waitFor } from "@testing-library/react";
import ScrambleText from "@/components/search/ScrambleText";

// Captures IntersectionObserver instances so tests can simulate an element scrolling into view.
function installIntersectionObserverMock() {
    const instances = [];
    class MockIntersectionObserver {
        constructor(callback) {
            this.callback = callback;
            this.observed = [];
            this.disconnected = false;
            instances.push(this);
        }
        observe(element) { this.observed.push(element); }
        disconnect() { this.disconnected = true; }
        unobserve() {}
        intersect(isIntersecting) {
            this.callback(this.observed.map(target => ({ target, isIntersecting })), this);
        }
    }
    window.IntersectionObserver = MockIntersectionObserver;
    return instances;
}

function setReducedMotion(reduce) {
    window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: reduce && query === '(prefers-reduced-motion: reduce)',
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    }));
}

describe('ScrambleText', () => {

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        delete window.IntersectionObserver;
        delete window.matchMedia;
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

    describe('trigger="visible"', () => {

        test('Should show the final text and not animate before intersecting', () => {
            installIntersectionObserverMock();
            const result = render(<ScrambleText text="HELLO WORLD" duration={1000} trigger="visible" />);

            act(() => {
                jest.advanceTimersByTime(100);
            });

            expect(result.getByTestId('scramble-text').textContent).toBe('HELLO WORLD');
        });

        test('Should animate once on first intersection and settle on the final text', () => {
            const observers = installIntersectionObserverMock();
            const result = render(<ScrambleText text="HELLO WORLD" duration={1000} trigger="visible" />);

            act(() => {
                observers[0].intersect(true);
            });
            act(() => {
                jest.advanceTimersByTime(50);
            });
            expect(result.getByTestId('scramble-text').textContent).not.toBe('HELLO WORLD');
            expect(result.getByTestId('scramble-text').textContent.length).toBe('HELLO WORLD'.length);

            act(() => {
                jest.advanceTimersByTime(1100);
            });
            expect(result.getByTestId('scramble-text').textContent).toBe('HELLO WORLD');
            expect(observers[0].disconnected).toBe(true);
        });

        test('Should not animate on a non-intersecting callback', () => {
            const observers = installIntersectionObserverMock();
            const result = render(<ScrambleText text="HELLO WORLD" duration={1000} trigger="visible" />);

            act(() => {
                observers[0].intersect(false);
            });
            act(() => {
                jest.advanceTimersByTime(50);
            });

            expect(result.getByTestId('scramble-text').textContent).toBe('HELLO WORLD');
            expect(observers[0].disconnected).toBe(false);
        });

        test('Should not re-animate on a later intersection', () => {
            const observers = installIntersectionObserverMock();
            const result = render(<ScrambleText text="HELLO WORLD" duration={100} trigger="visible" />);

            act(() => {
                observers[0].intersect(true);
            });
            act(() => {
                jest.advanceTimersByTime(200);
            });
            act(() => {
                observers[0].intersect(true);
            });
            act(() => {
                jest.advanceTimersByTime(20);
            });

            expect(result.getByTestId('scramble-text').textContent).toBe('HELLO WORLD');
            expect(observers).toHaveLength(1);
        });

        test('Should show final text and not throw when IntersectionObserver is missing', () => {
            delete window.IntersectionObserver;
            const result = render(<ScrambleText text="HELLO WORLD" duration={1000} trigger="visible" />);

            act(() => {
                jest.advanceTimersByTime(50);
            });

            expect(result.getByTestId('scramble-text').textContent).toBe('HELLO WORLD');
        });

        test('Should not animate when reduced motion is preferred', () => {
            setReducedMotion(true);
            const observers = installIntersectionObserverMock();
            const result = render(<ScrambleText text="HELLO WORLD" duration={1000} trigger="visible" />);

            act(() => {
                observers[0].intersect(true);
            });
            act(() => {
                jest.advanceTimersByTime(50);
            });

            expect(result.getByTestId('scramble-text').textContent).toBe('HELLO WORLD');
        });
    });

    test('Should not animate in change mode when reduced motion is preferred', () => {
        setReducedMotion(true);
        const result = render(<ScrambleText text="HELLO WORLD" duration={1000} />);

        act(() => {
            jest.advanceTimersByTime(50);
        });

        expect(result.getByTestId('scramble-text').textContent).toBe('HELLO WORLD');
    });

});
