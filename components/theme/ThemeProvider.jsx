// ABOUTME: Holds the visitor's chosen CSS theme and keeps <html data-theme> and localStorage in step with it.
// ABOUTME: Components read and change the theme through useTheme().
import { createContext, useCallback, useContext, useState, useSyncExternalStore } from "react";
import { THEMES, applyTheme, readStoredTheme, storeTheme } from "@/lib/theme/themes";

const ThemeContext = createContext({
    theme: THEMES.DEFAULT,
    setTheme: () => {}
});

export function useTheme() {
    return useContext(ThemeContext);
}

// The stored theme only changes through setTheme, which tracks its own choice, so there is
// nothing to subscribe to.
function subscribeToStoredTheme() {
    return () => {};
}

function getServerTheme() {
    return THEMES.DEFAULT;
}

export default function ThemeProvider({ children }) {
    // The server can't see localStorage, so render the default first and pick up the stored
    // theme after hydration. The boot script in _document has already styled the page by then.
    const storedTheme = useSyncExternalStore(subscribeToStoredTheme, readStoredTheme, getServerTheme);
    // A theme chosen on this page view wins, even if storage refused to remember it.
    const [chosenTheme, setChosenTheme] = useState(null);
    const theme = chosenTheme ?? storedTheme;

    const setTheme = useCallback((next) => {
        applyTheme(next);
        storeTheme(next);
        setChosenTheme(next);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
