import { createContext, useContext } from "react";

const LoggingContextObj = createContext({
    debug: (...args) => console.debug(...args),
    info: (...args) => console.info(...args),
    log: (...args) => console.log(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
})

export function useLogging() {
    return useContext(LoggingContextObj);
}

export default function LoggingContext({ children }) {
    const context = useLogging();
    return (
        <LoggingContextObj.Provider value={context}>
            {children}
        </LoggingContextObj.Provider>
    );
}
