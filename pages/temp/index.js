import { createContext, useContext, useEffect, useState } from "react";

const GlobalAccessContextObject = createContext({
    value: null
});

function useGlobalAccessContext() {
    const ctx = useContext(GlobalAccessContextObject);
    return ctx;
}

function ContextClient() {
    const ctx = useGlobalAccessContext();
    return <div>value: {ctx.value}</div>
}

function InertChild() {
    return (
        <div>I want to live a life of danger!</div>
    )
}

function GlobalAccessContext({ children }) {
    const [value, setValue] = useState(null);

    useEffect(() => {
        window.setGlobalAccessValue = (v) => {
            setValue(v);
        };
        window.getGlobalAccessValue = () => {
            return value;
        };
    }, [value]);

    return (
        <GlobalAccessContextObject.Provider value={{ value }}>
            {children}
        </GlobalAccessContextObject.Provider>
    );
}

export default function IndexPage() {
    return (
        <GlobalAccessContext>
            <ContextClient/>
            <InertChild />
        </GlobalAccessContext>
    );
}
