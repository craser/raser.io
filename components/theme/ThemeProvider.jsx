// ABOUTME: Holds the visitor's chosen CSS theme and keeps <html data-theme> and localStorage in step with it.
// ABOUTME: Components read and change the theme through useTheme().
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { THEMES, applyTheme, readStoredTheme, storeTheme } from "@/lib/theme/themes";

const ThemeContext = createContext({
    theme: THEMES.DEFAULT,
    setTheme: () => {}
});

export function useTheme() {
    return useContext(ThemeContext);
}

export default function ThemeProvider({ children }) {
    // The server can't see localStorage, so render the default first and pick up the stored
    // theme after mount. The boot script in _document has already styled the page by then.
    const [theme, setThemeState] = useState(THEMES.DEFAULT);

    useEffect(() => {
        setThemeState(readStoredTheme());
    }, []);

    const setTheme = useCallback((next) => {
        applyTheme(next);
        storeTheme(next);
        setThemeState(next);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
